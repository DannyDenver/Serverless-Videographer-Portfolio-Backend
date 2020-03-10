import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)

const s3 = new XAWS.S3({
    signatureVersion: 'v4'
})

export class ImagesAccess {
    constructor(
        private readonly bucketName = process.env.PROFILE_PIC_S3_BUCKET,
        private readonly coverPhotoBucket = process.env.COVER_PHOTO_S3_BUCKET,
        private readonly videoThumbnailPhotoBucket = process.env.VIDEO_THUMBNAIL_S3_BUCKET,
        private readonly urlExpiration = +process.env.SIGNED_URL_EXPIRATION) {
    }

    generateUploadUrl(imageId: string): string {
        return s3.getSignedUrl('putObject', {
            Bucket: this.bucketName,
            Key: imageId,
            Expires: this.urlExpiration
        })
    }
    
    generateCoverPhotoUploadUrl(imageId: string): string {
        return s3.getSignedUrl('putObject', {
            Bucket: this.coverPhotoBucket,
            Key: imageId,
            Expires: this.urlExpiration
        })
    }

    generateVideoThumbnailUploadUrl(imageId: string): string {
        return s3.getSignedUrl('putObject', {
            Bucket: this.videoThumbnailPhotoBucket,
            Key: imageId,
            Expires: this.urlExpiration
        })
    }

}