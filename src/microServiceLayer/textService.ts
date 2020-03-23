import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)
const manager = new XAWS.SSM()

export class TextMessageService {
    constructor() { }

    async sendMessage(contact: string, message: string) {
        console.log('contact and messages', contact, message);

        const accountSid = await manager.getParameter({ Name: 'TwilioAccountId' }).promise();
        const authToken = await manager.getParameter({ Name: 'TwilioAuthToken', WithDecryption: true }).promise();
        const twilioNumber = await manager.getParameter({ Name: 'TwilioNumber' }).promise();
        
        console.log(authToken.Parameter.Value);
        const client = require('twilio')(accountSid.Parameter.Value, authToken.Parameter.Value);

        await client.messages
            .create({
                body: message,
                from: twilioNumber.Parameter.Value,
                to: contact
            })
            .then(message => console.log(message.sid));
    }
}
