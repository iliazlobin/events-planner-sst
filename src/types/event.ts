export type Event = {
  url: string;
  dateStart: string;
  dateEnd: string;
  title: string;
  hosts: string[];
  group: string;
  address: string;
  guests: string[];
  attendees: number;
  description: string;
  cover: string;
  tags: string[];
  venue: string;
  online: boolean;
  eventSeriesDates: string[];
  price: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  spotsLeft: number | null;
  waitlist: boolean | null;
  registrationClosed: boolean | null;
};

export type EventScores = {
  non_commercial: number;
  popularity: number;
  free_admision: number;
  no_additional_expenses: number;
  drinks_provided: number;
  food_provided: number;
  venue_niceness: number;
  quietness: number;
  uniqueness: number;
  proximity: number;
};

export type EventHighlights = {
  shortDescription: string;
  longDescription: string;
  tags: string[];
  tweet: string;
};

export type RichEvent = Event &
  EventScores &
  EventHighlights & {
    genTags: string[];
  };

export function mergeRichEvent(event: Event, scores: EventScores, highlights: EventHighlights): RichEvent {
  return {
    url: event.url,
    dateStart: event.dateStart,
    dateEnd: event.dateEnd,
    title: event.title,
    hosts: event.hosts,
    group: event.group,
    address: event.address,
    guests: event.guests,
    attendees: event.attendees,
    description: event.description,
    cover: event.cover,
    tags: event.tags,
    venue: event.venue,
    online: event.online,
    eventSeriesDates: event.eventSeriesDates,
    price: event.price,
    minPrice: event.minPrice,
    maxPrice: event.maxPrice,
    spotsLeft: event.spotsLeft,
    waitlist: event.waitlist,
    registrationClosed: event.registrationClosed,
    non_commercial: scores.non_commercial,
    popularity: scores.popularity,
    free_admision: scores.free_admision,
    no_additional_expenses: scores.no_additional_expenses,
    drinks_provided: scores.drinks_provided,
    food_provided: scores.food_provided,
    venue_niceness: scores.venue_niceness,
    quietness: scores.quietness,
    uniqueness: scores.uniqueness,
    proximity: scores.proximity,
    shortDescription: highlights.shortDescription,
    longDescription: highlights.longDescription,
    tweet: highlights.tweet,
    genTags: highlights.tags,
  };
}

export type LumaEvent = Event;

export type MeetupEvent = Event & {
  tags: string[];
  venue: string;
  online: boolean;
  eventSeriesDates: string[];
};
