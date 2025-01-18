import { Context } from "@/types/context";
import { convertItemImageToItem } from "@/types/convertion";
import { DynamoDbStreamPayload } from "@/types/dynamodb";
import { Event } from "@/types/event";
import winston from "winston";

const log = winston.createLogger({
  level: "debug",
  format: winston.format.combine(winston.format.simple()),
  transports: [new winston.transports.Console()],
});

export async function sendToEventUpdates(payload: DynamoDbStreamPayload, context: Context): Promise<any> {
  log.silly("Payload: ", payload);
  log.silly("Context: ", context);

  const newItems: Event[] = payload.Records.map(record => {
    // convert old and new images to Item
    const oldItem: Event | undefined = record.dynamodb.OldImage ? convertItemImageToItem(record.dynamodb.OldImage) : undefined;
    const newItem: Event | undefined = record.dynamodb.NewImage ? convertItemImageToItem(record.dynamodb.NewImage) : undefined;

    // skip item deletion
    if (record.eventName === "REMOVE" || !newItem) {
      return undefined;
    }

    // Don't need this logic as stream doesn't send MODIFY events with the same items
    // if (oldItem && newItem) {
    //   const fields = ["url", "dateStart", "dateEnd", "title", "hosts", "group", "address", "guests", "attendees", "description", "cover"];
    //   const isDifferent = fields.some(field => (oldItem as any)[field] !== (newItem as any)[field]);

    //   if (!isDifferent) {
    //     return undefined;
    //   }
    // }

    log.debug(`New item: ${JSON.stringify(newItem)}, Old item: ${JSON.stringify(oldItem)}`);
    return newItem;
  }).filter(item => item !== undefined);

  log.info(`Number of items to be updated: ${newItems.length}`);

  for (const item of newItems) {
    // TODO
  }

  return {
    status: "success",
  };
}
