import { AllEventsTable } from "./all-events";

export const UpcomingEventsTable = new sst.aws.Dynamo("UpcomingEventsTable", {
  fields: {
    url: "string",
    // dateStart: "string",
  },
  primaryIndex: { hashKey: "url" },
  ttl: "ttl",
  // stream: "new-and-old-images",
  // globalIndexes: {
  //   dateStartIndex: {
  //     hashKey: "dateStart",
  //     // rangeKey: "url",
  //   },
  // },
  transform: {
    table: {
      pointInTimeRecovery: {
        enabled: false,
      },
    },
  },
});

// const RetrieveFromApifyFn = new sst.aws.Function("RetrieveFromApifyFn", {
//   handler: "src/functions/retrieve-from-apify.retrieveFromApify",
//   link: [APIFY_TOKEN],
//   timeout: `${$app.stage === "prod" ? 10 : 60} seconds`,
//   memory: "128 MB",
//   runtime: "nodejs20.x",
// });

// const CleanupUpcomingFunction = new sst.aws.Function("CleanupUpcomingFunction", {
//   handler: "src/functions/upcoming-events.cleanupUpcoming",
//   link: [UpcomingEventsTable],
//   timeout: `${$app.stage === "prod" ? 10 : 60} seconds`,
//   memory: "128 MB",
//   runtime: "nodejs20.x",
// });

// AllEventsTable.subscribe({
//   handler: "src/functions/upcoming-events.updateUpcoming",
//   link: [UpcomingEventsTable],
//   timeout: `${$app.stage === "prod" ? 10 : 60} seconds`,
//   memory: "128 MB",
//   runtime: "nodejs20.x",
// });
