import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";
import dotenv from "dotenv";
import winston from "winston";

const log = winston.createLogger({
  level: "silly",
  format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
  transports: [new winston.transports.Console()],
});

dotenv.config({ path: ".env", override: true });

const sfnClient = new SFNClient({ region: "us-east-1" });

async function main() {
  const stateMachineArn = "arn:aws:states:us-east-1:913524919104:stateMachine:aws-apig-auth-izlobin-PostPublisherStateMachine";

  const command = new StartExecutionCommand({
    stateMachineArn,
    input: JSON.stringify({
      version: "0",
      id: "abcd1234-5678-90ab-cdef-1234567890ab",
      "detail-type": "Scheduled Event",
      source: "aws.events",
      account: "123456789012",
      time: new Date().toISOString(),
      region: "us-east-1",
      resources: ["arn:aws:events:us-east-1:123456789012:rule/PostPublisherRule"],
      detail: {},
    }),
  });

  const { executionArn } = await sfnClient.send(command);
  log.info("Step function invoked successfully:", executionArn);
}

main().catch(error => {
  log.error("Unexpected error:", error);
  process.exit(1);
});
