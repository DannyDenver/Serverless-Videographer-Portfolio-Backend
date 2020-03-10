import { APIGatewayProxyHandler, APIGatewayProxyResult, APIGatewayProxyEvent } from "aws-lambda";
import { deleteVideo } from "../../../businessLogic/videos";

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const deletedVideoUrl = await deleteVideo(event);

    return {
        statusCode: 204,
        headers: {
          "Access-Control-Allow-Origin" : "*",
          "Access-Control-Allow-Credentials" : true
        },
        body: JSON.stringify({
          deletedVideoUrl
        })
    }
}