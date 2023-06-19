import { parse } from "@fast-csv/parse";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Product, ProductStock } from "../../types";
import { Readable } from "stream";

export async function parseCsv<T = Product | ProductStock>(s3Client: S3Client, bucketName: string, objectKey: string): Promise<T[]> {
  return new Promise(async (resolve, reject) => {
    const items: T[] = [];

    try {
      const { Body } = await s3Client.send(new GetObjectCommand({ Bucket: bucketName, Key: objectKey }));

      (Body as Readable)
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
