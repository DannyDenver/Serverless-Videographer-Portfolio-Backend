import { APIGatewayProxyEvent, APIGatewayEvent } from "aws-lambda";
import { Videographer } from "../models/Videographer"
import { getUserId, getJWT } from "../lambda/utils"
import { VideographerAccess } from "../dataLayer/videographersAccess";
import { NewVideographerRequest } from "../requests/NewVideographerRequest";
import { createLogger } from "../utils/logger";
import { parseUserId } from "../auth/utils";
import { VideographerDb } from "../models/VideographerDb";

const videographerAccess = new VideographerAccess()

const logger = createLogger('videographer');

export async function addVideographer(event: APIGatewayProxyEvent): Promise<VideographerDb> {
    const token = getJWT(event)

    if (token) {
        let auth0Id = parseUserId(token);
        let videographerId = auth0Id.includes("|") ? auth0Id.split("|")[1] : auth0Id;
        const videographerExists = await videographerAccess.videographerExists(videographerId)
        

        if (!videographerExists) {
            if (videographerId.includes("|")){
                videographerId = videographerId.split("|")[1];
            }

            console.log(videographerId)

            const newVideographer: NewVideographerRequest = JSON.parse(event.body);
            const partitionKey = "USER#" + videographerId;
            const sortKey = "PROFILE#" + videographerId;

            const videographerDb: VideographerDb = {
                PK: partitionKey,
                SK: sortKey,
                firstName: newVideographer.firstName,
                lastName: newVideographer.lastName,
                location: newVideographer.location || null,
                bio: newVideographer.bio || null,
                profilePic: newVideographer.pictureUrl || null,
                coverPhoto: newVideographer.coverPhoto || null,
            };
            
            console.log('creating new videographer', videographerDb);

            return await videographerAccess.createVideographer(videographerDb);
        }
    }
}

export async function getVideographers(event: APIGatewayProxyEvent): Promise<Videographer[]> {
    logger.info('Getting all videographers');

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
    const updatedVideographer: NewVideographerRequest = JSON.parse(event.body)

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
