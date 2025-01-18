import * as pulumi from "@pulumi/pulumi";
import { AllEventsTable } from "./all-events";
import { UpcomingEventsTable } from "./upcoming-events";

// TODO: create OpenSearch infra

// const IngestSearchSubscriber = AllEventsTable.subscribe({
//   handler: "src/functions/search-index.ingestSearch",
//   link: [UpcomingEventsTable],
//   environment: {
//     ALL_EVENTS_INDEX: process.env.ALL_EVENTS_INDEX!,
//     OPENSEARCH_URL: process.env.OPENSEARCH_URL!,
//   },
//   timeout: `${$app.stage === "prod" ? 10 : 60} seconds`,
//   memory: "128 MB",
//   runtime: "nodejs20.x",
//   transform: {
//     role: (args, opts) => {
//       const newPolicy = {
//         name: "search-index-policy",
//         policy: JSON.stringify({
//           Version: "2012-10-17",
//           Statement: [
//             {
//               Action: "es:*",
//               Effect: "Allow",
//               Resource: "arn:aws:es:us-east-1:913524919104:domain/manual-test/*",
//             },
//           ],
//         }),
//       };
//       args.inlinePolicies = pulumi.output(args.inlinePolicies).apply(policies => [...(policies || []), newPolicy]);
//     },
//   },
// });

// export const IngestSearchSubscriberRoleName = IngestSearchSubscriber.apply(subscriber => {
//   return subscriber.nodes.function.apply(func => {
//     return func.nodes.role.arn;
//   });
// });
