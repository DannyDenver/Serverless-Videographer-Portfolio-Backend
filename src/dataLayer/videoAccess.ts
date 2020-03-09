import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient, Key } from 'aws-sdk/clients/dynamodb'
import { VideoDb } from '../models/VideoDb'
import { videosDBtoEntity } from '../utils/DboToEntityMapper'
import { Video } from '../models/Video'
import { videoToVideoDb } from '../utils/EntityToDboMapper'
import { VideographerAccess } from './videographersAccess'

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
    private readonly appTable = process.env.APP_DB_TABLE,
    private readonly mediaTypeIndex = process.env.MEDIA_TYPE_INDEX,
    private readonly videographersAccess = new VideographerAccess()) {
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
    const primaryKey = "USER#" + video.videographerId;
    const sortKey = "VIDEO#" + video.id;

    const videographer = await this.videographersAccess.getVideographer(video.videographerId);
    if (videographer) {
      video.firstName = videographer.firstName;
      video.lastName = videographer.lastName;
      video.profilePic = videographer.profilePic;

      const videoDb: VideoDb = videoToVideoDb(video);

      const result = await this.docClient.put({
        TableName: this.appTable,
        Item: videoDb
      }).promise();

      return result;
    }

    return;
  }

  // async editVideo(video: VideoDb, videoId: string): Promise<VideoDb> {
  //   const result = await this.docClient.update({
  //     TableName: this.videoTable,
  //     Key: {
  //       videographerId: video.videographerId,
  //       id: videoId
  //     },
  //     ConditionExpression: 'id = :id',
  //     UpdateExpression: 'set title = :title, description = :description',
  //     ExpressionAttributeValues: {
  //       ':title': video.title,
  //       ':description': video.description,
  //       ':id': video.id
  //     },
  //     ReturnValues: 'ALL_NEW'
  //   }).promise()

  //   return result.Attributes as VideoDb;
  // }

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

  async getVideographerVideos(videographerId: string): Promise<VideoDb[]> {
    const result = await this.docClient.query({
      TableName: this.videoTable,
      KeyConditionExpression: 'videographerId = :videographerId',
      ExpressionAttributeValues: {
        ':videographerId': videographerId
      }
    }).promise();

    return result.Items as VideoDb[];
  }

  async getVideos(timestamp:string): Promise<[Video[], string]> {
    console.log(timestamp);

    const result = await this.docClient.query({
        TableName: this.appTable,
        IndexName: this.mediaTypeIndex,
        KeyConditionExpression: 'mediaType = :mediaType',
        ExpressionAttributeValues: {
          ':mediaType': 'Video'
        },
        ScanIndexForward: false,
        Limit: 20
      }).promise();

    const lastKey = result.LastEvaluatedKey ? result.LastEvaluatedKey.toString() : null;
    
    return [videosDBtoEntity(result.Items as VideoDb[]), lastKey];
  }

  async getVideo(videoId: string): Promise<VideoDb> {
    const result = await this.docClient.query({
      TableName: this.videoTable,
      IndexName: this.videoIdIndex,
      KeyConditionExpression: 'id = :videoId',
      ExpressionAttributeValues: {
        ':videoId': videoId
      }
    }).promise();
  
    return result.Items[0] as VideoDb;
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