import { APIGatewayProxyHandler, APIGatewayProxyResult, APIGatewayProxyEvent } from "aws-lambda";
import { QueueService } from "../../microServiceLayer/queueService";


export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const queueService = new QueueService();

    await queueService.sendToQueue({"attribute":"test", "time": Date.now()});

    return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin" : "*",
          "Access-Control-Allow-Credentials" : true
        },
        body: null
    }
}