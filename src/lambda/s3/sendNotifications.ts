import { SNSHandler, SNSEvent } from "aws-lambda";
import { sendNewVideoNotification } from "../../businessLogic/notifications";

export const handler: SNSHandler = async (event: SNSEvent) => {
    console.log("sending notifications")
    console.log(event)
}