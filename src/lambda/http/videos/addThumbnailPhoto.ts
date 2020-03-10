import 'source-map-support/register'
import { APIGatewayProxyResult, APIGatewayProxyHandler, APIGatewayEvent } from 'aws-lambda'
import { addThumbnailPhoto } from '../../../businessLogic/images'

export const handler: APIGatewayProxyHandler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  const uploadUrl = await addThumbnailPhoto(event)

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
        uploadUrl: uploadUrl
    })
  }
}