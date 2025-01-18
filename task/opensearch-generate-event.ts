import { indexEvent } from "@/services/opensearch";
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
  log.debug("AWS_PROFILE:", process.env.AWS_PROFILE);
  log.debug("ALL_EVENTS_INDEX:", process.env.ALL_EVENTS_INDEX);
  const item = generateEvent();
  await indexEvent(item);
}

main().catch(error => {
  log.error("Error ingesting event:", error);
  process.exit(1);
});
