import { TransactWriteItem } from "@aws-sdk/client-dynamodb";
import { mapToTransactUpdateItem } from "../map-to-transact-update-item";

test("mapToTransactUpdateItem()", () => {
  const expected: TransactWriteItem = {
    Update: {
      TableName: "tableName",
      Key: {
        sku: { S: "as213sd" },
      },
      UpdateExpression: "SET #quantity = :quantity",
      ExpressionAttributeNames: { "#quantity": "quantity" },
      ExpressionAttributeValues: { ":quantity": { S: "12" } },
    },
  };

  const actual = mapToTransactUpdateItem("tableName", {
    sku: "as213sd",
    quantity: "12",
  });

  expect(actual).toStrictEqual(expected);
});
