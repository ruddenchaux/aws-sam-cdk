import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { sdkStreamMixin } from "@aws-sdk/util-stream-node";
import { mockClient } from "aws-sdk-client-mock";
import { createReadStream } from "fs";
import { parseCsv } from "../parse-csv";

const s3Mock = mockClient(S3Client);

const dataSet = [
  {
    objectKey: "products.csv",
    csvPath: "./csv/products.csv",
    firstItem: { sku: "48-2586944", name: "Wheat - Soft Kernal Of Wheat", price: "93.15" },
    lastItem: { sku: "98-2196532", name: "Cream Of Tartar", price: "21.56" },
  },
  {
    objectKey: "stocks.csv",
    csvPath: "./csv/stocks.csv",
    firstItem: { sku: "48-2586944", quantity: "332" },
    lastItem: { sku: "98-2196532", quantity: "10" },
  },
];
describe("validateObject() successfully", () => {
  test.each(dataSet)("$objectKey should resolve and return items", async ({ objectKey, csvPath, firstItem, lastItem }) => {
    const stream = createReadStream(csvPath);
    const sdkStream = sdkStreamMixin(stream);

    s3Mock.on(GetObjectCommand).resolves({ Body: sdkStream });
    const items = await parseCsv(s3Mock as any, "bucketName", objectKey);

    expect(items).toHaveLength(1000);
    expect(items[0]).toStrictEqual(firstItem);
    expect(items[items.length - 1]).toStrictEqual(lastItem);
  });
});

describe("validateObject() fails", () => {
  test.each(dataSet)("s3 get $objectKey object command should reject and throw error", async ({ objectKey }) => {
    s3Mock.on(GetObjectCommand).rejects("error message");
    parseCsv(s3Mock as any, "bucketName", objectKey).catch((message) => {
      expect(message).toBe(
        `Error getting object ${objectKey} from bucket bucketName. Make sure they exist and your bucket is in the same region as this function.`
      );
    });
  });
});
