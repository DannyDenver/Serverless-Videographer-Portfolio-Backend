import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { VideographerDb } from '../models/VideographerDb';
import { NewVideographerRequest } from '../requests/NewVideographerRequest';

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

  async createVideographer(videographer: VideographerDb): Promise<VideographerDb> {
    const result = await this.docClient.put({
      TableName: this.appTable,
      Item: videographer
    }).promise();

    const newVideographer = result.Attributes as VideographerDb;
    console.log(newVideographer);

    return newVideographer;
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

    return result.Attributes as VideographerDb;  }

  async updateVideographer(videographerId: string, updatedVideographer: NewVideographerRequest): Promise<VideographerDb> {
    const result = await this.docClient.update({
      TableName: this.videographersTable,
      Key: {
        id: videographerId,
      },
      ConditionExpression: 'id = :videographerId',
      UpdateExpression: 'set firstName = :firstame, lastName = :lastName, #loc = :location, bio = :bio, email = :email',
      ExpressionAttributeNames: {
        '#loc': 'location'
      },
      ExpressionAttributeValues: {
        ':videographerId': videographerId,
        ':firstame': updatedVideographer.firstName,
        ':lastName': updatedVideographer.lastName,
        ':location': updatedVideographer.location,
        ':bio': updatedVideographer.bio,
        ':email': updatedVideographer.email
      },
      ReturnValues: 'ALL_NEW'
    }).promise();

    return result.Attributes as Videographer;
  }

  async getVideographer(videographerId: string): Promise<Videographer> {
    console.log('Getting videographer', videographerId)

    const result = await this.docClient.get({
      TableName: this.videographersTable,
      Key: {
        id: videographerId
      },

    }).promise()

    console.log(result)

    return result.Item as Videographer
  }

  async getVideographers(): Promise<Videographer[]> {
    const result = await this.docClient.scan({
      TableName: this.videographersTable
    }).promise()

    return result.Items as Videographer[]
  }

  async videographerExists(videographerId: string): Promise<boolean> {
    const key = "User#" + videographerId;
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