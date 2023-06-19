import { DynamoDBClient, TransactWriteItemsCommand } from "@aws-sdk/client-dynamodb";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { sdkStreamMixin } from "@aws-sdk/util-stream-node";
import { mockClient } from "aws-sdk-client-mock";
import "aws-sdk-client-mock-jest";
import { handler } from "../parse-products.function";

import { createReadStream } from "fs";
import * as transactWriteItemsModule from "../transact-write-items";

const s3Mock = mockClient(S3Client);
const dynamoDBClientMock = mockClient(DynamoDBClient);

const s3Record = (objectKey: string) => ({
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
      key: objectKey,
      size: 1,
      eTag: "string",
      sequencer: "string",
    },
  },
});

const dataSet = [
  {
    csvPath: "./csv/products.csv",
    s3Record: s3Record("products.csv"),
  },
  {
    csvPath: "./csv/stocks.csv",
    s3Record: s3Record("stocks.csv"),
  },
];

afterEach(() => {
  jest.clearAllMocks();
});

test.each(dataSet)("lambda handler successfully $csvPath file", async ({ csvPath, s3Record }) => {
  jest.replaceProperty(process, "env", { TABLE_NAME: "tableName", BUCKET_NAME: "bucketName" });

  const stream = createReadStream(csvPath);
  const sdkStream = sdkStreamMixin(stream);
  s3Mock.on(GetObjectCommand).resolves({ Body: sdkStream, ContentType: "text/csv" });
  dynamoDBClientMock.on(TransactWriteItemsCommand).resolves({});
  const transactWriteItemsSpy = jest.spyOn(transactWriteItemsModule, "transactWriteItems").mockReturnValue(Promise.resolve({ $metadata: {} }));

  await handler({ Records: [s3Record] }, {} as any, () => {});

  expect(transactWriteItemsSpy).toBeCalledTimes(10);
});
