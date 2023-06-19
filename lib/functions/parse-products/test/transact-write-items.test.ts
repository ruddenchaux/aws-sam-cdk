import { DynamoDBClient, TransactWriteItemsCommand } from "@aws-sdk/client-dynamodb";
import { mockClient } from "aws-sdk-client-mock";
import { transactWriteItems } from "../transact-write-items";

const dynamoDBClientMock = mockClient(DynamoDBClient);

test("should resolve and return %s string", async () => {
  dynamoDBClientMock.on(TransactWriteItemsCommand).resolves({});
  const commandOutput = await transactWriteItems(dynamoDBClientMock as any, []);
  expect(commandOutput).toStrictEqual({});
});
