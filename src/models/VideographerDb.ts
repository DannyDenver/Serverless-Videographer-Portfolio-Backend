export interface VideographerDb {
    PK: string
    SK: string
    firstName: string
    lastName: string
    location?: string
    bio?: string
    profilePic?: string
    coverPhoto?: string
    subscribers?: string[]
}
