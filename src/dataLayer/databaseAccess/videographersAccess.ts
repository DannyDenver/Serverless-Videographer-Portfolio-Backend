import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { VideographerDb } from '../../models/VideographerDb';
import { Videographer } from '../../models/Videographer';
import { videographersDBtoShortEntity, videographerDBtoEntity, videographerToDb, portfolioDBtoEntity } from '../../utils/DboToEntityMapper';

const XAWS = AWSXRay.captureAWS(AWS)

export class VideographerAccess {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly bucketName = process.env.PROFILE_PIC_S3_BUCKET,
    private readonly coverPhotoBucket = process.env.COVER_PHOTO_S3_BUCKET,
    private readonly firstLastIndex = process.env.FIRST_LAST_NAME_INDEX,
    private readonly appTable = process.env.APP_DB_TABLE) {
  }

  async addProfilePicture(videographerId: string, imageId: string) {
    const link = `https://${this.bucketName}.s3.amazonaws.com/${imageId}`;

    const primaryKey = 'USER#' + videographerId;
    const sortKey = 'PROFILE#' + videographerId;

    await this.docClient.update({
      TableName: this.appTable,
      Key: {
        PK: primaryKey,
        SK: sortKey
      },
      UpdateExpression: 'set profilePic = :pictureUrl',
      ExpressionAttributeValues: {
        ':pictureUrl': link,
      },
    }).promise();
  }

  async addCoverPhoto(videographerId: string) {
    const link = `https://${this.coverPhotoBucket}.s3.amazonaws.com/${videographerId}`;

    const primaryKey = 'USER#' + videographerId;
    const sortKey = 'PROFILE#' + videographerId;

    await this.docClient.update({
      TableName: this.appTable,
      Key: {
        PK: primaryKey,
        SK: sortKey
      },
      UpdateExpression: 'set coverPhoto = :coverPhoto',
      ExpressionAttributeValues: {
        ':coverPhoto': link,
      },
    }).promise();
  };

  async createVideographer(newVideographer: Videographer): Promise<Videographer> {
    const newVideographerDb = videographerToDb(newVideographer);

    await this.docClient.put({
      TableName: this.appTable,
      Item: newVideographerDb,
      ReturnValues: 'ALL_OLD'
    }).promise();

    return newVideographer;
  };

  async addSubscriber(videographerId: string, phoneNumber: string): Promise<Boolean> {
    console.log("Attempting to add subscriber");
    const primaryKey = "USER#" + videographerId;
    const sortKey = "PROFILE#" + videographerId;

    const result = await this.docClient.update({
      TableName: this.appTable,
      Key: {
        PK: primaryKey,
        SK: sortKey,
      },
      UpdateExpression: "ADD #subscribers :phoneNumber",
      ExpressionAttributeNames: {
        '#subscribers': 'subscribers'
      },
      ExpressionAttributeValues: {
        ':phoneNumber':  this.docClient.createSet([phoneNumber])
      },
      ReturnValues: 'ALL_NEW'
    }).promise();
    
    return result.$response.error ? false : true;
  };

  async removeSubscriber(firstName: string, lastName: string, phoneNumber: string): Promise<string> {
    console.log("Attempting to remove subscriber", firstName, lastName);

    try {
      const resultVideographer = await this.docClient.query({
        TableName: this.appTable,
        IndexName: this.firstLastIndex,
        KeyConditionExpression: 'firstName = :firstName and lastName = :lastName',
        ExpressionAttributeValues: {
          ':firstName': firstName,
          ':lastName': lastName
        }
      }).promise();
  
      if (!resultVideographer.Items) {
        return `Could not find ${firstName} ${lastName}.`
      }
  
      const portfolio = portfolioDBtoEntity(resultVideographer);
  
      const result = await this.docClient.update({
        TableName: this.appTable,
        Key: {
          PK: "USER#" + portfolio.profile.id,
          SK: "PROFILE#" + portfolio.profile.id
        },
        UpdateExpression: "DELETE #subscribers :phoneNumber",
        ExpressionAttributeNames: {
          '#subscribers': 'subscribers'
        },
        ExpressionAttributeValues: {
          ":phoneNumber": this.docClient.createSet([phoneNumber])
        }
      }).promise();
      return result.$response.error ? `Error occured while unsubscribing from ${firstName} ${lastName}.` : `Unsubscribed from ${firstName} ${lastName}.`;
    }catch {
      return `Error occured while unsubscribing from ${firstName} ${lastName}.`
    }
  };

  async updateVideographer(videographerId: string, updatedVideographer: Videographer): Promise<Videographer> {
    const partitionKey = "USER#" + videographerId;
    const sortKey = "PROFILE#" + videographerId;

    const result = await this.docClient.update({
      TableName: this.appTable,
      Key: {
        PK: partitionKey,
        SK: sortKey
      },
      UpdateExpression: 'set firstName = :firstame, lastName = :lastName, #loc = :location, bio = :bio',
      ExpressionAttributeNames: {
        '#loc': 'location'
      },
      ExpressionAttributeValues: {
        ':firstame': updatedVideographer.firstName,
        ':lastName': updatedVideographer.lastName,
        ':location': updatedVideographer.location,
        ':bio': updatedVideographer.bio,
      },
      ReturnValues: 'ALL_NEW'
    }).promise();

    console.log(result);

    const videographer = result.Attributes as VideographerDb;
    return videographerDBtoEntity(videographer);
  };

  async getVideographer(videographerId: string): Promise<Videographer> {
    console.log('Getting videographer', videographerId);

    const primaryKey = "USER#" + videographerId;
    const sortKey = "PROFILE#" + videographerId;

    const result = await this.docClient.get({
      TableName: this.appTable,
      Key: {
        PK: primaryKey,
        SK: sortKey,
      },
    }).promise();

    console.log(result)

    return videographerDBtoEntity(result.Item as VideographerDb);
  };

  async getVideographerSubscribers(videographerId: string): Promise<string[]> {
    console.log('Getting subscribers', videographerId);

    const primaryKey = "USER#" + videographerId;
    const sortKey = "PROFILE#" + videographerId;

    const result = await this.docClient.get({
      TableName: this.appTable,
      Key: {
        PK: primaryKey,
        SK: sortKey,
      },
    }).promise();

    return result.Item.subscribers;
  };

  async getVideographers(): Promise<Videographer[]> {
    console.log("getting videographers");
    const result = await this.docClient.scan({
      TableName: this.appTable,
      ProjectionExpression: "SK, firstName, lastName, profilePic, PK, #loc",
      FilterExpression: 'begins_with(SK, :PROFILE)',
      ExpressionAttributeNames: {
        '#loc': 'location',
      },
      ExpressionAttributeValues: {
        ':PROFILE': 'PROFILE#'
      }
    }).promise();

    console.log(result);

    return result.Items.map((videographer: VideographerDb) => videographersDBtoShortEntity(videographer));
  };

  async videographerExists(videographerId: string): Promise<boolean> {
    const key = "USER#" + videographerId;
    const sortKey = "PROFILE#" + videographerId;

    const result = await this.docClient.get({
      TableName: this.appTable,
      Key: {
        PK: key,
        SK: sortKey
      }
    }).promise()

    return !!result.Item
  };
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new XAWS.DynamoDB.DocumentClient()
}