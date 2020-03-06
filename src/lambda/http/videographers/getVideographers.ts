import { APIGatewayProxyHandler, APIGatewayProxyResult, APIGatewayProxyEvent } from "aws-lambda";
import { getVideographers } from "../../../businessLogic/videographers";

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const videographers = await getVideographers(event)

    return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          ...videographers
        })
    }
}