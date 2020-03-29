import { APIGatewayProxyHandler, APIGatewayEvent } from "aws-lambda"
import { processInboundSMS } from "../../../businessLogic/notifications"


export const handler: APIGatewayProxyHandler = async (event: APIGatewayEvent): Promise<any> => {
    const result = await processInboundSMS(event)

    if (result) {
      return `<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response><Message>${result}</Message></Response>`;
    }
  }