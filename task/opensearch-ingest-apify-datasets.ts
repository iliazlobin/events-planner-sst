import { ingestSearch } from "@/functions/search-index";
import { indexEvent } from "@/services/opensearch";
import { generateEvent } from "@/utils/events";
import dotenv from "dotenv";
import winston from "winston";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const log = winston.createLogger({
  level: "silly",
  format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
  transports: [new winston.transports.Console()],
});

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  log.debug("AWS_PROFILE:", process.env.AWS_PROFILE);
  log.debug("ALL_EVENTS_INDEX:", process.env.ALL_EVENTS_INDEX);

  const datasets = ["dataset_events-crawler-luma_2025-01-20_05-41-38-285.json"];
  for (const dataset of datasets) {
    const data = fs.readFileSync(`${__dirname}/datasets/apify/${dataset}`, "utf-8");
    const events = JSON.parse(data);
    for (const event of events) {
      await indexEvent(event);
    }
  }
}

main().catch(error => {
  log.error("Error ingesting event:", error);
  process.exit(1);
});
