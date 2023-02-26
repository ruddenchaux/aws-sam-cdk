import { parse } from "@fast-csv/parse";
import { Context, S3CreateEvent, S3EventRecord, S3Handler } from "aws-lambda";
import { DynamoDB, S3 } from "aws-sdk";
import { TransactWriteItem } from "aws-sdk/clients/dynamodb";
import { Product, ProductStock } from "../../product.model";

const s3 = new S3({ apiVersion: "2006-03-01" });
const dynamo = new DynamoDB({ apiVersion: "2012-08-10" });

const OBJECT_PRODUCTS_KEY = "products.csv";
const OBJECT_PRODUCTS_STOCKS_KEY = "stocks.csv";
const BUCKET_NAME = process.env.BUCKET_NAME || "";
const TABLE_NAME = process.env.TABLE_NAME || "";

export const handler: S3Handler = async (event: S3CreateEvent, context: Context): Promise<void> => {
  try {
    const bucketRecord = validateBucket(event, BUCKET_NAME);

    switch (bucketRecord.s3.object.key) {
      case OBJECT_PRODUCTS_KEY:
        await handleProducts(bucketRecord, OBJECT_PRODUCTS_KEY);
        break;
      case OBJECT_PRODUCTS_STOCKS_KEY:
        await handleProductsStocks(bucketRecord, OBJECT_PRODUCTS_STOCKS_KEY);
        break;
      default:
        throw new Error(`Invalid file ${bucketRecord.s3.object.key}`);
    }
  } catch (err) {
    console.log(err);
    throw new Error(`Failed to parse S3 ${OBJECT_PRODUCTS_KEY} on bucket ${BUCKET_NAME}`);
  }
};

async function handleProductsStocks(bucketRecord: S3EventRecord, objectKey: string) {
  await validateObject(bucketRecord, objectKey);

  const productsStocks = await parseCsv<ProductStock>(bucketRecord.s3.bucket.name, objectKey);
  const chunkSize = 100;

  for (let i = 0; i < productsStocks.length / chunkSize; i++) {
    const start = i * chunkSize;
    const end = start + chunkSize;
    const mappedTransactWriteItems: TransactWriteItem[] = [];
    for (let j = start; j < end; j++) {
      mappedTransactWriteItems.push(mapToTransactUpdateItem(TABLE_NAME, productsStocks[j]));
    }
    await transactWriteItems(mappedTransactWriteItems);
  }
}

async function handleProducts(bucketRecord: S3EventRecord, objectKey: string) {
  await validateObject(bucketRecord, objectKey);

  const products = await parseCsv<Product>(bucketRecord.s3.bucket.name, objectKey);
  const chunkSize = 100;

  for (let i = 0; i < products.length / chunkSize; i++) {
    const start = i * chunkSize;
    const end = start + chunkSize;
    const mappedTransactWriteItems: TransactWriteItem[] = [];
    for (let j = start; j < end; j++) {
      mappedTransactWriteItems.push(mapToTransactPutItem(TABLE_NAME, products[j]));
    }
    await transactWriteItems(mappedTransactWriteItems);
  }
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

function mapToTransactUpdateItem(tableName: string, product: ProductStock): TransactWriteItem {
  return {
    Update: {
      TableName: tableName,
      Key: {
        sku: { S: product.sku },
      },
      UpdateExpression: "SET #quantity = :quantity",
      ExpressionAttributeNames: { "#quantity": "quantity" },
      ExpressionAttributeValues: { ":quantity": { S: product.quantity } },
    },
  };
}

function mapToTransactPutItem(tableName: string, product: Product): TransactWriteItem {
  return {
    Put: {
      TableName: tableName,
      Item: {
        sku: { S: product.sku },
        name: { S: product.name },
        price: { N: product.price },
      },
    },
  };
}

function parseCsv<T>(bucketName: string, objectKey: string): Promise<T[]> {
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

async function validateObject(bucketRecord: S3EventRecord, objectKey: string): Promise<void> {
  if (bucketRecord.s3.object.key !== objectKey) {
    throw new Error(`Object key is not ${objectKey}`);
  }

  const { ContentType } = await s3.getObject({ Bucket: bucketRecord.s3.bucket.name, Key: objectKey }).promise();

  if (ContentType !== "text/csv") {
    throw new Error(`Content type ${ContentType} is not text/csv`);
  }
}

function validateBucket(event: S3CreateEvent, bucketName: string): S3EventRecord {
  const bucketRecord = findBucketRecord(bucketName, event.Records);

  if (!bucketRecord) {
    throw new Error("Bucket record not found");
  }

  return bucketRecord;
}

function findBucketRecord(bucketName: string, records: S3EventRecord[]): S3EventRecord | undefined {
  return records.find((record) => record.s3.bucket.name === bucketName);
}
