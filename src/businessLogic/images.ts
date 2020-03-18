import { ImagesAccess } from "../dataLayer/fileStoreAccess/imagesFileStoreAccess";
import { APIGatewayEvent } from "aws-lambda";
import { getUserId } from "../lambda/utils";
import { createLogger } from "../utils/logger";
import { VideographerAccess } from "../dataLayer/databaseAccess/videographersAccess";
import { VideoAccess } from "../dataLayer/databaseAccess/videoAccess";

const logger = createLogger('todos');

const imagesAccess = new ImagesAccess();
const videographerAccess = new VideographerAccess();
const videoAccess = new VideoAccess();

export async function addProfilePicture(event: APIGatewayEvent): Promise<string> {
    const videographerId = decodeURI(event.pathParameters.videographerId);
    const userId = getUserId(event);

    if (videographerId !== userId) {
        logger.alert(`User ${userId} attempted to add a profile picture for ${videographerId}.`);
        throw new Error("User cannot generate upload urls for other profiles");
    }

    logger.info(`Attaching profile picture to videographer ${videographerId}`)
    const fileType = JSON.parse(event.body)

    const imageId = fileType && fileType.fileType ? userId + '.' + fileType.fileType : userId;
    const uploadUrl = imagesAccess.generateUploadUrl(imageId)

    logger.info(`Profile picture url for videographer ${videographerId}`, uploadUrl);

    await videographerAccess.addProfilePicture(videographerId, imageId)
    
    return uploadUrl
}

export async function addCoverPhoto(event: APIGatewayEvent): Promise<string> {
    const videographerId = decodeURI(event.pathParameters.videographerId);
    const userId = getUserId(event);

    if (videographerId !== userId) {
        logger.alert(`User ${userId} attempted to add a profile picture for ${videographerId}.`);
        throw new Error("User cannot generate upload urls for other profiles");
    }

    logger.info(`Attaching cover photo to videographer ${videographerId}`)

    const uploadUrl = imagesAccess.generateCoverPhotoUploadUrl(videographerId)

    logger.info(`Profile picture url for videographer ${videographerId}`, uploadUrl);

    await videographerAccess.addCoverPhoto(videographerId)
    
    return uploadUrl
}


export async function addThumbnailPhoto(event: APIGatewayEvent): Promise<string> {
    const videoId = decodeURI(event.pathParameters.videoId);
    const videographerId = getUserId(event);

    logger.info(`Attaching thumbnail photo to video ${videoId}`)

    const uploadUrl = imagesAccess.generateVideoThumbnailUploadUrl(videoId)

    logger.info(`Thumbnail url for video ${videoId}`, uploadUrl);

    await videoAccess.addThumbnailPhoto(videographerId, videoId);
    console.log('thumbnail url', uploadUrl)
    return uploadUrl
}