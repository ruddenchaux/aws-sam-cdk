import { DynamoDBClient, TransactWriteItem, TransactWriteItemsCommand, TransactWriteItemsCommandOutput } from "@aws-sdk/client-dynamodb";

export async function transactWriteItems(
  dynamoDBClient: DynamoDBClient,
  mappedChunkTransactItems: TransactWriteItem[]
): Promise<TransactWriteItemsCommandOutput> {
  return dynamoDBClient.send(
    new TransactWriteItemsCommand({
      TransactItems: mappedChunkTransactItems,
    })
  );
}
