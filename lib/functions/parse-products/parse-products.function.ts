import { parse } from "@fast-csv/parse";
import { Context, S3CreateEvent, S3EventRecord, S3Handler } from "aws-lambda";
import { DynamoDB, S3 } from "aws-sdk";
import { TransactWriteItem } from "aws-sdk/clients/dynamodb";
import { Product, ProductStock } from "../../types";
import { Mapper, ObjectKeysMapper } from "./../../types";

const s3 = new S3({ apiVersion: "2006-03-01" });
const dynamo = new DynamoDB({ apiVersion: "2012-08-10" });

const BUCKET_NAME = process.env.BUCKET_NAME || "";
const TABLE_NAME = process.env.TABLE_NAME || "";
const OBJECTS_KEYS_MAPPER: ObjectKeysMapper = { "products.csv": mapToTransactPutItem, "stocks.csv": mapToTransactUpdateItem };

export const handler: S3Handler = async (event: S3CreateEvent, context: Context): Promise<void> => {
  try {
    const bucketRecord = validateBucket(event, BUCKET_NAME);
    const objectKey = await validateObject(BUCKET_NAME, bucketRecord.s3.object.key, Object.keys(OBJECTS_KEYS_MAPPER));
    const mapper = OBJECTS_KEYS_MAPPER[objectKey as keyof ObjectKeysMapper] as Mapper;
    const chunkSize = 100;
    const items = await parseCsv(BUCKET_NAME, objectKey);

    for (let i = 0; i < items.length / chunkSize; i++) {
      const start = i * chunkSize;
      const end = start + chunkSize;
      const mappedTransactWriteItems: TransactWriteItem[] = [];
      for (let j = start; j < end; j++) {
        mappedTransactWriteItems.push(mapper(TABLE_NAME, items[j]));
      }
      await transactWriteItems(mappedTransactWriteItems);
    }
  } catch (err) {
    console.log(err);
    throw new Error(`Failed to parse S3 object`);
  }
};

function validateBucket(event: S3CreateEvent, bucketName: string): S3EventRecord {
  const bucketRecord = event.Records.find((record) => record.s3.bucket.name === bucketName);

  if (!bucketRecord) {
    throw new Error("Bucket record not found");
  }

  return bucketRecord;
}

async function validateObject(bucketName: string, objectKey: string, exptectedObjectKeys: string[]): Promise<string> {
  if (!exptectedObjectKeys.includes(objectKey)) {
    throw new Error(`Object key ${objectKey} is not valid`);
  }

  const { ContentType } = await s3.getObject({ Bucket: bucketName, Key: objectKey }).promise();

  if (ContentType !== "text/csv") {
    throw new Error(`Content type ${ContentType} is not text/csv`);
  }

  return Promise.resolve(objectKey);
}

function parseCsv<T = Product | ProductStock>(bucketName: string, objectKey: string): Promise<T[]> {
  return new Promise(async (resolve, reject) => {
    const items: T[] = [];

    try {
      s3.getObject({ Bucket: bucketName, Key: objectKey })
        .createReadStream()
        .pipe(parse({ headers: true }))
        .on("error", (error) => {
          console.log(error);
          reject(error);
        })
        .on("data", (row) => items.push(row))
        .on("end", (rowCount: number) => {
          console.log(`Parsed ${rowCount} rows`);
          resolve(items);
        });
    } catch (err) {
      console.log(err);
      const message = `Error getting object ${objectKey} from bucket ${bucketName}. Make sure they exist and your bucket is in the same region as this function.`;
      reject(message);
    }
  });
}

function mapToTransactUpdateItem(tableName: string, item: ProductStock): TransactWriteItem {
  return {
    Update: {
      TableName: tableName,
      Key: {
        sku: { S: item.sku },
      },
      UpdateExpression: "SET #quantity = :quantity",
      ExpressionAttributeNames: { "#quantity": "quantity" },
      ExpressionAttributeValues: { ":quantity": { S: item.quantity } },
    },
  };
}

function mapToTransactPutItem(tableName: string, item: Product): TransactWriteItem {
  return {
    Put: {
      TableName: tableName,
      Item: {
        sku: { S: item.sku },
        name: { S: item.name },
        price: { N: item.price },
      },
    },
  };
}

function transactWriteItems(mappedChunkTransactItems: TransactWriteItem[]): Promise<void> {
  return new Promise((resolve, reject) => {
    dynamo.transactWriteItems(
      {
        TransactItems: mappedChunkTransactItems,
      },
      (err, data) => {
        if (err) {
          console.log(err);
          reject(err);
          return;
        }
        resolve();
      }
    );
  });
}
