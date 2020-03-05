import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { Portfolio } from "../models/Portfolio";
import { VideographerDb } from "../models/VideographerDb";
import { videographerDBtoEntity, videosDBtoEntity } from "../utils/DboToEntityMapper";
import { VideoDb } from '../models/VideoDb';

const XAWS = AWSXRay.captureAWS(AWS)

const s3 = new XAWS.S3({
  signatureVersion: 'v4'
})

export class PortfolioAccess {
    constructor(
      private readonly docClient: DocumentClient = createDynamoDBClient(),
      private readonly appTable = process.env.APP_DB_TABLE) {
    }

async getPortfolio(videographerId) {
    const primaryKey = 'USER#' + videographerId;

    const result = await this.docClient.query({
      TableName: this.appTable,
      KeyConditionExpression: 'PK = :PK',
      ExpressionAttributeValues: {
        ':PK': primaryKey
      }
    }).promise();

    console.log(result);
    const portfolio = new Portfolio();

    const videographerDb = result.Items.filter(item => item['SK'].indexOf('PROFILE') > -1)[0] as VideographerDb;
    const videosDb = result.Items.filter(item => item['SK'].indexOf('VIDEO') > -1) as VideoDb[];

    portfolio.profile = videographerDBtoEntity(videographerDb);
    if (videosDb) {
      portfolio.videos = videosDBtoEntity(videosDb);
    }

    console.log(portfolio)

    return portfolio;
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