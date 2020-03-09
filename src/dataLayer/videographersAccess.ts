import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { VideographerDb } from '../models/VideographerDb';
import { Videographer } from '../models/Videographer';
import { videographersDBtoShortEntity, videographerDBtoEntity } from '../utils/DboToEntityMapper';

const XAWS = AWSXRay.captureAWS(AWS)

export class VideographerAccess {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly videographersTable = process.env.VIDEOGRAPHERS_TABLE,
    private readonly bucketName = process.env.PROFILE_PIC_S3_BUCKET,
    private readonly appTable = process.env.APP_DB_TABLE) {
  }

  async addProfilePicture(videographerId: string) {
    const link = `https://${this.bucketName}.s3.amazonaws.com/${videographerId}`;

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

  async createVideographer(userId, newVideographer: Videographer): Promise<Videographer> {
    const partitionKey = "USER#" + userId;
    const sortKey = "PROFILE#" + userId;

    const newVideographerDb: VideographerDb = {
      PK: partitionKey,
      SK: sortKey,
      firstName: newVideographer.firstName,
      lastName: newVideographer.lastName,
      location: newVideographer.location || null,
      bio: newVideographer.bio || null,
      profilePic: newVideographer.profilePic || null,
      coverPhoto: newVideographer.coverPhoto || null,
    };

    const result = await this.docClient.put({
      TableName: this.appTable,
      Item: newVideographerDb
    }).promise();

    const createdVideographerDb = result.Attributes as VideographerDb;
    console.log(newVideographer);

    return videographerDBtoEntity(createdVideographerDb);
  }

  async addSubscriber(videographerId: string, email: string) {
    console.log("trying to add subscriber");
    const result = await this.docClient.update({
      TableName: this.videographersTable,
      Key: {
        id: videographerId,
      },
      ConditionExpression: 'id = :videographerId',
      UpdateExpression: "SET #subscribers = list_append(if_not_exists(#subscribers, :empty_list), :email)",
      ExpressionAttributeNames: {
        '#subscribers': 'subscribers'
      },
      ExpressionAttributeValues: {
        ':videographerId': videographerId,
        ':email': [email],
        ':empty_list': []
      },
      ReturnValues: 'ALL_NEW'
    }).promise();

    return result.Attributes as VideographerDb;
  }

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
  }

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

    }).promise()

    console.log(result)

    return videographerDBtoEntity(result.Item as VideographerDb);
  }

  async getVideographers(): Promise<Videographer[]> {
    const result = await this.docClient.scan({
      TableName: this.appTable,
      ProjectionExpression: "SK, firstName, lastName, profilePic, PK, #loc",
      FilterExpression: 'begins_with(SK, :PROFILE)',
      ExpressionAttributeNames: {
        '#loc': 'location',
      },
      ExpressionAttributeValues: {
        ':PROFILE': 'PROFILE#'
      },
      Limit: 8
    }).promise();

    console.log(result);

    return result.Items.map((videographer: VideographerDb) => videographersDBtoShortEntity(videographer));
  }

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
  }
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