import { DynamoDBStreamEvent } from "aws-lambda";
import { VideographerAccess } from "../dataLayer/videographersAccess";
import { EmailService } from "../serviceLayer/emailService";
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
            receiver: null
        };

        for(const subscriber of videographer.subscribers) {
            newVideo["receiver"] = subscriber;

            emailService.sendNewVideoNotification(newVideo);
        }       
    }
}