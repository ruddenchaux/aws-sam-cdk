import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

export async function validateObject(s3Client: S3Client, bucketName: string, objectKey: string, exptectedObjectKeys: string[]): Promise<string> {
  if (!exptectedObjectKeys.includes(objectKey)) {
    throw new Error(`Object key ${objectKey} is not valid`);
  }

  const { ContentType } = await s3Client.send(new GetObjectCommand({ Bucket: bucketName, Key: objectKey }));

  if (ContentType !== "text/csv") {
    throw new Error(`Content type ${ContentType} is not text/csv`);
  }

  return Promise.resolve(objectKey);
}
