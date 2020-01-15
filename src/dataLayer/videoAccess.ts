import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { Video } from '../models/Video'

const XAWS = AWSXRay.captureAWS(AWS)

const s3 = new XAWS.S3({
  signatureVersion: 'v4'
})

export class VideoAccess {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly bucketName = process.env.VIDEOS_S3_BUCKET,
    private readonly urlExpiration = +process.env.SIGNED_URL_EXPIRATION,
    private readonly videoTable = process.env.VIDEOS_TABLE) {
  }

  generateUploadUrl(videoId: string): string {
    return s3.getSignedUrl('putObject', {
      Bucket: this.bucketName,
      Key: videoId,
      Expires: this.urlExpiration
    })
  }

  getVideoUrl(videoId: string): string {
    return `https://${this.bucketName}.s3.amazonaws.com/${videoId}`
  }

  async addVideo(video: Video) {
    await this.docClient.put({
      TableName: this.videoTable,
      Item: video
    }).promise()
  }

  async deleteVideo(videographerId: string, id: string) {
    return await this.docClient.delete({
      TableName: this.videoTable,
      Key: {
        videographerId: videographerId,
        id: id
      },
      ConditionExpression: 'id = :id',
      ExpressionAttributeValues: {
        ':id': id,
        
      }
    }).promise()
  }

  async getVideos(videographerId: string) {
    const result = await this.docClient.query({
      TableName: this.videoTable,
      KeyConditionExpression: 'videographerId = :videographerId',
      ExpressionAttributeValues: {
        ':videographerId': videographerId
      }
    }).promise();

    return result.Items as Video[];
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