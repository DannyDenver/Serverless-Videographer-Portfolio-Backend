import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient, Key } from 'aws-sdk/clients/dynamodb'
import { VideoDb } from '../models/VideoDb'
import { videosDBtoEntity, videoDBtoEntity } from '../utils/DboToEntityMapper'
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
    private readonly videoThumbnailPhotoBucket = process.env.VIDEO_THUMBNAIL_S3_BUCKET,
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

  async editVideo(video: Video): Promise<Video> {
    const primaryKey = 'USER#' + video.videographerId;
    const sortKey = 'VIDEO#' + video.id;


    const result = await this.docClient.update({
      TableName: this.appTable,
      Key: {
        PK: primaryKey,
        SK: sortKey
      },
      UpdateExpression: 'set title = :title, description = :description, genre = :genre, #ord = :order',
      ExpressionAttributeValues: {
        ':title': video.title,
        ':description': video.description,
        ':genre': video.genre,
        ':order': video.order
      },
      ExpressionAttributeNames: {
        '#ord': 'order'
      },
      ReturnValues: 'ALL_NEW'
    }).promise()

    return videoDBtoEntity(result.Attributes as VideoDb);
  }

  async addThumbnailPhoto(videographerId: string, videoId: string) {
    const link = `https://${this.videoThumbnailPhotoBucket}.s3.amazonaws.com/${videoId}`;

    const primaryKey = 'USER#' + videographerId;
    const sortKey = 'VIDEO#' + videoId;

    await this.docClient.update({
      TableName: this.appTable,
      Key: {
        PK: primaryKey,
        SK: sortKey
      },
      UpdateExpression: 'set thumbnailUrl = :thumbnailUrl',
      ExpressionAttributeValues: {
        ':thumbnailUrl': link,
      },
    }).promise();
  }

  async deleteVideo(videographerId: string, videoId: string) {
    const primaryKey = 'USER#' + videographerId;
    const sortKey = 'VIDEO#' + videoId; 

    return await this.docClient.delete({
      TableName: this.appTable,
      Key: {
        PK: primaryKey,
        SK: sortKey
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

  async getVideo(videoId: string): Promise<Video> {
    const result = await this.docClient.query({
      TableName: this.appTable,
      IndexName: this.mediaTypeIndex,
      KeyConditionExpression: 'mediaType = :mediaType',
      FilterExpression: 'SK = :SK',
      ExpressionAttributeValues: {
        ':mediaType': 'Video',
        ':SK': 'VIDEO#' + videoId
      }
    }).promise();

    console.log(result)
  
    return videoDBtoEntity(result.Items[0] as VideoDb);
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