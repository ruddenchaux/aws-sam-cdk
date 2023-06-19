import { DynamoDBClient, TransactWriteItem } from "@aws-sdk/client-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";
import { Context, S3CreateEvent, S3Handler } from "aws-lambda";
import { Mapper, ObjectKeysMapper } from "./../../types";
import { mapToTransactPutItem } from "./map-to-transact-put-item";
import { mapToTransactUpdateItem } from "./map-to-transact-update-item";
import { parseCsv } from "./parse-csv";
import { transactWriteItems } from "./transact-write-items";
import { validateBucket } from "./validate-bucket";
import { validateObject } from "./validate-object";

const OBJECTS_KEYS_MAPPER: ObjectKeysMapper = { "products.csv": mapToTransactPutItem, "stocks.csv": mapToTransactUpdateItem };

export const handler: S3Handler = async (event: S3CreateEvent, context: Context): Promise<void> => {
  const BUCKET_NAME = process.env.BUCKET_NAME || "";
  const TABLE_NAME = process.env.TABLE_NAME || "";

  const s3Client = new S3Client({ apiVersion: "2006-03-01" });
  const dynamoDBClient = new DynamoDBClient({ apiVersion: "2012-08-10" });

  const bucketRecord = validateBucket(event, BUCKET_NAME);
  const objectKey = await validateObject(s3Client, BUCKET_NAME, bucketRecord.s3.object.key, Object.keys(OBJECTS_KEYS_MAPPER));
  const mapper = OBJECTS_KEYS_MAPPER[objectKey as keyof ObjectKeysMapper] as Mapper;
  const chunkSize = 100;
  const items = await parseCsv(s3Client, BUCKET_NAME, objectKey);

  for (let i = 0; i < items.length / chunkSize; i++) {
    const start = i * chunkSize;
    const end = start + chunkSize;
    const mappedTransactWriteItems: TransactWriteItem[] = [];
    for (let j = start; j < end; j++) {
      mappedTransactWriteItems.push(mapper(TABLE_NAME, items[j]));
    }

    await transactWriteItems(dynamoDBClient, mappedTransactWriteItems);
  }
};
