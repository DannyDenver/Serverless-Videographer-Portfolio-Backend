import { ImagesAccess } from "../dataLayer/imagesAccess";
import { APIGatewayEvent } from "aws-lambda";
import { getUserId } from "../lambda/utils";
import { createLogger } from "../utils/logger";
import { VideographerAccess } from "../dataLayer/videographersAccess";

const logger = createLogger('todos');

const imagesAccess = new ImagesAccess();
const videographerAccess = new VideographerAccess();

export async function generateUploadUrl(event: APIGatewayEvent): Promise<string> {
    const videographerId = decodeURI(event.pathParameters.videographerId);
    const userId = getUserId(event);

    if (videographerId !== userId) {
        logger.alert(`User ${userId} attempted to add a profile picture for ${videographerId}.`);
        throw new Error("User cannot generate upload urls for other profiles");
    }

    logger.info(`Attaching profile picture to videographer ${videographerId}`)

    const uploadUrl = imagesAccess.generateUploadUrl(videographerId)

    logger.info(`Profile picture url for videographer ${videographerId}`, uploadUrl);

    await videographerAccess.addProfilePicture(videographerId)
    
    return uploadUrl
}