import { Event } from "@/types/event";

export function generateNewUrl(): string {
  return `https://lu.ma/${Math.random().toString(36).substring(2, 10)}`;
}

export function generateNewTitle(): string {
  return `Event Title ${Math.random().toString(36).substring(2, 10)}`;
}

export function generateRandomAttendees(): number {
  return Math.floor(Math.random() * 100) + 1;
}

export function generateEvent(overrides: Partial<Event> = {}): Event {
  return {
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
    tags: [],
    venue: "Default Venue",
    online: false,
    eventSeriesDates: [],
    price: null,
    minPrice: null,
    maxPrice: null,
    spotsLeft: null,
    waitlist: false,
    registrationClosed: false,
    ...overrides,
  };
}
