import { Event } from "@/types/event";
import { DeleteItemCommand, DynamoDBClient, GetItemCommand, GetItemCommandInput, PutItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import moment from "moment";
import { Resource } from "sst";

import winston from "winston";

// https://github.com/winstonjs/winston
const log = winston.createLogger({
  level: "debug",
  format: winston.format.combine(winston.format.simple()),
  transports: [new winston.transports.Console()],
});

const client = new DynamoDBClient({});
const table = Resource.UpcomingEventsTable.name;

export async function getEvent(url: string): Promise<Event | undefined> {
  const getItemInput: GetItemCommandInput = {
    TableName: table,
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
    url: item.url.S || "",
    dateStart: item.dateStart.S || "",
    dateEnd: item.dateEnd.S || "",
    title: item.title.S || "",
    hosts: item.hosts.SS || [],
    group: item.group.S || "",
    address: item.address.S || "",
    guests: item.guests.SS || [],
    attendees: item.attendees.N ? parseInt(item.attendees.N, 10) : 0,
    description: item.description.S || "",
    cover: item.cover.S || "",
  };
}

export async function saveEvent(item: Event, savePast: boolean = false): Promise<void> {
  const now = moment();
  const dateStart = moment(item.dateStart);

  if (!savePast && dateStart.isBefore(now)) {
    log.warn(`Event ${item.url} is in the past, will be deleted if exists`);
    await deleteEvent(item.url);
    return;
  }

  item.hosts = Array.from(new Set(item.hosts));
  item.guests = Array.from(new Set(item.guests));

  const input: {
    TableName: string;
    Item: {
      url: { S: string };
      dateStart: { S: string };
      dateEnd: { S: string };
      title: { S: string };
      hosts: { SS: string[] };
      group: { S: string };
      address: { S: string };
      guests: { SS: string[] };
      attendees: { N: string };
      description: { S: string };
      cover: { S: string };
      ttl?: { N: string };
    };
  } = {
    TableName: table,
    Item: {
      url: { S: item.url },
      dateStart: { S: item.dateStart },
      dateEnd: { S: item.dateEnd },
      title: { S: item.title },
      hosts: { SS: item.hosts },
      group: { S: item.group },
      address: { S: item.address },
      guests: { SS: item.guests },
      attendees: { N: item.attendees.toString() },
      description: { S: item.description },
      cover: { S: item.cover },
    },
  };

  if (!savePast) {
    const ttl = dateStart.diff(now, "seconds");
    input.Item.ttl = { N: ttl.toString() };
  }

  const command = new PutItemCommand(input);
  await client.send(command);
}

export async function deleteEvent(url: string): Promise<void> {
  const input = {
    TableName: table,
    Key: {
      url: { S: url },
    },
  };

  const command = new DeleteItemCommand(input);
  await client.send(command);
}

export async function deleteAllEvents(): Promise<void> {
  const scanCommand = new ScanCommand({ TableName: table });
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

export async function getAllEvents(): Promise<Event[]> {
  const scanCommand = new ScanCommand({ TableName: table });
  const response = await client.send(scanCommand);

  if (response.$metadata.httpStatusCode !== 200) {
    throw new Error(`Bad status code`);
  }

  const items = response.Items || [];
  return items.map(item => ({
    url: item.url.S || "",
    dateStart: item.dateStart.S || "",
    dateEnd: item.dateEnd.S || "",
    title: item.title.S || "",
    hosts: item.hosts.SS || [],
    group: item.group.S || "",
    address: item.address.S || "",
    guests: item.guests.SS || [],
    attendees: item.attendees.N ? parseInt(item.attendees.N, 10) : 0,
    description: item.description.S || "",
    cover: item.cover.S || "",
  }));
}
