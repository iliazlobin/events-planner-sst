import { deleteAllEvents, saveEvent } from "@/storage/all-events";
import { it } from "vitest";

import winston from "winston";
import { generateEvent } from "../src/utils/events";

const log = winston.createLogger({
  level: "silly",
  format: winston.format.combine(winston.format.simple()),
  transports: [new winston.transports.Console()],
});

it("Save new unique event", async () => {
  log.info("Inserting new event");
  const item = generateEvent();
  log.debug(`Saving new unique item: ${JSON.stringify(item)}`);
  await saveEvent(item);
});

it("Save same event", async () => {
  log.info("Inserting the same event");
  const item = generateEvent({
    url: "https://lu.ma/same-url2",
    attendees: 50,
    title: "Event Title Same3",
  });
  log.debug(`Saving item: ${JSON.stringify(item)}`);
  await saveEvent(item);
});

it("Delete all events", async () => {
  log.info("Deleting all events");
  await deleteAllEvents();
});
