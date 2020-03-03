import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient, ScanOutput, Key } from 'aws-sdk/clients/dynamodb'
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
    private readonly videoTable = process.env.VIDEOS_TABLE,
    private readonly videoIdIndex = process.env.VIDEO_ID_INDEX,
    private readonly videoTimestampIndex = process.env.VIDEO_TIMESTAMP_INDEX) {
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
    video.type = 'video';

    await this.docClient.put({
      TableName: this.videoTable,
      Item: video
    }).promise()
  }

  async editVideo(video: Video, videoId: string): Promise<Video> {
    const result = await this.docClient.update({
      TableName: this.videoTable,
      Key: {
        videographerId: video.videographerId,
        id: videoId
      },
      ConditionExpression: 'id = :id',
      UpdateExpression: 'set title = :title, description = :description',
      ExpressionAttributeValues: {
        ':title': video.title,
        ':description': video.description,
        ':id': video.id
      },
      ReturnValues: 'ALL_NEW'
    }).promise()

    return result.Attributes as Video;
  }1

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

  async getVideographerVideos(videographerId: string): Promise<Video[]> {
    const result = await this.docClient.query({
      TableName: this.videoTable,
      KeyConditionExpression: 'videographerId = :videographerId',
      ExpressionAttributeValues: {
        ':videographerId': videographerId
      }
    }).promise();

    return result.Items as Video[];
  }

  async getVideos(timestamp:string): Promise<[Video[], string]> {
    console.log(timestamp);
    let result;

    if (timestamp) {
      const key: Key = {
        ["timestamp"]: { S:timestamp}
      };  

      result = await this.docClient.query({
         TableName: this.videoTable,
         IndexName: this.videoTimestampIndex,
         ExclusiveStartKey: key,
         ScanIndexForward: false, 
         ExpressionAttributeNames: {
          '#type': 'type'
        },
         KeyConditionExpression: '#type == :type',
         ExpressionAttributeValues: {
           ':type': 'video'
         },
        Limit: 10
      }).promise();
    }else {
      result = await this.docClient.query({
        TableName: this.videoTable,
        IndexName: this.videoTimestampIndex,
        ScanIndexForward: false, 
        ExpressionAttributeNames: {
          '#type': 'type'
        },
        KeyConditionExpression: '#type = :type',
        ExpressionAttributeValues: {
          ':type': 'video'
        },
        Limit: 3
      }).promise(); 
    }

    console.log(result.Items as Video[]);
    return [result.Items as Video[], result.LastEvaluatedKey];
  }

  async getVideo(videoId: string): Promise<Video> {
    const result = await this.docClient.query({
      TableName: this.videoTable,
      IndexName: this.videoIdIndex,
      KeyConditionExpression: 'id = :videoId',
      ExpressionAttributeValues: {
        ':videoId': videoId
      }
    }).promise();
  
    return result.Items[0] as Video;
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