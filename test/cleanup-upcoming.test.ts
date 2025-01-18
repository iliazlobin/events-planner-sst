import { saveEvent } from "@/storage/upcoming-events";
import { Context } from "@/types/context";
import { Event } from "@/types/event";
import { cleanupUpcoming } from "@/functions/cleanup-upcoming";
import { it } from "vitest";
import winston from "winston";

const log = winston.createLogger({
  level: "debug",
  format: winston.format.combine(winston.format.simple()),
  transports: [new winston.transports.Console()],
});

it("Clean up past events", async () => {
  log.info("Running test");
  console.log("Running test");

  const pastEvent: Event = {
    url: "https://example.com/past-event",
    dateStart: new Date(Date.now() - 86400000).toISOString(), // 1 day in the past
    dateEnd: new Date(Date.now() - 43200000).toISOString(), // 12 hours in the past
    title: "Past Event",
    hosts: ["Host1"],
    group: "Group1",
    address: "Address1",
    guests: ["Guest1"],
    attendees: 10,
    description: "Description1",
    cover: "Cover1",
  };

  const anotherPastEvent: Event = {
    url: "https://example.com/past-event2",
    dateStart: new Date(Date.now() - 2 * 86400000).toISOString(), // 1 day in the past
    dateEnd: new Date(Date.now() - 2 * 43200000).toISOString(), // 12 hours in the past
    title: "Past Event",
    hosts: ["Host1"],
    group: "Group1",
    address: "Address1",
    guests: ["Guest1"],
    attendees: 10,
    description: "Description1",
    cover: "Cover1",
  };

  const futureEvent: Event = {
    url: "https://example.com/future-event",
    dateStart: new Date(Date.now() + 86400000).toISOString(), // 1 day in the future
    dateEnd: new Date(Date.now() + 129600000).toISOString(), // 1.5 days in the future
    title: "Future Event",
    hosts: ["Host2"],
    group: "Group2",
    address: "Address2",
    guests: ["Guest2"],
    attendees: 20,
    description: "Description2",
    cover: "Cover2",
  };

  await saveEvent(pastEvent, true);
  await saveEvent(anotherPastEvent, true);
  await saveEvent(futureEvent);

  // Act
  await cleanupUpcoming({}, {} as Context);
});
