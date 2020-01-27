import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { NewVideoNotification } from '../models/NewVideoNotification';


const XAWS = AWSXRay.captureAWS(AWS)

const ses = new XAWS.SES()

export class EmailService {

    sendNewVideoNotification(emailConfiguration: NewVideoNotification) {
        console.log(emailConfiguration);
    }
}