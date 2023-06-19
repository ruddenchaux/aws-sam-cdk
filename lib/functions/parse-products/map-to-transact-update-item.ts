import { TransactWriteItem } from "@aws-sdk/client-dynamodb";
import { ProductStock } from "../../types";

export function mapToTransactUpdateItem(tableName: string, item: ProductStock): TransactWriteItem {
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
