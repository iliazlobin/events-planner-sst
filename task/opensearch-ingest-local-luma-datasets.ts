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

  const datasetDirs = ["local-luma", "local-meetup"];

  for (const dir of datasetDirs) {
    const datasetsDir = path.join(__dirname, "datasets", dir);
    const files = fs.readdirSync(datasetsDir);

    for (const file of files) {
      const filePath = path.join(datasetsDir, file);
      const data = fs.readFileSync(filePath, "utf-8");
      const event = JSON.parse(data);
      await indexEvent(event);
    }
  }
}

main().catch(error => {
  log.error("Error ingesting event:", error);
  process.exit(1);
});
