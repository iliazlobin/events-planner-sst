import { getEvent, saveEvent } from "@/storage/all-events";
import { Context } from "@/types/context";
import { Event } from "@/types/event";
import winston from "winston";

const log = winston.createLogger({
  level: "debug",
  format: winston.format.combine(winston.format.simple()),
  transports: [new winston.transports.Console()],
});

export async function saveToAll(event: Event, context: Context): Promise<any> {
  log.silly("Payload: ", event);
  log.silly("Context: ", context);

  log.info("Saving event to all events table");

  const item = await getEvent(event.url);
  if (item) {
    if (new Date(item.dateStart) >= new Date()) {
      log.debug(`Upcoming event will be updated: ${event.url}, ${event.dateStart}`);
    } else {
      log.warn(`Past event won't be updated: ${event.url}, ${event.dateStart}`);
      return {
        status: "success",
        message: "skipped",
      };
    }
  }

  await saveEvent(event);

  log.info(`Event has been ${item ? "updated" : "saved"}: ${event.url}, ${event.dateStart}, ${event.title}`);

  return {
    status: "success",
    message: item ? "updated" : "saved",
  };
}
