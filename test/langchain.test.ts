import { ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import winston from "winston";
import { Resource } from "sst";
import { it } from "vitest";

const log = winston.createLogger({
  level: "silly",
  format: winston.format.combine(winston.format.simple()),
  transports: [new winston.transports.Console()],
});

it("Try OpenAI API", async () => {
  const messages = [
    SystemMessagePromptTemplate.fromTemplate("This is a test of the OpenAI API."),
    HumanMessagePromptTemplate.fromTemplate(
      `Title: Test Event
Description: This is a description of the test event.
Attendees: 100
Address: Test Address
Guests: ["Guest 1", "Guest 2"]`,
    ),
  ];

  const chatTemplate = ChatPromptTemplate.fromMessages(messages);

  log.debug("Chat template: ", chatTemplate);
  log.debug("Resource ApiKey: ", Resource.OPENAI_API_KEY.value);
  log.debug("ApiKey: ", process.env.OPENAI_API_KEY);

  const model = new ChatOpenAI({
    modelName: process.env.OPENAI_API_MODEL_NAME,
    // openAIApiKey: process.env.OPENAI_API_KEY,
    openAIApiKey: Resource.OPENAI_API_KEY.value,
    // apiKey: Resource.OPENAI_API_KEY.value,
    temperature: 0,
  });

  const chatMessages = await chatTemplate.formatMessages({});
  const result = await model.invoke(chatMessages);
  log.debug("Result: ", result);
});
