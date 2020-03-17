import { APIGatewayProxyHandler, APIGatewayProxyResult, APIGatewayProxyEvent } from "aws-lambda";
import { getVideographers, updateVideographer, addVideographer } from "../../../businessLogic/videographers";
import { getPortfolio } from "../../../businessLogic/portfolio";

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  let  body;
  let statusCode = 200;
  const headers = {
    'Access-Control-Allow-Origin': '*'
  }
  
  try {
    switch (event.httpMethod) {
      case 'POST':
        body = await addVideographer(event);
        statusCode = 201;
        break;

      case 'PATCH':
        body = await updateVideographer(event);
        statusCode = 204;
        break;

      case 'GET':
        if (event.pathParameters && event.pathParameters.videographerId) {
          body = await getPortfolio(event);
          break;
        } else {
          body = await getVideographers(event);
          break;
        }

      default:
        throw new Error(`Unsupported method "${event.httpMethod}"`);    }
  } catch (error) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error
      })
    }
  } finally {
    body = JSON.stringify(body);
  }

  return {
    statusCode, 
    body,
    headers
  }
}