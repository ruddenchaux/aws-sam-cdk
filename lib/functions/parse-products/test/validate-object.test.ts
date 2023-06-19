import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
import { validateObject } from "../validate-object";

const s3Mock = mockClient(S3Client);

describe("validateObject() successfully", () => {
  const dataSet = ["products.csv", "stocks.csv"];
  test.each(dataSet)("should resolve and return %s string", async (expectdObjectKey) => {
    s3Mock.on(GetObjectCommand).resolves({ ContentType: "text/csv" });

    const objectKey = await validateObject(s3Mock as any, "bucketName", expectdObjectKey, ["products.csv", "stocks.csv"]);

    expect(objectKey).toBe(expectdObjectKey);
  });
});

describe("validateObject() fails", () => {
  const dataSet0 = ["product.csv", "stock.csv"];
  test.each(dataSet0)("should reject and throw error Object key %s is not valid", (objectKey) => {
    expect.assertions(1);
    validateObject(s3Mock as any, "bucketName", objectKey, ["products.csv", "stocks.csv"]).catch((e) => {
      expect(e.message).toBe(`Object key ${objectKey} is not valid`);
    });
  });

  const dataSet1 = ["text/xml", "text/javascript", "image/png"];
  test.each(dataSet1)("should reject and throw error Content type %s is not text/csv", (mimeType) => {
    s3Mock.on(GetObjectCommand).resolves({ ContentType: mimeType });
    expect.assertions(1);
    validateObject(s3Mock as any, "bucketName", "products.csv", ["products.csv", "stocks.csv"]).catch((e) => {
      expect(e.message).toBe(`Content type ${mimeType} is not text/csv`);
    });
  });
});
