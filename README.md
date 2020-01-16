# Serverless Videographer Site Backend

This videographer site enables aspiring videographers to log in, create a profile, and upload their videos. Profiles can be viewed and shared. 

This site uses AWS services such as API Gateway, S3, DynamoDB, CloudFormation, Lambda Functions and the Serverless Framework.

Endpoint: https://co9fey3jkg.execute-api.us-east-1.amazonaws.com/dev

## Installation

To install the serverless framework: 

```bash
npm install -g serverless
```

## Testing Locally

```bash
serverless invoke local --function functionName
```

## Resources
### Videographer

```javascript
    id: string
    firstName?: string
    lastName?: string
    location?: string
    bio?: string
    pictureUrl?: string
    email?: string
```
### Video
```javascript
    id: string
    videographerId: string
    url: string
    title: string
    description: string
    timestamp?: string

```
## Functions

### Add Profile Picture
- POST: {endpoint}/videographers/{videographerId}/profilePicture
- Body: null
- Auth token required
- Returns: String, Url to upload photo

### Add Video
- POST: {endpoint}/videographers/{videographerId}/videos
- Body: Video object
- Auth token required
- Returns: String, Url to upload video

### Delete Video
- DELETE: {endpoint}/videographers/{videographerId}/videos/{videoId}
- Auth token required
- Returns: String, deleted videoId

### Get Videographers
- GET: {endpoint}/videographers
- Returns: Array of videographers

### Get Videos
- GET: {endpoint}/videographers/{videographerId}/videos
- Returns: videographer object

### Update Videographers
- PATCH: {endpoint}/videographers/
- Body: Videographer object
- Returns: updated videographer object

## Relevant Links
- https://serverless.com/framework/docs/providers/aws/
- https://docs.aws.amazon.com/
- https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SES.html#sendCustomVerificationEmail-property

## Project Status
Currently in development. 
