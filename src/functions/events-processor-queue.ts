import { APIGatewayProxyEvent, SQSEvent } from "aws-lambda";
import { ApifyPayload } from "@/types/apify";
import { Context } from "@/types/context";
import { Event } from "@/types/event";
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { ApifyClient, Dataset } from "apify";
import { Resource } from "sst";
import winston from "winston";
import { getEvent, saveEvent } from "@/storage/all-events";

const log = winston.createLogger({
  level: "debug",
  format: winston.format.combine(winston.format.simple()),
  transports: [new winston.transports.Console()],
});

let apifyClientInstance: ApifyClient | null = null;
let sqsClientInstance: SQSClient | null = null;

function getApifyClient() {
  if (!apifyClientInstance) {
    apifyClientInstance = new ApifyClient({
      token: Resource.APIFY_TOKEN.value,
    });
  }
  return apifyClientInstance;
}

function getSqsClient() {
  if (!sqsClientInstance) {
    sqsClientInstance = new SQSClient();
  }
  return sqsClientInstance;
}

// payload: API Gateway Proxy Event
export async function enqueue(payload: APIGatewayProxyEvent, context: Context): Promise<any> {
  const apifyClient = getApifyClient();
  const sqsClient = getSqsClient();

  log.silly("Payload: ", payload);
  log.silly("Context: ", context);

  if (!payload.body) {
    throw new Error("Payload body is empty");
  }

  const body = JSON.parse(payload.body);
  const apifyPayload: ApifyPayload = body;

  log.info(`Retrieving events from Apify`);

  const exitCode = apifyPayload.resource.exitCode;
  if (exitCode !== 0) {
    throw new Error(`Exist code is not successful: ${exitCode}`);
  }

  const actorId = apifyPayload.eventData.actorId;
  const actor = await apifyClient.actor(actorId).get();
  if (!actor) {
    throw new Error(`Actor isn't identified: ${actorId}`);
  }

  // actorName = iliazlobin/events-crawler-meetup or iliazlobin/events-crawler-luma
  const match = actor.name.match(/events-crawler-(.+)$/);
  if (!match) {
    throw new Error(`Actor name is invalid: ${actor.name}`);
  }

  const crawlerName = match[1];
  const datasetId = apifyPayload.resource.defaultDatasetId;
  log.info(`Retrieving events: ${actor.name}, ${crawlerName}, ${datasetId}`);

  const events = await retrieveFromDataset({ datasetId, apifyClient });
  const byteSize = Buffer.byteLength(JSON.stringify(events), "utf8");
  log.debug(`Retrieved ${events.length} events with ${byteSize} bytes`);

  let enqueuedEvents = 0;
  for (const event of events) {
    try {
      await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: Resource.CrawledEventsQueue.url,
          MessageBody: JSON.stringify(event),
        }),
      );
      enqueuedEvents++;
    } catch (error) {
      // it's fine to proceed cause we're likely going to receive the same event again in the next crawl batch
      if (error instanceof Error) {
        log.error(`Failed to send event to SQS: ${error.message} ${JSON.stringify(event)}`);
      }
    }
  }

  if (events.length > 0 && enqueuedEvents === 0) {
    log.error(`0/${events.length} events were enqueued to the queue (${Resource.CrawledEventsQueue.url})`);
    throw new Error("Failed to enqueue events to the queue");
  }

  log.info(`Successfully sent ${enqueuedEvents}/${events.length} events to the queue (${Resource.CrawledEventsQueue.url})`);

  return {
    status: "success",
    enqueuedEvents: enqueuedEvents,
    receivedEvents: events.length,
  };
}

export async function retrieveFromDataset({ datasetId, apifyClient }: { datasetId: string; apifyClient: ApifyClient }): Promise<Event[]> {
  const dataset = new Dataset({ id: datasetId, client: apifyClient }); // Fix: Pass dataset ID and client as an object
  const datasetItems = await dataset.getData();

  return datasetItems.items.map((item: any) => ({
    url: item.url.replace(/\/$/, ""),
    dateStart: item.dateStart,
    dateEnd: item.dateEnd,
    title: item.title,
    hosts: item.hosts,
    group: item.group,
    address: item.address,
    guests: item.guests,
    attendees: item.attendees,
    description: item.description,
    cover: item.cover,
    tags: item.tags || [],
    venue: item.venue || "",
    online: item.online || false,
    eventSeriesDates: item.eventSeriesDates || [],
    price: item.price !== undefined ? item.price : null,
    minPrice: item.minPrice !== undefined ? item.minPrice : null,
    maxPrice: item.maxPrice !== undefined ? item.maxPrice : null,
    spotsLeft: item.spotsLeft !== undefined ? item.spotsLeft : null,
    waitlist: item.waitlist !== undefined ? item.waitlist : null,
    registrationClosed: item.registrationClosed !== undefined ? item.registrationClosed : null,
  }));
}

// payload: SQS payload
export async function saveToAll(payload: SQSEvent, context: Context): Promise<any> {
  log.silly("Payload: ", payload);
  log.silly("Context: ", context);

  for (const record of payload.Records) {
    const item: Event = JSON.parse(record.body);
    log.silly(`Processing event: ${item.url}`);

    const event = await getEvent(item.url);
    if (event) {
      if (new Date(event.dateStart) >= new Date()) {
        log.debug(`Upcoming event will be updated: ${item.url}, ${item.dateStart}`);
      } else {
        log.warn(`Past event won't be updated: ${item.url}, ${item.dateStart}`);
        continue;
      }
    }

    await saveEvent(item);
    log.debug(`Event has been ${event ? "updated" : "saved"}: ${item.url}, ${item.dateStart}, ${item.title}`);
  }

  return {
    status: "success",
  };
}
