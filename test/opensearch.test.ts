import { getAllEvents } from "@/services/opensearch";
import { it } from "vitest";
import winston from "winston";

const log = winston.createLogger({
  level: "silly",
  format: winston.format.combine(winston.format.simple()),
  transports: [new winston.transports.Console()],
});

it("Retrieve events from OpenSearch", async () => {
  try {
    const { events } = await getAllEvents(10);
    log.info(`Retrieved events: ${JSON.stringify(events)}`);
  } catch (error) {
    log.error(`Failed to retrieve events: ${error}`);
    throw error;
  }
});
