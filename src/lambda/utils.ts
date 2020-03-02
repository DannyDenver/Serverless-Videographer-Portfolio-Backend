import { APIGatewayProxyEvent } from "aws-lambda";
import { parseUserId } from "../auth/utils";

/**
 * Get a user id from an API Gateway event
 * @param event an event from API Gateway
 *
 * @returns a user id from a JWT token
 */
export function getUserId(event: APIGatewayProxyEvent): string {
  const authHeader = event.headers.Authorization
  if (!authHeader.toLocaleLowerCase().startsWith('bearer ')) {
    throw new Error('Invalid authorization header')
  }

  const split = authHeader.split(' ')
  const token = split[1]

  console.log('jwt token', token)
  if (!token) return null;

  let authOId = parseUserId(token)
  if (authOId.includes("|")) { 
    return authOId.split("|")[1];
  }

  return authOId
}

export function getJWT(event: APIGatewayProxyEvent): string {
  const authHeader = event.headers.Authorization
  console.log(authHeader)
  if (!authHeader) return null

  const split = authHeader.split(' ')
  const token = split[1]
  if (!token) return null

  return token;
}