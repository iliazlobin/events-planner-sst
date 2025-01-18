import { indexEvent } from "@/services/opensearch";
import { getEvent, saveEvent } from "@/storage/upcoming-events";
import { Context } from "@/types/context";
import { convertItemImageToItem } from "@/types/convertion";
import { DynamoDbStreamPayload } from "@/types/dynamodb";
import { Event } from "@/types/event";
import { send } from "vite";
import winston from "winston";

const log = winston.createLogger({
  level: "debug",
  format: winston.format.combine(winston.format.simple()),
  transports: [new winston.transports.Console()],
});

export async function ingestSearch(payload: DynamoDbStreamPayload, context: Context): Promise<any> {
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
    log.debug(`Updating search index with the item: ${JSON.stringify(event)}`);
    await indexEvent(event);
  }

  return {
    status: "success",
  };
}
