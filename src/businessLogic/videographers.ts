import { APIGatewayProxyEvent, APIGatewayEvent } from "aws-lambda";
import { Videographer } from "../models/Videographer"
import { getUserId, getJWT } from "../lambda/utils"
import { VideographerAccess } from "../dataLayer/databaseAccess/videographersAccess";
import { createLogger } from "../utils/logger";
import { parseUserId } from "../auth/utils";
import { TextMessageService } from "../microServiceLayer/textService";

const videographerAccess = new VideographerAccess()
const textService = new TextMessageService();
const logger = createLogger('videographer');

export async function addVideographer(event: APIGatewayProxyEvent): Promise<Videographer> {
    const userId = getUserId(event)

    if (userId) {
        const videographerExists = await videographerAccess.videographerExists(userId)
        
        if (!videographerExists) {
            console.log(userId)

            const newVideographer: Videographer = JSON.parse(event.body);
            newVideographer.id = userId;
            
            console.log('creating new videographer', newVideographer);
            return await videographerAccess.createVideographer(newVideographer);
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
        console.log('videographer getting videographer list', videographerId)
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

export async function addSubscriber(event: APIGatewayEvent): Promise<Boolean>  {
    const videographerId = decodeURI(event.pathParameters.videographerId);
    const phoneNumber = event.pathParameters.phoneNumber;
    const videographer: Videographer = JSON.parse(event.body);

    try {
        console.log(`${phoneNumber} is subscribed to ${videographerId}`);
        await videographerAccess.addSubscriber(videographerId, phoneNumber);
    
        await textService.sendMessage(phoneNumber, `You are now subscribed to ${videographer.firstName} ${videographer.lastName} videos. Whenever a new video is updated by ${videographer.firstName}, you will receive a text message.`);
        return true;
    }catch(error) {
        console.log("error subscribing")
        throw new Error(`An error occured while subscribing to ${videographer.firstName} ${videographer.lastName}`);
    }
}
