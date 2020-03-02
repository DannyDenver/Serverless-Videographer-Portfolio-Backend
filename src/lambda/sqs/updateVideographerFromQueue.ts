import { SQSEvent, SQSHandler, SQSRecord } from "aws-lambda";


export const handler: SQSHandler = async (event: SQSEvent) => {
    console.log(event);
    for (let record of event.Records) {
        console.log(record.body);
    }
}
