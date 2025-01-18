import { Context } from "@/types/context";
import { Event, EventHighlights, EventScores, mergeRichEvent } from "@/types/event";
import { Resource } from "sst";
import winston from "winston";
import { z, ZodSchema } from "zod";

import { getEventHighlights, scoreEvent } from "@/services/openai";
import { indexRichEvent as indexEvent, indexRichEvent } from "@/services/opensearch";
import { convertItemImageToItem } from "@/types/convertion";
import { DynamoDbStreamPayload } from "@/types/dynamodb";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";

const log = winston.createLogger({
  level: "debug",
  format: winston.format.combine(winston.format.simple()),
  transports: [new winston.transports.Console()],
});

const sfnClient = new SFNClient();

export async function startExecution2(payload: DynamoDbStreamPayload, context: Context): Promise<any> {
  log.silly("Payload: ", payload);
  log.silly("Context: ", context);

  return {
    status: "success",
  };
}

export async function startExecution(payload: DynamoDbStreamPayload, context: Context): Promise<any> {
  log.silly("Payload: ", payload);
  log.silly("Context: ", context);

  const newEvents: Event[] = payload.Records.map(record => {
    if (record.eventName === "REMOVE") {
      return undefined;
    }

    // convert old and new images to Item
    const oldEvent: Event | undefined = record.dynamodb.OldImage ? convertItemImageToItem(record.dynamodb.OldImage) : undefined;
    const newEvent: Event | undefined = record.dynamodb.NewImage ? convertItemImageToItem(record.dynamodb.NewImage) : undefined;

    // skip item deletion
    if (!newEvent) {
      return undefined;
    }

    log.debug(`New event: ${newEvent.url}, Old event: ${oldEvent?.url}`);
    return newEvent;
  }).filter(event => event !== undefined);

  log.info(`Number of events to be updated: ${newEvents.length}`);

  const executionArns: string[] = [];
  for (const event of newEvents) {
    const command = new StartExecutionCommand({
      stateMachineArn: Resource.UpdatesProcessorStateMachine.arn,
      input: JSON.stringify(event),
    });
    const { executionArn } = await sfnClient.send(command);
    if (!executionArn) {
      log.error(`Failed to start execution for event: ${JSON.stringify(event)}`);
      continue;
    }
    executionArns.push(executionArn);
  }

  return {
    status: "success",
    executionArns: executionArns,
  };
}

type ScoringFeatures = {
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

const ScoringFeaturesZod: ZodSchema<ScoringFeatures> = z.object({
  non_commercial: z.number().describe("non_commercial (0 - very commercial, 1 - not commercial at all)"),
  popularity: z.number().describe("popularity (0 - very unpopular, 1 - very popular)"),
  free_admision: z.number().describe("free_admision (0 - very expensive, 1 - completely free)"),
  no_additional_expenses: z.number().describe("no_additional_expenses (0 - lots of additional expenses, 1 - no additional expenses)"),
  drinks_provided: z.number().describe("drinks_provided (0 - no drinks provided, 1 - lots of drinks provided)"),
  food_provided: z.number().describe("food_provided (0 - no food provided, 1 - lots of food provided)"),
  venue_niceness: z.number().describe("venue_niceness (0 - very poor venue, 1 - very nice venue)"),
  quietness: z.number().describe("quietness (0 - very loud, 1 - very quiet)"),
  uniqueness: z.number().describe("uniqueness (0 - not unique, 1 - very unique)"),
  proximity: z.number().describe("proximity (0 - very far, 1 - very close)"),
});

type Input = {
  title: string;
  description: string;
  attendees: number;
  address: string;
  guests: string[];
};

type Output = {
  rationale: string;
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

type Demo = Input & Output;

type ExtractFeaturesPayload = {
  event: Event;
};

export async function extractFeatures(payload: ExtractFeaturesPayload, context: Context): Promise<any> {
  log.silly("Payload: ", payload);
  log.silly("Context: ", context);

  const eventScores = await scoreEvent(payload.event);
  const eventHighlights = await getEventHighlights({ event: payload.event });

  return {
    status: "success",
    eventScores,
    eventHighlights,
  };
}

type ProcessFeaturesPayload = {
  event: Event;
  eventScores: EventScores;
  eventHighlights: EventHighlights;
};

export async function processFeatures(payload: ProcessFeaturesPayload, context: Context): Promise<any> {
  log.silly("Payload: ", payload);
  log.silly("Context: ", context);

  log.debug(`Updating search index the rich event (${payload.event.url}) ${payload.event.title}`);
  const event = mergeRichEvent(payload.event, payload.eventScores, payload.eventHighlights);
  await indexRichEvent(event);

  return {
    status: "success",
  };
}

// export async function sendToEventUpdates(payload: DynamoDbStreamPayload, context: Context): Promise<any> {
//   log.silly("Payload: ", payload);
//   log.silly("Context: ", context);

//   const newItems: Event[] = payload.Records.map(record => {
//     // convert old and new images to Item
//     const oldItem: Event | undefined = record.dynamodb.OldImage ? convertItemImageToItem(record.dynamodb.OldImage) : undefined;
//     const newItem: Event | undefined = record.dynamodb.NewImage ? convertItemImageToItem(record.dynamodb.NewImage) : undefined;

//     // skip item deletion
//     if (record.eventName === "REMOVE" || !newItem) {
//       return undefined;
//     }

//     // Don't need this logic as stream doesn't send MODIFY events with the same items
//     // if (oldItem && newItem) {
//     //   const fields = ["url", "dateStart", "dateEnd", "title", "hosts", "group", "address", "guests", "attendees", "description", "cover"];
//     //   const isDifferent = fields.some(field => (oldItem as any)[field] !== (newItem as any)[field]);

//     //   if (!isDifferent) {
//     //     return undefined;
//     //   }
//     // }

//     log.debug(`New item: ${JSON.stringify(newItem)}, Old item: ${JSON.stringify(oldItem)}`);
//     return newItem;
//   }).filter(item => item !== undefined);

//   log.info(`Number of items to be updated: ${newItems.length}`);

//   for (const item of newItems) {
//     enqueueEventUpdates(item);
//   }

//   return {
//     status: "success",
//   };
// }
