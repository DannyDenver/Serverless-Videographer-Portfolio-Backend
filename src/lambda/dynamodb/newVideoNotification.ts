import { DynamoDBStreamEvent, DynamoDBStreamHandler } from 'aws-lambda';
import 'source-map-support/register'
import { sendNewVideoNotification } from '../../businessLogic/notifications';

export const handler: DynamoDBStreamHandler = async (event: DynamoDBStreamEvent) => {
    await sendNewVideoNotification(event)
}