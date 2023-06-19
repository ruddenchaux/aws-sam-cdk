import { TransactWriteItem } from "@aws-sdk/client-dynamodb";
import { mapToTransactPutItem } from "../map-to-transact-put-item";

test("mapToTransactPutItem()", () => {
  const expected: TransactWriteItem = {
    Put: {
      TableName: "tableName",
      Item: {
        sku: { S: "as213sd" },
        name: { S: "product1" },
        price: { N: "12.5" },
      },
    },
  };

  const actual = mapToTransactPutItem("tableName", {
    sku: "as213sd",
    name: "product1",
    price: "12.5",
  });

  expect(actual).toStrictEqual(expected);
});
