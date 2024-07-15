import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { Table as DynamoDbTable } from "dynamodb-toolbox";

const DocumentClient = DynamoDBDocumentClient.from(new DynamoDBClient(), {
  marshallOptions: {
    convertEmptyValues: true
  }
})

export const Table = new DynamoDbTable({
  name: (process.env.TABLE_NAME ?? "") as string,
  partitionKey: 'pk',
  sortKey: 'code',
  DocumentClient
});
