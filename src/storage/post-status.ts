import { DeleteItemCommand, DynamoDBClient, GetItemCommand, PutItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { Resource } from "sst";
import winston from "winston";

const log = winston.createLogger({
  level: "debug",
  format: winston.format.combine(winston.format.simple()),
  transports: [new winston.transports.Console()],
});

const client = new DynamoDBClient({});
const table = Resource.PostStatusTable.name;

export type PostStatus = {
  url: string;
  dateStart: string;
  dateEnd: string;
  blueSkyPostedDate?: string | null;
  twitterPostedDate?: string | null;
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

export async function getPostStatus(url: string): Promise<PostStatus | undefined> {
  const command = new GetItemCommand({
    TableName: table,
    Key: {
      url: { S: url },
    },
  });

  const response = await client.send(command);
  if (response.$metadata.httpStatusCode !== 200) {
    throw new Error(`Bad status code`);
  }

  const item = response.Item;
  if (!item) {
    return undefined;
  }

  return {
    url: item.url?.S || "",
    dateStart: item.dateStart?.S || "",
    dateEnd: item.dateEnd?.S || "",
    blueSkyPostedDate: item.blueSkyPostedDate?.S,
    twitterPostedDate: item.twitterPostedDate?.S,
    non_commercial: item.non_commercial?.N ? parseFloat(item.non_commercial.N) : 0,
    popularity: item.popularity?.N ? parseFloat(item.popularity.N) : 0,
    free_admision: item.free_admision?.N ? parseFloat(item.free_admision.N) : 0,
    no_additional_expenses: item.no_additional_expenses?.N ? parseFloat(item.no_additional_expenses.N) : 0,
    drinks_provided: item.drinks_provided?.N ? parseFloat(item.drinks_provided.N) : 0,
    food_provided: item.food_provided?.N ? parseFloat(item.food_provided.N) : 0,
    venue_niceness: item.venue_niceness?.N ? parseFloat(item.venue_niceness.N) : 0,
    quietness: item.quietness?.N ? parseFloat(item.quietness.N) : 0,
    uniqueness: item.uniqueness?.N ? parseFloat(item.uniqueness.N) : 0,
    proximity: item.proximity?.N ? parseFloat(item.proximity.N) : 0,
  };
}

export async function savePostStatus(postStatus: PostStatus): Promise<void> {
  const item: Record<string, any> = {
    url: { S: postStatus.url },
    dateStart: { S: postStatus.dateStart },
    dateEnd: { S: postStatus.dateEnd },
    blueSkyPostedDate: postStatus.blueSkyPostedDate ? { S: postStatus.blueSkyPostedDate } : null,
    twitterPostedDate: postStatus.twitterPostedDate ? { S: postStatus.twitterPostedDate } : null,
    non_commercial: { N: postStatus.non_commercial.toString() },
    popularity: { N: postStatus.popularity.toString() },
    free_admision: { N: postStatus.free_admision.toString() },
    no_additional_expenses: { N: postStatus.no_additional_expenses.toString() },
    drinks_provided: { N: postStatus.drinks_provided.toString() },
    food_provided: { N: postStatus.food_provided.toString() },
    venue_niceness: { N: postStatus.venue_niceness.toString() },
    quietness: { N: postStatus.quietness.toString() },
    uniqueness: { N: postStatus.uniqueness.toString() },
    proximity: { N: postStatus.proximity.toString() },
  };

  const input = {
    TableName: table,
    Item: item,
  };

  const command = new PutItemCommand(input);
  await client.send(command);
  log.debug(`Saved post status for ${postStatus.url}`);
}

export async function deletePostStatus(url: string): Promise<void> {
  const command = new DeleteItemCommand({
    TableName: table,
    Key: {
      url: { S: url },
    },
  });

  await client.send(command);
  log.debug(`Deleted post status for ${url}`);
}

export async function deleteAllPostStatuses(): Promise<void> {
  const scanCommand = new ScanCommand({ TableName: table });
  const response = await client.send(scanCommand);
  if (response.$metadata.httpStatusCode !== 200) {
    throw new Error(`Bad status code`);
  }

  const items = response.Items || [];
  for (const item of items) {
    const url = item.url.S;
    if (url) {
      await deletePostStatus(url);
    }
  }
}
