import { Event, RichEvent as RichEvent } from "@/types/event";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { Client } from "@opensearch-project/opensearch";
import { AwsSigv4Signer } from "@opensearch-project/opensearch/aws";
import winston from "winston";

const log = winston.createLogger({
  level: "silly",
  format: winston.format.combine(winston.format.simple()),
  transports: [new winston.transports.Console()],
});

let client: Client;

export function getClient() {
  if (client) {
    return client;
  }

  client = new Client({
    ...AwsSigv4Signer({
      region: "us-east-1",
      service: "es",
      getCredentials: () => {
        const credentialsProvider = defaultProvider();
        return credentialsProvider();
      },
    }),
    node: process.env.OPENSEARCH_URL!,
  });

  return client;
}

// export const client = new Client({
//   ...AwsSigv4Signer({
//     region: "us-east-1",
//     service: "es",
//     getCredentials: () => {
//       const credentialsProvider = defaultProvider();
//       return credentialsProvider();
//     },
//   }),
//   // node: "https://search-manual-test-fczgibvrlzm6dobny7dhtzpqmq.aos.us-east-1.on.aws", // manual-test/dualstack
//   node: process.env.OPENSEARCH_URL!,
//   // node: "https://search-manual-test-fczgibvrlzm6dobny7dhtzpqmq.us-east-1.es.amazonaws.com", // manual-test/ipv4
// });

export async function indexEvent(data: Event) {
  const response = await getClient().index({
    index: process.env.ALL_EVENTS_INDEX!,
    id: data.url,
    body: data,
  });
  log.debug(`Event has been indexed: ${data.url}`);
}

export async function indexRichEvent(event: RichEvent) {
  const response = await getClient().index({
    index: process.env.ALL_EVENTS_INDEX!,
    id: event.url,
    body: event,
  });
  log.debug(`Rich event has been indexed: ${event.url}`);
}

export async function getAllEvents(size = 10, cursor?: string): Promise<{ events: RichEvent[]; cursor?: string }> {
  const searchParams: any = {
    index: process.env.ALL_EVENTS_INDEX!,
    size: size,
    body: {
      _source: [
        "url",
        "dateStart",
        "dateEnd",
        "title",
        "hosts",
        "group",
        "address",
        "guests",
        "attendees",
        "description",
        "cover",
        "tags",
        "venue",
        "online",
        "eventSeriesDates",
        "price",
        "minPrice",
        "maxPrice",
        "spotsLeft",
        "waitlist",
        "registrationClosed",
        "non_commercial",
        "popularity",
        "free_admision",
        "no_additional_expenses",
        "drinks_provided",
        "food_provided",
        "venue_niceness",
        "quietness",
        "uniqueness",
        "proximity",
        "shortDescription",
        "longDescription",
        "tweet",
        "genTags",
      ],
      query: {
        bool: {
          must: [
            {
              range: {
                dateStart: {
                  gte: "now",
                  lte: "now+14d/d",
                  format: "strict_date_optional_time",
                },
              },
            },
          ],
        },
      },
      sort: [{ _score: "desc" }, { _id: "asc" }],
    },
  };

  if (cursor) {
    searchParams.body.search_after = cursor.split(",");
  }

  const response = await getClient().search(searchParams);

  log.debug(`Retrieved ${response.body.hits.hits.length} events`);

  const events = response.body.hits.hits.map((hit: any) => hit._source as RichEvent);
  const newCursor =
    response.body.hits.hits.length > 0 && response.body.hits.hits[response.body.hits.hits.length - 1].sort
      ? response.body.hits.hits[response.body.hits.hits.length - 1].sort?.join(",")
      : undefined;

  return { events, cursor: newCursor };
}
