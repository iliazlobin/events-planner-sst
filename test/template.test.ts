import { client, indexEvent } from "@/services/opensearch";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { Client } from "@opensearch-project/opensearch";
import { AwsSigv4Signer } from "@opensearch-project/opensearch/aws";
import { it } from "vitest";
import winston from "winston";
import { generateEvent } from "../src/utils/events";

const log = winston.createLogger({
  level: "silly",
  format: winston.format.combine(winston.format.simple()),
  transports: [new winston.transports.Console()],
});

it("Simple test", async () => {
  log.info(`Success`);
});
