import axios from "axios";
import fs from "fs";
import { Resource } from "sst";
import { it } from "vitest";
import winston from "winston";

const log = winston.createLogger({
  level: "silly",
  format: winston.format.combine(winston.format.simple()),
  transports: [new winston.transports.Console()],
});

it("izlobin-luma-ingest", async () => {
  const payload = fs.readFileSync(`${__dirname}/payload/events-crawler-luma-payload.json`);
  const data = JSON.parse(payload.toString());

  const token = Resource.EVENTS_INGEST_TOKEN.value;
  // log.silly(`token: ${token}`);

  const response = await axios.post(
    "https://qrcoea70i6.execute-api.us-east-1.amazonaws.com/event/ingest", // izlobin
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 60000,
    },
  );

  log.debug(response.data);
});

it("izlobin-meetup-ingest", async () => {
  const payload = fs.readFileSync(`${__dirname}/payload/events-crawler-meetup-payload.json`);
  const data = JSON.parse(payload.toString());

  const token = Resource.EVENTS_INGEST_TOKEN.value;
  // log.silly(`token: ${token}`);

  const response = await axios.post(
    "https://qrcoea70i6.execute-api.us-east-1.amazonaws.com/event/ingest", // izlobin
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 60000,
    },
  );

  log.debug(response.data);
});

it("izlobin-meetup-ingest-queue", async () => {
  const payload = fs.readFileSync(`${__dirname}/payload/events-crawler-meetup-payload.json`);
  const data = JSON.parse(payload.toString());

  const token = Resource.EVENTS_INGEST_TOKEN.value;
  // log.silly(`token: ${token}`);

  const response = await axios.post(
    // "https://qrcoea70i6.execute-api.us-east-1.amazonaws.com/event/ingestQueue", // izlobin
    "https://api.eventsplanner-izlobin.iliazlobin.com/event/ingestQueue", // izlobin
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 60000,
    },
  );

  log.debug(response.data);
});

it("izlobin-luma-ingest-queue", async () => {
  const payload = fs.readFileSync(`${__dirname}/payload/events-crawler-luma-payload.json`);
  const data = JSON.parse(payload.toString());

  const token = Resource.EVENTS_INGEST_TOKEN.value;
  // log.silly(`token: ${token}`);

  const response = await axios.post(
    "https://qrcoea70i6.execute-api.us-east-1.amazonaws.com/event/ingestQueue", // izlobin
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 60000,
    },
  );

  log.debug(response.data);
});

it("prod-luma-ingest", async () => {
  const payload = fs.readFileSync(`${__dirname}/payload/events-crawler-luma-payload.json`);
  const data = JSON.parse(payload.toString());

  const token = Resource.EVENTS_INGEST_TOKEN.value;
  // log.silly(`token: ${token}`);

  const response = await axios.post(
    "https://5tq4fzsc4d.execute-api.us-east-1.amazonaws.com/event/ingest", // prod
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 60000,
    },
  );

  log.debug(response.data);
});

it("prod-luma-ingest-queue", async () => {
  const payload = fs.readFileSync(`${__dirname}/payload/events-crawler-luma-payload.json`);
  const data = JSON.parse(payload.toString());

  const token = Resource.EVENTS_INGEST_TOKEN.value;
  // log.silly(`token: ${token}`);

  const response = await axios.post(
    "https://5tq4fzsc4d.execute-api.us-east-1.amazonaws.com/event/ingestQueue", // prod
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 60000,
    },
  );

  log.debug(response.data);
});

it("prod-meetup-ingest", async () => {
  const payload = fs.readFileSync(`${__dirname}/payload/events-crawler-meetup-payload.json`);
  const data = JSON.parse(payload.toString());

  const token = Resource.EVENTS_INGEST_TOKEN.value;
  // log.silly(`token: ${token}`);

  const response = await axios.post(
    "https://5tq4fzsc4d.execute-api.us-east-1.amazonaws.com/event/ingest", // prod
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 60000,
    },
  );

  log.debug(response.data);
});

it("prod-meetup-ingest-queue", async () => {
  const payload = fs.readFileSync(`${__dirname}/payload/events-crawler-meetup-payload.json`);
  const data = JSON.parse(payload.toString());

  const token = Resource.EVENTS_INGEST_TOKEN.value;
  // log.silly(`token: ${token}`);

  const response = await axios.post(
    "https://5tq4fzsc4d.execute-api.us-east-1.amazonaws.com/event/ingestQueue", // prod
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 60000,
    },
  );

  log.debug(response.data);
});
