import { APIGatewayProxyEvent, APIGatewayEvent } from "aws-lambda";
import { Videographer } from "../models/Videographer"
import { getUserId, getJWT } from "../lambda/utils"
import { VideographerAccess } from "../dataLayer/videographersAccess";
import { UpdateVideographerRequest } from "../requests/UpdateVideographerRequest";
import { createLogger } from "../utils/logger";
import { parseUserId } from "../auth/utils";

const videographerAccess = new VideographerAccess()

const logger = createLogger('videographer');

export async function addVideographer(event: APIGatewayProxyEvent): Promise<Videographer> {
    const token = getJWT(event)

    if (token) {
        let auth0Id = parseUserId(token);
        let videographerId = auth0Id.includes("|") ? auth0Id.split("|")[1] : auth0Id;
        const videographerExists = await videographerAccess.videographerExists(videographerId)
        

        if (!videographerExists) {
            if (videographerId.includes("|")){
                videographerId = videographerId.split("|")[1];
            }

            const newVideographer: UpdateVideographerRequest = JSON.parse(event.body)
            newVideographer.id = videographerId;

            logger.info(`Creating videographer.`, newVideographer);

            return await videographerAccess.createVideographer(newVideographer);
        }        
    }
}

export async function getVideographers(event: APIGatewayProxyEvent): Promise<Videographer[]> {
    const token = getJWT(event);
    let videographerId;

    if (token) {
        let auth0Id = parseUserId(token);
        videographerId = auth0Id.includes("|") ? auth0Id.split("|")[1] : auth0Id;   
    }

    logger.info('Getting all videographers');

    const videographers = await videographerAccess.getVideographers();

    return videographers.filter(videographer => videographer.id !==  videographerId && videographer.firstName && videographer.lastName);
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

export async function addSubscriber(event: APIGatewayEvent): Promise<Videographer>  {
    const videographerId = decodeURI(event.pathParameters.videographerId);
    const email = event.pathParameters.email;

    console.log(videographerId, email)

    return await videographerAccess.addSubscriber(videographerId, email)
}
