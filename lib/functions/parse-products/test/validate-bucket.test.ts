import { S3EventRecord } from "aws-lambda";
import { validateBucket } from "../validate-bucket";

const s3Record: S3EventRecord = {
  eventVersion: "string",
  eventSource: "string",
  awsRegion: "string",
  eventTime: "string",
  eventName: "string",
  userIdentity: {
    principalId: "string",
  },
  requestParameters: {
    sourceIPAddress: "string",
  },
  responseElements: {
    "x-amz-request-id": "string",
    "x-amz-id-2": "string",
  },
  s3: {
    s3SchemaVersion: "string",
    configurationId: "string",
    bucket: {
      name: "bucketName",
      ownerIdentity: {
        principalId: "string",
      },
      arn: "string",
    },
    object: {
      key: "string",
      size: 1,
      eTag: "string",
      sequencer: "string",
    },
  },
};

test("validateBucket() successfully", () => {
  expect(validateBucket({ Records: [s3Record] }, "bucketName")).toStrictEqual(s3Record);
});

test("validateBucket() fails", () => {
  expect(() => {
    validateBucket({ Records: [s3Record] }, "wrongBucketName");
  }).toThrow("Bucket record not found");
});
