import { VideographerDb } from "../models/VideographerDb";
import { Videographer } from "../models/Videographer";
import { VideoDb } from "../models/VideoDb";
import { Video } from "../models/Video";

export function videographerDBtoEntity(videographerDb: VideographerDb): Videographer {
    return {
        id: videographerDb.SK.replace("USER#", ''),
        firstName: videographerDb.firstName,
        lastName: videographerDb.lastName,
        bio: videographerDb.bio,
        profilePic: videographerDb.profilePic,
        location: videographerDb.location
    }
}

export function videosDBtoEntity(videoDbs: VideoDb[]): Video[] {
    return videoDbs.map(videoDb => videoDBtoEntity(videoDb));
}

export function videoDBtoEntity(videoDb: VideoDb): Video {
    return {
        description: videoDb.description,
        id: videoDb.SK.replace("VIDEO#", ''),
        timestamp: videoDb.timestamp,
        title: videoDb.title,
        url: videoDb.url,
        videographerId: videoDb.PK.replace("USER#", '')
    }
}