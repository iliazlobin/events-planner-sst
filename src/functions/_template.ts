import { getEvent, saveEvent } from "@/storage/upcoming-events";
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

export async function handler(payload: DynamoDbStreamPayload, context: Context): Promise<any> {
  log.silly("Payload: ", payload);
  log.silly("Context: ", context);
}
