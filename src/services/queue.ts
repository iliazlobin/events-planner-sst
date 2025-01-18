import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { Resource } from "sst";
import winston from "winston";
import { Event } from "../types/event";

const log = winston.createLogger({
  level: "debug",
  format: winston.format.combine(winston.format.simple()),
  transports: [new winston.transports.Console()],
});

const sqsClient = new SQSClient({ region: "us-east-1" });

export async function enqueueEventUpdates(item: Event) {
  const queueUrl = Resource.EventUpdatesQueue.url;
  log.info(`Sending message to queue: ${queueUrl}`);

  const params = {
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(item),
  };

  try {
    const data = await sqsClient.send(new SendMessageCommand(params));
    log.verbose(`Message successfully sent: ${data.MessageId}`);
  } catch (err) {
    throw new Error(`Error sending message to queue: ${err}`);
  }
}
