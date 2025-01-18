import { saveEvent } from "@/storage/all-events";
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
  const item = generateEvent();
  await saveEvent(item);
}

main().catch(error => {
  log.error("Error ingesting event:", error);
  process.exit(1);
});
