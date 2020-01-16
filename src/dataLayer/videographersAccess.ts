import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { Videographer } from '../models/Videographer'
import { UpdateVideographerRequest } from '../requests/UpdateVideographerRequest'

const XAWS = AWSXRay.captureAWS(AWS)

export class VideographerAccess {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly vidographersTable = process.env.VIDEOGRAPHERS_TABLE,
    private readonly bucketName = process.env.PROFILE_PIC_S3_BUCKET) {
  }

  async addProfilePicture(videographerId: string) {
    const link = `https://${this.bucketName}.s3.amazonaws.com/${videographerId}`;

    await this.docClient.update({
      TableName: this.vidographersTable,
      Key: {
        id: videographerId,
      },
      ConditionExpression: 'id = :videographerId',
      UpdateExpression: 'set pictureUrl = :pictureUrl',
      ExpressionAttributeValues: {
        ':pictureUrl': link,
        ':videographerId': videographerId
      },
    }).promise();
  }

  async createVideographer(videographer: Videographer) {
    await this.docClient.put({
      TableName: this.vidographersTable,
      Item: videographer
    }).promise();

    return videographer;
  }

  async updateVideographer(videographerId: string, updatedVideographer: UpdateVideographerRequest): Promise<Videographer> {
    const result = await this.docClient.update({
      TableName: this.vidographersTable,
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
      TableName: this.vidographersTable,
      Key: {
        id: videographerId
      }
    }).promise()

    console.log(result)

    return result.Item as Videographer
  }

  async getVideographers(): Promise<Videographer[]> {
    const result = await this.docClient.scan({
      TableName: this.vidographersTable
    }).promise()

    return result.Items as Videographer[]
  }

  async videographerExists(videographerId: string): Promise<boolean> {
    const result = await this.docClient.get({
      TableName: this.vidographersTable,
      Key: {
        id: videographerId
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