import { Event, EventHighlights, EventScores } from "@/types/event";
import { ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";
import { JsonOutputFunctionsParser } from "langchain/output_parsers";
import { Resource } from "sst";
import winston from "winston";
import { z, ZodSchema } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import optimizedExtractorJson from "./optimized_extractor.json";

const log = winston.createLogger({
  level: "debug",
  format: winston.format.combine(
    winston.format.simple(),
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(({ level, message, timestamp }) => {
      return `${timestamp} [${level}] ${message}`;
    }),
  ),
  transports: [new winston.transports.Console()],
});

const ScoringFeaturesZod: ZodSchema<EventScores> = z.object({
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

export async function scoreEvent(event: Event): Promise<EventScores> {
  const demos: Demo[] = optimizedExtractorJson.self.demos;

  const messages = [];

  messages.push(SystemMessagePromptTemplate.fromTemplate(optimizedExtractorJson.self.extended_signature.instructions));

  for (const demo of demos) {
    messages.push(
      HumanMessagePromptTemplate.fromTemplate(
        `Title: ${demo.title}
Description: ${demo.description}
Attendees: ${demo.attendees}
Address: ${demo.address}
Guests: ${demo.guests.join(", ")}`,
      ),
    );
    messages.push(
      HumanMessagePromptTemplate.fromTemplate(
        `Rationale: ${demo.rationale}
Non Commercial: ${demo.non_commercial}
Popularity: ${demo.popularity}
Free Admision: ${demo.free_admision}
No Additional Expenses: ${demo.no_additional_expenses}
Drinks Provided: ${demo.drinks_provided}
Food Provided: ${demo.food_provided}
Venue Niceness: ${demo.venue_niceness}
Quietness: ${demo.quietness}
Uniqueness: ${demo.uniqueness}
Proximity: ${demo.proximity}`,
      ),
    );
  }

  messages.push(
    HumanMessagePromptTemplate.fromTemplate(
      `Title: {title}
Description: {description}
Attendees: {attendees}
Address: {address}
Guests: {guests}`,
    ),
  );

  const chatTemplate = ChatPromptTemplate.fromMessages(messages);

  log.debug("Chat template for scoring event: ", chatTemplate);

  const model = new ChatOpenAI({
    modelName: process.env.OPENAI_API_MODEL_NAME,
    openAIApiKey: Resource.OPENAI_API_KEY.value,
    temperature: 0,
  });

  const parser = new JsonOutputFunctionsParser<EventScores>();

  const chain = RunnableSequence.from([
    chatTemplate,
    model.bind({
      functions: [
        {
          name: "output_formatter",
          description: "Should always be used to properly format output",
          parameters: zodToJsonSchema(ScoringFeaturesZod),
        },
      ],
      function_call: { name: "output_formatter" },
    }),
    parser,
  ]);

  const result = await chain.invoke({
    title: event.title,
    description: event.description,
    attendees: event.attendees,
    address: event.address,
    guests: event.guests,
  });
  log.debug("Scoring result: ", result);

  const scoringFeatures: EventScores = ScoringFeaturesZod.parse(result);

  return scoringFeatures;
}

export async function generateTweet(event: Event, size: number = 200): Promise<string> {
  const messages = [
    SystemMessagePromptTemplate.fromTemplate(
      `Generate a clear and concise tweet based on the following event information. The tweet should be fewer than ${size} characters. Don't specify date, attendees, address. Don't include any hashtags (#) or emojis.`,
    ),
    HumanMessagePromptTemplate.fromTemplate(
      `Title: {title}
Description: {description}
Date Start: {dateStart}
Date End: {dateEnd}
Address: {address}
Venue: {venue}
Attendees: {attendees}
Price: {price}`,
    ),
  ];

  const chatTemplate = ChatPromptTemplate.fromMessages(messages);

  log.debug("Chat template for tweet generation: ", chatTemplate);

  const model = new ChatOpenAI({
    modelName: process.env.OPENAI_API_MODEL_NAME,
    openAIApiKey: Resource.OPENAI_API_KEY.value,
    temperature: 0.7,
  });

  const chain = RunnableSequence.from([chatTemplate, model]);

  const result = await chain.invoke({
    title: event.title,
    description: event.description,
    dateStart: event.dateStart,
    dateEnd: event.dateEnd,
    address: event.address,
    venue: event.venue,
    attendees: event.attendees,
    price: event.price,
  });
  log.debug("Generated tweet: ", result);

  const tweetOutput = result.content;
  return tweetOutput.toString();
}

const EventHighlightsZod: ZodSchema<EventHighlights> = z.object({
  shortDescription: z.string().describe("A short description in one sentence."),
  longDescription: z.string().describe("A long description in one paragraph (around 5 sentences)."),
  tags: z.array(z.string()).describe("A list of appropriate tags for the event."),
  tweet: z.string().describe("A tweet about the event."),
});

export async function getEventHighlights({ event, tweetSize = 200 }: { event: Event; tweetSize?: number }): Promise<EventHighlights> {
  const messages = [
    SystemMessagePromptTemplate.fromTemplate(
      `Generate a structured event summary based on the provided details:
* [short description]: A concise one-sentence summary that captures the essence of the event.
* [long description]: A detailed paragraph (approximately five sentences) that describes the event’s purpose, format, and key highlights.
* [tags]: A selection of 3-5 relevant tags that categorize the event.
* [tweet]: A tweet-sized promotional message (under ${tweetSize} characters) that introduces the event in a compelling yet neutral tone, without hashtags or emojis.`,
    ),
    HumanMessagePromptTemplate.fromTemplate(
      `Title: {title}
Description: {description}
Address: {address}
Venue: {venue}`,
    ),
  ];

  const chatTemplate = ChatPromptTemplate.fromMessages(messages);

  log.debug("Chat template for event highlights: ", chatTemplate);

  const model = new ChatOpenAI({
    modelName: process.env.OPENAI_API_MODEL_NAME,
    openAIApiKey: Resource.OPENAI_API_KEY.value,
    temperature: 0.7,
  });

  const parser = new JsonOutputFunctionsParser<EventHighlights>();

  const chain = RunnableSequence.from([
    chatTemplate,
    model.bind({
      functions: [
        {
          name: "output_formatter",
          description: "Should always be used to properly format output",
          parameters: zodToJsonSchema(EventHighlightsZod),
        },
      ],
      function_call: { name: "output_formatter" },
    }),
    parser,
  ]);

  const result = await chain.invoke({
    title: event.title,
    description: event.description,
    address: event.address,
    venue: event.venue,
  });
  log.debug("Generated event descriptions: ", result);

  const descriptions: EventHighlights = EventHighlightsZod.parse(result);

  return descriptions;
}
