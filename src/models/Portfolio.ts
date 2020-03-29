import { Videographer } from './Videographer';
import { Video } from './Video';

export class Portfolio {
    constructor(profile: Videographer = null, videos: Video[] = null) {
        this.profile = profile;
        this.videos = videos;
    }
    profile: Videographer;
    videos: Video[];
}
