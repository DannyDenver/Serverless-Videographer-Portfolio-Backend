import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)
const manager = new XAWS.SSM()

export class TextMessageService {
    twilioClient;
    twilioNumber;

    constructor() {
    }


    async sendMessage(contactPhoneNumber: string, message: string) {
        console.log('contact and messages', contactPhoneNumber, message);

        if (!this.twilioClient) {
            this.twilioClient = await this.getTwilioClient();
        }

        if (!this.twilioNumber) {
            this.twilioNumber = await this.getTwilioNumber();
        }

        await this.twilioClient.messages
            .create({
                body: message,
                from: this.twilioNumber,
                to: contactPhoneNumber
            })
            .then(message => console.log(message.sid)).catch(err => console.log('twilio error', err));
    }

    async sendMessages(contactPhoneNumbers: string[], message: string) {
        if (!this.twilioClient) {
            this.twilioClient = await this.getTwilioClient();
        }

        if (!this.twilioNumber) {
            this.twilioNumber = await this.getTwilioNumber();
        }

        console.log("sending messages");
        await Promise.all(
            contactPhoneNumbers.map(number => {
                return this.twilioClient.messages.create({
                    to: number,
                    from: this.twilioNumber,
                    body: message
                });
            })
        ).then(() => {
            console.log('Messages sent!');
        }).catch(err => console.error(err));
    }

    async verifyNumber(contactPhoneNumber: string) {
        console.log('Verifying phone number', contactPhoneNumber);

        if (!this.twilioClient) {
            this.twilioClient = await this.getTwilioClient();
        }

        try {
            return await this.twilioClient.lookups.phoneNumbers(contactPhoneNumber).fetch();
        } catch (err) {
            console.log("verify number error", err);
            return false;
        }
    }

    async getTwilioClient() {
        const accountSid = await manager.getParameter({ Name: 'TwilioAccountId' }).promise();
        const authToken = await manager.getParameter({ Name: 'TwilioAuthToken', WithDecryption: true }).promise();
        return require('twilio')(accountSid.Parameter.Value, authToken.Parameter.Value);
    }

    async getTwilioNumber() {
        const twilioNumber = await manager.getParameter({ Name: 'TwilioNumber' }).promise();
        return twilioNumber.Parameter.Value;
    }
}
