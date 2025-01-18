import { Context } from "@/types/context";
import { ApifyPayload } from "@/types/apify";
import { ApifyClient, Dataset } from "apify";
import { Resource } from "sst";
import winston from "winston";
import { Event } from "@/types/event";

const log = winston.createLogger({
  level: "silly",
  format: winston.format.combine(winston.format.simple()),
  transports: [new winston.transports.Console()],
});

const apifyClient = new ApifyClient({
  token: Resource.APIFY_TOKEN.value,
});

export async function retrieveFromApify(payload: ApifyPayload, context: Context): Promise<any> {
  log.silly("Payload: ", payload);
  log.silly("Context: ", context);

  log.info(`Retrieving events from Apify`);

  const exitCode = payload.resource.exitCode;
  if (exitCode !== 0) {
    throw new Error(`Exist code is not successful: ${exitCode}`);
  }

  const actorId = payload.eventData.actorId;
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
  const datasetId = payload.resource.defaultDatasetId;
  log.info(`Retrieving events: ${actor.name}, ${crawlerName}, ${datasetId}`);

  const events = await retrieveFromDataset({ datasetId });
  const byteSize = Buffer.byteLength(JSON.stringify(events), "utf8");
  log.debug(`Retrieved ${events.length} events with ${byteSize} bytes`);

  return {
    status: "success",
    events: events,
  };
}

export async function retrieveFromDataset({ datasetId }: { datasetId: string }): Promise<Event[]> {
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

// export async function retrieveDatasetItem({ datasetId, url }: { datasetId: string; url: string }): Promise<Item> {
//   const dataset = new Dataset({ id: datasetId, client: apifyClient }); // Fix: Pass dataset ID and client as an object
//   const datasetItems = await dataset.getData();
//   const item = datasetItems.items.find((item: any) => item.url === url);
//   if (!item) {
//     throw new Error(`Item not found`);
//   }
//   return {
//     url: item.url,
//     dateStart: item.dateStart,
//     dateEnd: item.dateEnd,
//     title: item.title,
//     hosts: item.hosts,
//     group: item.group,
//     address: item.address,
//     guests: item.guests,
//     attendees: item.attendees,
//     description: item.description,
//     cover: item.cover,
//   };
// }
