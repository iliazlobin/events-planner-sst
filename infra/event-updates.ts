// import { AllEventsTable } from "./all-events";
// import { UpcomingEventsTable } from "./upcoming-events";

// export const UpdateEventsQueue = new sst.aws.Queue("UpdateEventsQueue", {
//   visibilityTimeout: "60 seconds",
// });

// // Can subscribe up to 2 functions
// AllEventsTable.subscribe({
//   handler: "src/functions/send-to-update.sendToUpdate",
//   link: [UpdateEventsQueue],
//   timeout: `${$app.stage === "prod" ? 10 : 60} seconds`,
//   memory: "128 MB",
//   runtime: "nodejs20.x",
// });
