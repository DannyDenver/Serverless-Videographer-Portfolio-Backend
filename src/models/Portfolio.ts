import { Videographer } from './Videographer';
import { Video } from './Video';

export class Portfolio {
    constructor(profile: Videographer, videos: Video[]) {
        this.profile = profile;
        this.videos = videos;
    }
    profile: Videographer;
    videos: Video[];
}
