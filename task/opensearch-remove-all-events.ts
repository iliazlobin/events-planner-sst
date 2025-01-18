import { getClient, indexEvent } from "@/services/opensearch";
import { generateEvent } from "@/utils/events";
import dotenv from "dotenv";
import winston from "winston";

const log = winston.createLogger({
  level: "silly",
  format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
  transports: [new winston.transports.Console()],
});

dotenv.config({ path: ".env", override: true });

async function main() {
  const response = await getClient().search({
    index: process.env.ALL_EVENTS_INDEX!,
    size: 10000,
    body: {
      query: {
        match_all: {},
      },
    },
  });

  const events = response.body.hits.hits;
  log.debug(`Found ${events.length} events`);
  for (const event of events) {
    await getClient().delete({
      index: process.env.ALL_EVENTS_INDEX!,
      id: event._id,
    });
  }

  log.info("All events removed");
}

main().catch(error => {
  log.error("Error removing events:", error);
  process.exit(1);
});
