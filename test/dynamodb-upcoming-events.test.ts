import { deleteEvent, saveEvent, deleteAllEvents } from "@/storage/upcoming-events";
import { Event } from "@/types/event";
import { it } from "vitest";

import winston from "winston";

const log = winston.createLogger({
  level: "silly",
  format: winston.format.combine(winston.format.simple()),
  transports: [new winston.transports.Console()],
});

function generateNewUrl(): string {
  return `https://lu.ma/${Math.random().toString(36).substring(2, 10)}`;
}

function generateNewTitle(): string {
  return `Event Title ${Math.random().toString(36).substring(2, 10)}`;
}

function generateRandomAttendees(): number {
  return Math.floor(Math.random() * 100) + 1;
}

it("generate-new-event", async () => {
  log.info("Inserting new event");

  const item: Event = {
    url: generateNewUrl(),
    cover: "https://placehold.co/600x400",
    address: "New York, New York",
    attendees: generateRandomAttendees(),
    hosts: ["Kevin Weatherman"],
    guests: ["Alan Lytz", "Lus Kairos"],
    description: "<p>Event description</p>",
    dateStart: "2001-01-17T08:55:00Z",
    dateEnd: "2001-01-17T15:15:00Z",
    title: generateNewTitle(),
    group: "Pitch and Run",
  };

  await saveEvent(item);
});

it("generate-same-event", async () => {
  log.info("Inserting the same event");

  const item: Event = {
    url: "https://lu.ma/same-url2",
    cover: "https://placehold.co/600x400",
    address: "New York, New York",
    attendees: 50,
    hosts: ["Kevin Weatherman"],
    guests: ["Alan Lytz", "Lus Kairos"],
    description: "<p>Event description</p>",
    dateStart: "2001-01-17T08:55:00Z",
    dateEnd: "2001-01-17T15:15:00Z",
    title: "Event Title Same3",
    group: "Pitch and Run",
  };

  await saveEvent(item);
});

it("Delete all events-events", async () => {
  log.info("Deleting all events");
  await deleteAllEvents();
});

// it("Clean up past events", async () => {
//   log.info("Running test");
//   console.log("Running test");

//   const pastEvent: Event = {
//     url: "https://example.com/past-event",
//     dateStart: new Date(Date.now() - 86400000).toISOString(), // 1 day in the past
//     dateEnd: new Date(Date.now() - 43200000).toISOString(), // 12 hours in the past
//     title: "Past Event",
//     hosts: ["Host1"],
//     group: "Group1",
//     address: "Address1",
//     guests: ["Guest1"],
//     attendees: 10,
//     description: "Description1",
//     cover: "Cover1",
//   };

//   const anotherPastEvent: Event = {
//     url: "https://example.com/past-event2",
//     dateStart: new Date(Date.now() - 2 * 86400000).toISOString(), // 2 days in the past
//     dateEnd: new Date(Date.now() - 2 * 43200000).toISOString(), // 1 day in the past
//     title: "Past Event",
//     hosts: ["Host1"],
//     group: "Group1",
//     address: "Address1",
//     guests: ["Guest1"],
//     attendees: 10,
//     description: "Description1",
//     cover: "Cover1",
//   };

//   const futureEvent: Event = {
//     url: "https://example.com/future-event",
//     dateStart: new Date(Date.now() + 86400000).toISOString(), // 1 day in the future
//     dateEnd: new Date(Date.now() + 129600000).toISOString(), // 1.5 days in the future
//     title: "Future Event",
//     hosts: ["Host2"],
//     group: "Group2",
//     address: "Address2",
//     guests: ["Guest2"],
//     attendees: 20,
//     description: "Description2",
//     cover: "Cover2",
//   };

//   await saveEvent(pastEvent, true);
//   await saveEvent(anotherPastEvent, true);
//   await saveEvent(futureEvent);

//   // Act
//   await handler({}, {} as Context);
// });

// it("Clean up past events", async () => {
//   log.info("Running test");
//   console.log("Running test");

//   const pastEvent: Event = {
//     url: "https://example.com/past-event",
//     dateStart: new Date(Date.now() - 86400000).toISOString(), // 1 day in the past
//     dateEnd: new Date(Date.now() - 43200000).toISOString(), // 12 hours in the past
//     title: "Past Event",
//     hosts: ["Host1"],
//     group: "Group1",
//     address: "Address1",
//     guests: ["Guest1"],
//     attendees: 10,
//     description: "Description1",
//     cover: "Cover1",
//   };

//   const anotherPastEvent: Event = {
//     url: "https://example.com/past-event2",
//     dateStart: new Date(Date.now() - 2 * 86400000).toISOString(), // 2 days in the past
//     dateEnd: new Date(Date.now() - 2 * 43200000).toISOString(), // 1 day in the past
//     title: "Past Event",
//     hosts: ["Host1"],
//     group: "Group1",
//     address: "Address1",
//     guests: ["Guest1"],
//     attendees: 10,
//     description: "Description1",
//     cover: "Cover1",
//   };

//   const futureEvent: Event = {
//     url: "https://example.com/future-event",
//     dateStart: new Date(Date.now() + 86400000).toISOString(), // 1 day in the future
//     dateEnd: new Date(Date.now() + 129600000).toISOString(), // 1.5 days in the future
//     title: "Future Event",
//     hosts: ["Host2"],
//     group: "Group2",
//     address: "Address2",
//     guests: ["Guest2"],
//     attendees: 20,
//     description: "Description2",
//     cover: "Cover2",
//   };

//   await saveEvent(pastEvent, true);
//   await saveEvent(anotherPastEvent, true);
//   await saveEvent(futureEvent);

//   // Act
//   await handler({}, {} as Context);
// });
