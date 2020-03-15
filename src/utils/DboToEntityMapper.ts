import { VideographerDb } from "../models/VideographerDb";
import { Videographer } from "../models/Videographer";
import { VideoDb } from "../models/VideoDb";
import { Video } from "../models/Video";
import { Portfolio } from "../models/Portfolio";

export function portfolioDBtoEntity(result): Portfolio {
    if (!result.Items) return;

    const portfolio = new Portfolio();

    const videographerDb = result.Items.filter(item => item['SK'].indexOf('PROFILE') > -1)[0] as VideographerDb;
    const videosDb = result.Items.filter(item => item['SK'].indexOf('VIDEO') > -1) as VideoDb[];

    portfolio.profile = videographerDBtoEntity(videographerDb);
    if (videosDb) {
      portfolio.videos = videosDBtoEntity(videosDb);
    }
    return portfolio;
}

export function videographerToDb(videographer: Videographer): VideographerDb {
    const VideographerDb: VideographerDb = {
      PK: "USER#" + videographer.id,
      SK: "PROFILE#" + videographer.id,
      firstName: videographer.firstName,
      lastName: videographer.lastName,
      location: videographer.location || null,
      bio: videographer.bio || null,
      profilePic: videographer.profilePic || null,
      coverPhoto: videographer.coverPhoto || null,
    };

    console.log('converted videographer', VideographerDb)

    return VideographerDb;
}

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
        genre: videoDb.genre,
        order: videoDb.order,
        thumbnailUrl: videoDb.thumbnailUrl
    }
}
