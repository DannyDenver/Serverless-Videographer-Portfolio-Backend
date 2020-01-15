import { ImagesAccess } from "../dataLayer/imagesAccess";
import { APIGatewayEvent } from "aws-lambda";
import { getUserId } from "../lambda/utils";
import { createLogger } from "../utils/logger";
import { VideographerAccess } from "../dataLayer/videographersAccess";

const logger = createLogger('todos')

const imagesAccess = new ImagesAccess()
const videographerAccess = new VideographerAccess()

export async function generateUploadUrl(event: APIGatewayEvent): Promise<string> {
    const videographerId = event.pathParameters.videographerId.replace('%7C', '|')
    const userId = getUserId(event)

    if (videographerId !== userId) throw new Error("User cannot update other profiles")

    logger.info(`Attaching profile picture to videographer ${videographerId}`)

    const uploadUrl = imagesAccess.generateUploadUrl(videographerId)
    console.log('upload url', uploadUrl)

    await videographerAccess.addProfilePicture(videographerId)
    
    return uploadUrl
}