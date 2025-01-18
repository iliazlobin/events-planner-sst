import { AllEventsTable } from "./all-events";
import { EventsPlannerApi, LambdaAuthorizerFn } from "./api";
import { APIFY_TOKEN } from "./secrets";

const CrawledEventsQueue = new sst.aws.Queue("CrawledEventsQueue");

const CrawledEventsSaver = CrawledEventsQueue.subscribe({
  handler: "src/functions/events-processor-queue.saveToAll",
  link: [AllEventsTable],
  environment: {
    // APIFY_TOKEN: Resource.APIFY_TOKEN.value,
  },
  runtime: "nodejs20.x",
  memory: "128 MB",
  timeout: `${$app.stage === "prod" ? 10 : 60} seconds`,
});

EventsPlannerApi.route(
  "POST /event/ingestQueue",
  {
    handler: "src/functions/events-processor-queue.enqueue",
    link: [APIFY_TOKEN, CrawledEventsQueue],
    environment: {
      // APIFY_TOKEN: Resource.APIFY_TOKEN.value,
    },
    runtime: "nodejs20.x",
    memory: "128 MB",
    timeout: `${$app.stage === "prod" ? 10 : 60} seconds`,
  },
  {
    auth: {
      lambda: LambdaAuthorizerFn.id,
    },
  },
);
