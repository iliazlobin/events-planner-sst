import { ItemImage } from "./dynamodb";
import { Event } from "./event";

export function convertItemImageToItem(image: ItemImage): Event {
  return {
    url: image.url?.S || "",
    dateStart: image.dateStart?.S || "",
    dateEnd: image.dateEnd?.S || "",
    title: image.title?.S || "",
    hosts: image.hosts?.SS || [],
    group: image.group?.S || "",
    address: image.address?.S || "",
    guests: image.guests?.SS || [],
    attendees: image.attendees?.N ? parseInt(image.attendees.N, 10) : 0,
    description: image.description?.S || "",
    cover: image.cover?.S || "",
    tags: image.tags?.SS || [],
    venue: image.venue?.S || "",
    online: image.online?.BOOL || false,
    eventSeriesDates: image.eventSeriesDates?.L ? image.eventSeriesDates.L.map(d => d.S).filter((d): d is string => d !== undefined) || [] : [],
    price: image.price?.N ? parseFloat(image.price.N) : null,
    minPrice: image.minPrice?.N ? parseFloat(image.minPrice.N) : null,
    maxPrice: image.maxPrice?.N ? parseFloat(image.maxPrice.N) : null,
    spotsLeft: image.spotsLeft?.N ? parseInt(image.spotsLeft.N, 10) : null,
    waitlist: image.waitlist?.BOOL || false,
    registrationClosed: image.registrationClosed?.BOOL || false,
  };
}
