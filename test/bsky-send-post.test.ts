import fs from "fs";
import { it } from "vitest";
import { sendTweetToBsky, BskyTweet } from "../src/services/bsky";
import winston from "winston";

const log = winston.createLogger({
  level: "silly",
  format: winston.format.combine(winston.format.simple()),
  transports: [new winston.transports.Console()],
});

it("bsky-send-post", async () => {
  const tweet: BskyTweet = {
    title: "Sunday 10vs10 Full Field 8-930AM",
    description: "This is an open game. All levels welcome.",
    url: "https://www.meetup.com/5borofc/events/305539050/",
    image: "https://secure.meetupstatic.com/photos/event/a/1/d/5/600_524921429.webp?w=750",
  };

  await sendTweetToBsky(tweet);

  log.debug("Tweet sent to Bsky successfully");
});
