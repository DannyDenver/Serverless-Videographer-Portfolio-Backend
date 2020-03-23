import { DynamoDBStreamEvent, APIGatewayEvent } from "aws-lambda";
import { VideographerAccess } from "../dataLayer/databaseAccess/videographersAccess";
import { EmailService } from "../microServiceLayer/emailService";
import { NewVideoNotification } from "../models/NewVideoNotification";

const videographerAccess = new VideographerAccess();
const emailService = new EmailService();

export async function sendNewVideoNotification(event: DynamoDBStreamEvent) {

    for (const record of event.Records) {
        console.log("Processing record", JSON.stringify(record));

        if (record.eventName !== 'INSERT') {
            continue
        };


        const video = record.dynamodb.NewImage;
        const videographer = await videographerAccess.getVideographer(video.videographerId.S);
        
        const newVideo: NewVideoNotification = {
            title: video.title.S,
            description: video.description.S,
            videographerName: videographer.firstName + ' ' + videographer.lastName,
            receivers: videographer.subscribers
        };

        await emailService.sendNewVideoNotification(newVideo);
    }
}

export async function verifyEmail(event: APIGatewayEvent) {
    const email = event.pathParameters.email;
    console.log('Sending verification email to ' + email);



    await emailService.verifyEmail(email);
}