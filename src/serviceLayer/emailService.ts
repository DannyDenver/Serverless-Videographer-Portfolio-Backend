import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { NewVideoNotification } from '../models/NewVideoNotification';


const XAWS = AWSXRay.captureAWS(AWS)

const ses = new XAWS.SES()

export class EmailService {
    async sendNewVideoNotification(emailConfiguration: NewVideoNotification) {
        console.log(emailConfiguration);
        
        const params: AWS.SES.SendTemplatedEmailRequest = {
            "Destination": {
                "ToAddresses": 
                emailConfiguration.receivers
            },
            "Source": "danny.denver80204@gmail.com",
            "Template": 'NewVideo',
            "TemplateData": `{ \"name\": "` + emailConfiguration.videographerName +  `" }`,
        }

        console.log("send templated email", params);

        // const raw: AWS.SES.SendRawEmailRequest = {
        //     Destinations
        // }

        // await ses.sendRawEmail({}).promise();

        await ses.sendTemplatedEmail(params).promise();
    };


     async verifyEmail(emailAddress: string) {
        await ses.verifyEmailAddress({
            EmailAddress: emailAddress,
            // TemplateName: 'SampleTemplate',
        }).promise();
    }
}