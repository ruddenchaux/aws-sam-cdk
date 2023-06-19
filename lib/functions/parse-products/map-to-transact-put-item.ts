import { TransactWriteItem } from "@aws-sdk/client-dynamodb";
import { Product } from "../../types";

export function mapToTransactPutItem(tableName: string, item: Product): TransactWriteItem {
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
