import { VideoAccess } from "../dataLayer/videoAccess";
import * as uuid from 'uuid'
import { Video } from "../models/Video";
import { APIGatewayProxyEvent } from "aws-lambda";
import { getUserId } from "../lambda/utils"

const videoAccess = new VideoAccess();

export async function getVideos(event: APIGatewayProxyEvent): Promise<Video[]> {
    const videographerId = event.pathParameters.videographerId.replace('%7C', '|');
    return await videoAccess.getVideos(videographerId);
}

export async function addVideo(event: APIGatewayProxyEvent): Promise<string> {
    const jwtUserId = getUserId(event);
    const videographerId = event.pathParameters.videographerId.replace('%7C', '|');
    const video: Video = JSON.parse(event.body);

    if (jwtUserId !== videographerId || video.videographerId !== jwtUserId) {
        throw new Error("User cannot update other profiles");
    }

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
    const videographerId = event.pathParameters.videographerId.replace('%7C', '|');
    const videoId = event.pathParameters.videoUrl;

    if (jwtUserId !== videographerId) {
        throw new Error("User cannot update other profiles");
    }

    console.log(videographerId, videoId)

    await videoAccess.deleteVideo(videographerId, videoId);

    return videoId;
}