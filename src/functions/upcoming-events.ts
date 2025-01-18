import { Context } from "@/types/context";
import { Event } from "@/types/event";
import { BatchWriteItemCommand, DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { Resource } from "sst";
import winston from "winston";

import { saveEvent } from "@/storage/upcoming-events";
import { convertItemImageToItem } from "@/types/convertion";
import { DynamoDbStreamPayload } from "@/types/dynamodb";

const log = winston.createLogger({
  level: "debug",
  format: winston.format.combine(winston.format.simple()),
  transports: [new winston.transports.Console()],
});

export async function updateUpcoming(payload: DynamoDbStreamPayload, context: Context): Promise<any> {
  log.silly("Payload: ", payload);
  log.silly("Context: ", context);

  const newEvent: Event[] = payload.Records.map(record => {
    const oldEvent: Event | undefined = record.dynamodb.OldImage ? convertItemImageToItem(record.dynamodb.OldImage) : undefined;
    const newEvent: Event | undefined = record.dynamodb.NewImage ? convertItemImageToItem(record.dynamodb.NewImage) : undefined;

    if (record.eventName === "REMOVE" || !newEvent) {
      return undefined;
    }

    // IDEA: Can watch specific fields for changes
    // IDEA: Can measure how rapidly the data is changing (attendies, price, etc)

    log.debug(`New event: ${JSON.stringify(newEvent)}`);
    return newEvent;
  }).filter(event => event !== undefined);

  log.info(`Update ${newEvent.length} items`);

  for (const event of newEvent) {
    log.debug(`Updating upcoming events with the item: ${JSON.stringify(event)}`);
    await saveEvent(event);
  }

  return {
    status: "debug",
  };
}

const dynamoDbClient = new DynamoDBClient({});

const tableName = Resource.UpcomingEventsTable.name;

type Payload = object;

export async function cleanupUpcoming(payload: Payload, context: Context): Promise<any> {
  log.silly(`Event: ${JSON.stringify(payload)}`);
  log.silly(`Context: ${JSON.stringify(context)}`);

  const now = new Date();
  const nowISOString = now.toISOString().split("T")[0]; // Get only the date part ("YYYY-MM-DD")

  const scanCommand = new ScanCommand({
    TableName: tableName,
    FilterExpression: "#dateStart < :now",
    ExpressionAttributeNames: {
      "#dateStart": "dateStart",
    },
    ExpressionAttributeValues: {
      ":now": { S: nowISOString },
    },
  });

  const response = await dynamoDbClient.send(scanCommand);
  // log.debug(`Response: ${JSON.stringify(response)}`);

  const items = response.Items;
  if (!items) {
    log.debug("No items to delete");
    return;
  }
  log.debug(`Identified ${items.length} items to delete`);

  const batches = [];
  while (items.length) {
    batches.push(items.splice(0, 25));
  }

  const deletePromises = batches.map(async batch => {
    const deleteItems = batch.map(item => {
      return {
        DeleteRequest: {
          Key: {
            url: item.url,
          },
        },
      };
    });

    const deleteCommand = new BatchWriteItemCommand({
      RequestItems: {
        [tableName]: deleteItems,
      },
    });

    await dynamoDbClient.send(deleteCommand);
  });

  await Promise.all(deletePromises);
}
