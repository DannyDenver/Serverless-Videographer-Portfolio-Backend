import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)

const s3 = new XAWS.S3({
  signatureVersion: 'v4'
})

export class VideoFileStoreAccess {
    constructor(
        private readonly bucketName = process.env.VIDEOS_S3_BUCKET,
        private readonly urlExpiration = +process.env.SIGNED_URL_EXPIRATION,
    ){}  

    generateUploadUrl(videoId: string): string {
        return s3.getSignedUrl('putObject', {
          Bucket: this.bucketName,
          Key: videoId,
          Expires: this.urlExpiration
          });
      }

      async deleteVideo(videoId: string) {
        const deleteRequest = {
          Bucket: this.bucketName,
          Key: videoId
        };
        
        console.log(deleteRequest);

        await s3.deleteObject(deleteRequest).promise();
        return;
      }

}