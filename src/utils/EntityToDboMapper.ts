import { VideoDb } from "../models/VideoDb";
import { Video } from "../models/Video";



export function videoToVideoDb(video: Video): VideoDb {
    return {
        PK: 'USER#' + video.videographerId,
        SK: 'VIDEO#' + video.id,
        description: video.description,
        firstName: video.firstName,
        lastName: video.lastName,
        genre: video.genre,
        profilePic: video.profilePic,
        timestamp: video.timestamp,
        title: video.title,
        url: video.url
    }
}