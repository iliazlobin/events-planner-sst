import { sendTweetToBsky } from "@/services/bsky";
import { generateTweet } from "@/services/openai";
import { getAllEvents } from "@/services/opensearch";
import { getPostStatus, PostStatus, savePostStatus } from "@/storage/post-status";
import { Context } from "@/types/context";
import { RichEvent } from "@/types/event";
import winston from "winston";

const log = winston.createLogger({
  level: "silly",
  format: winston.format.combine(winston.format.simple()),
  transports: [new winston.transports.Console()],
});

log.info("Post publisher file scope");

export async function retrieveRelevantEvents(payload: any, context: Context): Promise<any> {
  log.silly("Payload: ", payload);
  log.silly("Context: ", context);

  const events: RichEvent[] = [];
  const maxPosts = Number(process.env.POST_PUBLISHER_BATCH_SIZE!);
  let cursor;

  while (events.length < maxPosts) {
    log.silly(`Retrieving events with cursor: ${cursor}`);
    const { events: newEvents, cursor: newCursor } = await getAllEvents(10, cursor);
    cursor = newCursor;

    log.debug(`Retrieved ${newEvents.length} events, cursor now: ${cursor}`);
    for (const event of newEvents) {
      const newCompositeScore = calculateCompositeScore(event);

      const existingPostStatus = await getPostStatus(event.url);
      if (existingPostStatus) {
        const oldCompositeScore = calculateCompositeScore(existingPostStatus);
        if (newCompositeScore <= oldCompositeScore * 1.05) {
          log.debug(`Skipping event: ${event.url} as the new score is not significantly better: ${newCompositeScore} <= ${oldCompositeScore} * 1.1`);
          continue;
        }
      }

      log.debug(`Pushing event: ${event.url} with score: ${newCompositeScore}`);
      events.push(event);
      if (events.length >= maxPosts) {
        break;
      }
    }

    if (!cursor) {
      break;
    }
  }

  return {
    status: "success",
    events,
  };
}

type TweetEvent = RichEvent & {
  tweet: string;
};

export async function generateTweetEvent(payload: RichEvent, context: Context): Promise<any> {
  log.silly("Payload: ", payload);
  log.silly("Context: ", context);

  const event: RichEvent = payload;
  const tweet = await generateTweet(event);

  const tweetEvent: TweetEvent = {
    ...event,
    tweet,
  };

  return {
    status: "success",
    tweetEvent,
  };
}

export async function postTweetEvent(payload: { tweetEvent: TweetEvent }, context: Context): Promise<any> {
  log.silly("Payload: ", payload);
  log.silly("Context: ", context);

  const tweetEvent: TweetEvent = payload.tweetEvent;
  const currentDate = new Date().toISOString();

  log.debug(`Sending tweet to BlueSky (${process.env.BSKY_HANDLE}) for event ([${tweetEvent.title}] ${tweetEvent.url}) with 
    dateStart: ${tweetEvent.dateStart}, address: ${tweetEvent.address}, attendees: ${tweetEvent.attendees}`);
  await sendTweetToBsky({
    title: tweetEvent.title,
    description: tweetEvent.tweet,
    url: tweetEvent.url,
    image: tweetEvent.cover,
    address: tweetEvent.address,
    dateStart: tweetEvent.dateStart ? new Date(tweetEvent.dateStart) : undefined,
    dateEnd: tweetEvent.dateEnd ? new Date(tweetEvent.dateEnd) : undefined,
    attendees: tweetEvent.attendees,
  });

  log.debug(`Updating post status for event: ${tweetEvent.url} at ${currentDate}`);
  await savePostStatus({
    url: tweetEvent.url,
    dateStart: tweetEvent.dateStart,
    dateEnd: tweetEvent.dateEnd,
    blueSkyPostedDate: currentDate,
    twitterPostedDate: null,
    non_commercial: tweetEvent.non_commercial,
    popularity: tweetEvent.popularity,
    free_admision: tweetEvent.free_admision,
    no_additional_expenses: tweetEvent.no_additional_expenses,
    drinks_provided: tweetEvent.drinks_provided,
    food_provided: tweetEvent.food_provided,
    venue_niceness: tweetEvent.venue_niceness,
    quietness: tweetEvent.quietness,
    uniqueness: tweetEvent.uniqueness,
    proximity: tweetEvent.proximity,
  });

  return {
    status: "success",
  };
}

function calculateCompositeScore(status: PostStatus): number {
  let compositeScore = 0;
  compositeScore += status.popularity * 0.1;
  compositeScore += status.uniqueness * 0.2;
  compositeScore += status.venue_niceness * 0.15;
  compositeScore += status.free_admision * 0.2;
  compositeScore += status.drinks_provided * 0.1;
  compositeScore += status.food_provided * 0.1;
  compositeScore += status.quietness * 0.05;
  compositeScore += status.proximity * 0.05;
  compositeScore += status.non_commercial * 0.025;
  compositeScore += status.no_additional_expenses * 0.025;

  // Normalize composite score to be between 0 and 1
  compositeScore = Math.min(Math.max(compositeScore, 0), 1);

  // Adjust the initial score based on the composite score
  const adjustmentFactor = 1 + (compositeScore - 0.5) * 2;
  return adjustmentFactor;
}
