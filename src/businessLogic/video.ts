import { VideoAccess } from "../dataLayer/videoAccess";
import * as uuid from 'uuid'
import { Video } from "../models/Video";
import { APIGatewayProxyEvent } from "aws-lambda";
import { getUserId } from "../lambda/utils"
import { createLogger } from "../utils/logger";

const videoAccess = new VideoAccess();
const logger = createLogger('video')

export async function getVideos(event: APIGatewayProxyEvent): Promise<Video[]> {
    const videographerId = decodeURI(event.pathParameters.videographerId);
    logger.info(`Getting videos for videographer ${videographerId}.`)

    return await videoAccess.getVideos(videographerId);
}

export async function getVideo(event: APIGatewayProxyEvent): Promise<Video> {
    const videoId = event.pathParameters.videoId

    return await videoAccess.getVideo(videoId);
}

export async function editVideo(event: APIGatewayProxyEvent): Promise<Video> {
    const videoId = event.pathParameters.videoId
    const video: Video = JSON.parse(event.body);
    const jwtUserId = getUserId(event);

    if (video.videographerId !== jwtUserId) {
        throw new Error("Cannot update other videographer's video.")
    }

    return await videoAccess.editVideo(video, videoId);
}
export async function addVideo(event: APIGatewayProxyEvent): Promise<string> {
    const jwtUserId = getUserId(event);
    const videographerId = decodeURI(event.pathParameters.videographerId);
    const video: Video = JSON.parse(event.body);

    if (jwtUserId !== videographerId || video.videographerId !== jwtUserId) {
        logger.alert(`User ${jwtUserId} attempted to add a video to videographer ${videographerId}'s portfolio`, video)
        throw new Error("User cannot update other profiles");
    };

    const videoId = uuid.v4();
    const uploadUrl = videoAccess.generateUploadUrl(videoId);
    console.log('video upload url', uploadUrl);

    video.id = videoId;
    video.timestamp = new Date().toISOString();
    video.url = videoAccess.getVideoUrl(videoId);

    await videoAccess.addVideo(video);

    return uploadUrl;
}

export async function deleteVideo(event: APIGatewayProxyEvent): Promise<string> {
    const jwtUserId = getUserId(event);
    const videographerId = decodeURI(event.pathParameters.videographerId);
    const videoId = event.pathParameters.videoUrl;

    if (jwtUserId !== videographerId) {
        logger.alert(`User ${jwtUserId} attempted to delete video ${videoId} from videographer ${videographerId}'s portfolio`);
        throw new Error("User cannot update other profiles");
    };

    console.log(`Deleting video ${videoId} from videographer ${videographerId}`);

    await videoAccess.deleteVideo(videographerId, videoId);

    return videoId;
}