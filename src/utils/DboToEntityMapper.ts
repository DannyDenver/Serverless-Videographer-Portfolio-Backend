import { VideographerDb } from "../models/VideographerDb";
import { Videographer } from "../models/Videographer";
import { VideoDb } from "../models/VideoDb";
import { Video } from "../models/Video";

export function videographerDBtoEntity(videographerDb: VideographerDb): Videographer {
    return {
        id: videographerDb.PK.replace("USER#", ''),
        firstName: videographerDb.firstName,
        lastName: videographerDb.lastName,
        bio: videographerDb.bio,
        profilePic: videographerDb.profilePic,
        location: videographerDb.location,
        coverPhoto: videographerDb.coverPhoto
    }
}

export function videographersDBtoShortEntity(videographerDb: VideographerDb): Videographer {
    return {
        id: videographerDb.PK.replace("USER#", ''),
        firstName: videographerDb.firstName,
        lastName: videographerDb.lastName,
        profilePic: videographerDb.profilePic,
        location: videographerDb.location
        }
}

export function videosDBtoEntity(videoDbs: VideoDb[]): Video[] {
    return videoDbs.map(videoDb => videoDBtoEntity(videoDb));
}

export function videoDBtoEntity(videoDb: VideoDb): Video {
    return {
        id: videoDb.SK.replace("VIDEO#", ''),
        videographerId: videoDb.PK.replace("USER#", ''),
        url: videoDb.url,
        title: videoDb.title,
        description: videoDb.description,
        timestamp: videoDb.timestamp,
        profilePic: videoDb.profilePic,
        firstName: videoDb.firstName,
        lastName: videoDb.lastName,
        genre: videoDb.genre
    }
}