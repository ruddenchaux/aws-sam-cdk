import { S3CreateEvent, S3EventRecord } from "aws-lambda";

export function validateBucket(event: S3CreateEvent, bucketName: string): S3EventRecord {
  const bucketRecord = event.Records.find((record) => record.s3.bucket.name === bucketName);

  if (!bucketRecord) {
    throw new Error("Bucket record not found");
  }

  return bucketRecord;
}
