import { BskyAgent } from "@atproto/api";
import dotenv from "dotenv";
import winston from "winston";

const log = winston.createLogger({
  level: "silly",
  format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
  transports: [new winston.transports.Console()],
});

dotenv.config({ path: ".env", override: true });

async function main() {
  const bskyHandle = process.env.BSKY_HANDLE!;
  const bskyPassword = process.env.BSKY_PASSWORD!;

  const agent = new BskyAgent({
    service: "https://bsky.social",
  });

  log.debug(`Logging in to Bsky as ${bskyHandle}`);

  await agent.login({
    identifier: bskyHandle,
    password: bskyPassword,
  });

  const timeline = await agent.getTimeline({ limit: 100 });

  for (const post of timeline.data.feed) {
    log.debug(`Deleting post: ${post.post.uri}`);
    await agent.deletePost(post.post.uri);
  }

  const updatedTimeline = await agent.getTimeline({ limit: 100 });
  log.info(`All posts deleted successfully. Remaining posts: ${updatedTimeline.data.feed.length}`);
}

main().catch(error => {
  log.error("Unexpected error:", error);
  process.exit(1);
});
