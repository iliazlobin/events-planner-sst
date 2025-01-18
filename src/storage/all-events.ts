import { Event } from "@/types/event";
import { DeleteItemCommand, DynamoDBClient, GetItemCommand, GetItemCommandInput, PutItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { Resource } from "sst";

import winston from "winston";

// https://github.com/winstonjs/winston
const log = winston.createLogger({
  level: "debug",
  format: winston.format.combine(winston.format.simple()),
  transports: [new winston.transports.Console()],
});

let dynamoDbClientInstance: DynamoDBClient | null = null;

function getDynamoDbClient() {
  if (!dynamoDbClientInstance) {
    dynamoDbClientInstance = new DynamoDBClient({});
  }
  return dynamoDbClientInstance;
}

export async function getEvent(url: string): Promise<Event | undefined> {
  const client = getDynamoDbClient();
  const getItemInput: GetItemCommandInput = {
    TableName: Resource.AllEventsTable.name,
    Key: {
      url: { S: url },
    },
  };
  const getItemCommand = new GetItemCommand(getItemInput);
  const response = await client.send(getItemCommand);
  if (response.$metadata.httpStatusCode !== 200) {
    throw new Error(`Bad status code`);
  }

  const item = response.Item;
  if (!item) {
    return undefined;
  }

  return {
    url: item.url?.S || "",
    dateStart: item.dateStart?.S || "",
    dateEnd: item.dateEnd?.S || "",
    title: item.title?.S || "",
    hosts: item.hosts?.SS || [],
    group: item.group?.S || "",
    address: item.address?.S || "",
    guests: item.guests?.SS || [],
    attendees: item.attendees?.N ? parseInt(item.attendees.N, 10) : 0,
    description: item.description?.S || "",
    cover: item.cover?.S || "",
    tags: item.tags?.SS || [],
    venue: item.venue?.S || "",
    online: item.online?.BOOL || false,
    eventSeriesDates: item.eventSeriesDates?.L ? item.eventSeriesDates.L.map(d => d.S).filter((d): d is string => d !== undefined) || [] : [],
    price: item.price?.N ? parseFloat(item.price.N) : null,
    minPrice: item.minPrice?.N ? parseFloat(item.minPrice.N) : null,
    maxPrice: item.maxPrice?.N ? parseFloat(item.maxPrice.N) : null,
    spotsLeft: item.spotsLeft?.N ? parseInt(item.spotsLeft.N, 10) : null,
    waitlist: item.waitlist?.BOOL || false,
    registrationClosed: item.registrationClosed?.BOOL || false,
  };
}

export async function saveEvent(event: Event): Promise<void> {
  const client = getDynamoDbClient();
  event.hosts = Array.from(new Set(event.hosts.filter(host => host !== null)));
  event.guests = Array.from(new Set(event.guests.filter(guest => guest !== null)));
  event.tags = Array.from(new Set(event.tags.filter(tag => tag !== null)));

  const item: Record<string, any> = {
    url: { S: event.url },
    dateStart: { S: event.dateStart },
    dateEnd: { S: event.dateEnd },
    title: { S: event.title },
    hosts: event.hosts.length > 0 ? { SS: event.hosts } : undefined,
    group: event.group && event.group != "undefined" ? { S: event.group } : undefined,
    address: event.address && event.address != "undefined" ? { S: event.address } : undefined,
    guests: event.guests.length > 0 ? { SS: event.guests } : undefined,
    attendees: { N: event.attendees.toString() },
    description: event.description && event.description != "undefined" ? { S: event.description } : undefined,
    cover: event.cover && event.cover != "undefined" ? { S: event.cover } : undefined,
    tags: event.tags.length > 0 ? { SS: event.tags } : undefined,
    venue: event.venue && event.venue != "undefined" ? { S: event.venue } : undefined,
    online: { BOOL: event.online },
    eventSeriesDates: event.eventSeriesDates.length > 0 ? { L: event.eventSeriesDates.map(date => ({ S: date })) } : undefined,
    waitlist: event.waitlist !== null ? { BOOL: event.waitlist } : undefined,
    registrationClosed: event.registrationClosed !== null ? { BOOL: event.registrationClosed } : undefined,
    price: event.price !== null ? { N: event.price.toString() } : undefined,
    minPrice: event.minPrice !== null ? { N: event.minPrice.toString() } : undefined,
    maxPrice: event.maxPrice !== null ? { N: event.maxPrice.toString() } : undefined,
    spotsLeft: event.spotsLeft !== null ? { N: event.spotsLeft.toString() } : undefined,
  };

  // Remove undefined and empty string set attributes
  Object.keys(item).forEach(key => {
    if (item[key] === undefined || (item[key].SS && item[key].SS.length === 0)) {
      delete item[key];
    }
  });

  const input = {
    TableName: Resource.AllEventsTable.name,
    Item: item,
  };

  try {
    const command = new PutItemCommand(input);
    await client.send(command);
    log.debug(`Saved event ${event.url}`);
  } catch (error) {
    log.error(`Failed to save event ${event.url}: ${error}`);
    throw error;
  }
}

export async function deleteEvent(url: string): Promise<void> {
  const client = getDynamoDbClient();
  const input = {
    TableName: Resource.AllEventsTable.name,
    Key: {
      url: { S: url },
    },
  };

  const command = new DeleteItemCommand(input);
  await client.send(command);
}

export async function deleteAllEvents(): Promise<void> {
  const client = getDynamoDbClient();
  const scanCommand = new ScanCommand({ TableName: Resource.AllEventsTable.name });
  const response = await client.send(scanCommand);
  if (response.$metadata.httpStatusCode !== 200) {
    throw new Error(`Bad status code`);
  }

  const items = response.Items || [];
  for (const item of items) {
    const url = item.url.S;
    if (url) {
      await deleteEvent(url);
    }
  }
}
