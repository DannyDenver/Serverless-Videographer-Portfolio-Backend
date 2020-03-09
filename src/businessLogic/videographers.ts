import { APIGatewayProxyEvent, APIGatewayEvent } from "aws-lambda";
import { Videographer } from "../models/Videographer"
import { getUserId, getJWT } from "../lambda/utils"
import { VideographerAccess } from "../dataLayer/videographersAccess";
import { createLogger } from "../utils/logger";
import { parseUserId } from "../auth/utils";

const videographerAccess = new VideographerAccess()

const logger = createLogger('videographer');

export async function addVideographer(event: APIGatewayProxyEvent): Promise<Videographer> {
    const userId = getUserId(event)

    if (userId) {
        const videographerExists = await videographerAccess.videographerExists(userId)
        
        if (!videographerExists) {
            console.log(userId)

            const newVideographer: Videographer = JSON.parse(event.body);
            
            console.log('creating new videographer', newVideographer);
            return await videographerAccess.createVideographer(userId, newVideographer);
        }
    }
}

export async function getVideographers(event: APIGatewayProxyEvent): Promise<Videographer[]> {
    logger.info('Getting videographers');

    const videographers = await videographerAccess.getVideographers();

    const token = getJWT(event);
    let videographerId;

    if (token) {
        let auth0Id = parseUserId(token);
        videographerId = auth0Id.includes("|") ? auth0Id.split("|")[1] : auth0Id;   
    }

    return videographers.filter(videographer => videographer.id !==  videographerId && videographer.firstName && videographer.lastName);
}

export async function getVideographer(event: APIGatewayProxyEvent): Promise<Videographer> {
    const videographerId = decodeURI(event.pathParameters.videographerId);

    return await videographerAccess.getVideographer(videographerId)
}

export async function updateVideographer(event: APIGatewayProxyEvent): Promise<Videographer> {
    const videographerId = getUserId(event)
    const updatedVideographer: Videographer = JSON.parse(event.body)

    if (videographerId !== updatedVideographer.id) {
        logger.info(`Forbidden update attempt from videographer ${videographerId}`, updatedVideographer)
        throw new Error('Cannot edit other profiles')
    }

    logger.info(`Updating videographer ${videographerId}`, updatedVideographer)
    return await videographerAccess.updateVideographer(videographerId, updatedVideographer)
}

export async function addSubscriber(event: APIGatewayEvent): Promise<Videographer>  {
    const videographerId = decodeURI(event.pathParameters.videographerId);
    const email = event.pathParameters.email;

    console.log(videographerId, email)

    return await videographerAccess.addSubscriber(videographerId, email)
}
