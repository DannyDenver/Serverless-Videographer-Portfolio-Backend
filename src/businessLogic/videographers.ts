import { APIGatewayProxyEvent } from "aws-lambda";
import { Videographer } from "../models/Videographer"
import { getUserId, getJWT } from "../lambda/utils"
import { VideographerAccess } from "../dataLayer/videographersAccess";
import { UpdateVideographerRequest } from "../requests/UpdateVideographerRequest";
import { createLogger } from "../utils/logger";
import { parseUserId } from "../auth/utils";

const videographerAccess = new VideographerAccess()

const logger = createLogger('videographer')

export async function getVideographers(event: APIGatewayProxyEvent): Promise<Videographer[]> {
    const token = getJWT(event)

    if (token) {
        const videographerId = parseUserId(token)
        const videographerExists = await videographerAccess.videographerExists(videographerId)
        if (!videographerExists) {
            const newVideographer: Videographer = {
                id: videographerId
            }
            logger.info(`Creating videographer.`, newVideographer);

            await videographerAccess.createVideographer(newVideographer)
        }        
    }

    logger.info('Getting all videographers')
    return await videographerAccess.getVideographers()
}

export async function getVideographer(event: APIGatewayProxyEvent): Promise<Videographer> {
    const videographerId = decodeURI(event.pathParameters.videographerId);
    return await videographerAccess.getVideographer(videographerId)
}

export async function updateVideographer(event: APIGatewayProxyEvent): Promise<Videographer> {
    const videographerId = getUserId(event)
    const updatedVideographer: UpdateVideographerRequest = JSON.parse(event.body)

    if (videographerId !== updatedVideographer.id) {
        logger.info(`Forbidden update attempt from videographer ${videographerId}`, updatedVideographer)

        throw new Error('Cannot edit other profiles')
    }

    logger.info(`Updating videographer ${videographerId}`, updatedVideographer)
    return await videographerAccess.updateVideographer(videographerId, updatedVideographer)
}



