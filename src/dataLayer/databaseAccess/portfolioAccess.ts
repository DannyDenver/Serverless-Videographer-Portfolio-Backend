import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { Portfolio } from "../../models/Portfolio";
import { portfolioDBtoEntity } from "../../utils/DboToEntityMapper";

const XAWS = AWSXRay.captureAWS(AWS)

export class PortfolioAccess {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly appTable = process.env.APP_DB_TABLE,
    private readonly firstLastIndex = process.env.FIRST_LAST_NAME_INDEX) {
  }

  async getPortfolio(videographerId): Promise<Portfolio> {
    const primaryKey = 'USER#' + videographerId;

    const result = await this.docClient.query({
      TableName: this.appTable,
      KeyConditionExpression: 'PK = :PK',
      ExpressionAttributeValues: {
        ':PK': primaryKey
      },
    }).promise();

    return result.Items.length > 0 ? portfolioDBtoEntity(result) : null;
  }

  async getPortfolioByName(first: string, last: string): Promise<Portfolio> {
    console.log('first', first);
    console.log('last', last);

    const result = await this.docClient.query({
      TableName: this.appTable,
      IndexName: this.firstLastIndex,
      KeyConditionExpression: 'firstName = :firstName and lastName = :lastName',
      ExpressionAttributeValues: {
        ':firstName': first,
        ':lastName': last
      }
    }).promise();

    console.log(result);
    return portfolioDBtoEntity(result);
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