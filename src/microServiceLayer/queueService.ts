import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)
const sqs = new XAWS.SQS()


export class QueueService {
    async sendToQueue(updates) {
        console.log("queue updates", updates)

        await sqs.getQueueUrl({ QueueName: 'Update-videographer-queue-dev' }, async function (err, data) {
            if (err) {
                console.log("Error", err);
            } else {
                console.log(data.QueueUrl);
                console.log(updates);
        
                const params: AWS.SQS.SendMessageRequest = {
                    MessageBody: JSON.stringify(updates),
                    QueueUrl: data.QueueUrl
                }
        
                await sqs.sendMessage(params).promise();

                //await sendMessage(data.QueueUrl, updates).promise();
            }
        }).promise();
    };

    async sendMessage(url, updates) {
        console.log(url);
        console.log(updates);

        const params: AWS.SQS.SendMessageRequest = {
            MessageBody: JSON.stringify(updates),
            QueueUrl: url
        }

        await sqs.sendMessage(params).promise();
    }
}


