export interface VideoDb {
    PK: string
    SK: string
    firstName: string
    lastName: string
    profilePic: string
    url: string
    title: string
    description: string
    timestamp: string
    genre?: string
    order: number;
    thumbnailUrl?: string;
    mediaType: string;
}
