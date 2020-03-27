import { DynamoDBStreamEvent, APIGatewayEvent } from "aws-lambda";
import { VideographerAccess } from "../dataLayer/databaseAccess/videographersAccess";
import { EmailService } from "../microServiceLayer/emailService";
import { TextMessageService } from "../microServiceLayer/textService";

const videographerAccess = new VideographerAccess();
const textService = new TextMessageService();
const emailService = new EmailService();

export async function sendNewVideoNotification(event: DynamoDBStreamEvent) {
    for (const record of event.Records) {
        console.log("Processing record", JSON.stringify(record));
        const SK = record.dynamodb.Keys.SK.S;
        const PK = record.dynamodb.Keys.PK.S;

        if (record.eventName !== 'INSERT' || SK.indexOf('VIDEO') === -1) {
            continue
        };

        const subscribers: string[] = await videographerAccess.getVideographerSubscribers(PK.replace('USER#', ''));
        const firstName = record.dynamodb.NewImage.firstName.S;
        const lastName = record.dynamodb.NewImage.lastName.S;
        const title = record.dynamodb.NewImage.title.S;

        if (subscribers) {
            await textService.sendMessages(subscribers, `${firstName} ${lastName} has uploaded a new video titled '${title}'. Follow this link to see the new video: https://www.reel-people.com/${firstName.toLowerCase()}-${lastName.toLowerCase()} `);
        }
    }
}

export async function verifyEmail(event: APIGatewayEvent) {
    const email = event.pathParameters.email;
    console.log('Sending verification email to ' + email);

    await emailService.verifyEmail(email);
}