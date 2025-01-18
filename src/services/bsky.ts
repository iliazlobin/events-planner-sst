import { BskyAgent, RichText } from "@atproto/api";
import axios from "axios";
import sharp from "sharp";
import { Resource } from "sst";
import winston from "winston";

const log = winston.createLogger({
  level: "silly",
  format: winston.format.combine(winston.format.simple()),
  transports: [new winston.transports.Console()],
});

export type BskyTweet = {
  title: string;
  description: string;
  url: string;
  image?: string;
  address?: string;
  dateStart?: Date;
  dateEnd?: Date;
  attendees?: number;
};

export async function sendTweetToBsky(tweet: BskyTweet): Promise<void> {
  const agent = new BskyAgent({
    service: "https://bsky.social",
  });

  log.debug(`Logging in to Bsky as ${process.env.BSKY_HANDLE}`);

  await agent.login({
    identifier: process.env.BSKY_HANDLE!,
    password: Resource.BSKY_PASSWORD.value,
  });

  const maxTweetLength = 300;
  const urlLength = tweet.url.length;
  const address = tweet.address
    ? tweet.address
        .replace(/New York, New York/gi, "")
        .replace(/New York/gi, "")
        .replace(/NY/gi, "")
        .replace(/,/gi, "")
        .trim()
    : "";
  const addressLength = address ? address.length + 3 : 0; // 3 for "📍 "
  const dateStartLength = tweet.dateStart ? 25 : 0; // Approximate length for formatted date
  const attendeesLength = tweet.attendees ? tweet.attendees.toString().length + 12 : 0; // 12 for "👥 # attendees"
  const reservedLength = urlLength + addressLength + dateStartLength + attendeesLength + 10; // 10 for new lines and spaces

  const availableLength = maxTweetLength - reservedLength;

  const description = tweet.description.length > availableLength ? tweet.description.slice(0, availableLength - 3) + "..." : tweet.description;

  const formatDate = (date: Date): string => {
    return date.toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" });
  };

  let text = `${description}`;
  if (address) {
    text += `\n📍 ${address}`;
  }
  if (tweet.dateStart) text += `\n📅 ${formatDate(tweet.dateStart)}`;
  if (tweet.attendees && tweet.attendees > 0) text += `\n👥 ${tweet.attendees} attendees`;
  text += `\n${tweet.url}`;

  const rt = new RichText({ text });
  await rt.detectFacets(agent);

  log.silly(`RichText: ${rt.text}`);
  log.debug(`RichText Length: ${rt.text.length}, facets: ${rt.facets?.length}`);

  let postRecord;
  if (tweet.image) {
    const response = await axios.get(tweet.image, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data, "binary");

    let image;
    if (buffer.length > 900 * 1024) {
      const compressed = await sharp(buffer).resize({ width: 720 }).jpeg({ quality: 90 }).toBuffer();
      image = `data:image/jpeg;base64,${compressed.toString("base64")}`;
    } else {
      image = `data:image/jpeg;base64,${buffer.toString("base64")}`;
    }

    const { data } = await agent.uploadBlob(convertDataURIToUint8Array(image), {
      encoding: "image/jpeg",
    });

    postRecord = {
      $type: "app.bsky.feed.post",
      text: rt.text,
      facets: rt.facets,
      embed: {
        $type: "app.bsky.embed.images",
        images: [
          {
            alt: "Placeholder image",
            image: data.blob,
            aspectRatio: {
              width: 1000,
              height: 500,
            },
          },
        ],
      },
    };
  } else {
    postRecord = {
      $type: "app.bsky.feed.post",
      text: rt.text,
      facets: rt.facets,
    };
  }

  log.debug(`Sending post to Bsky ${tweet.title}, ${tweet.url}`);

  const response = await agent.post(postRecord);

  log.info(`Post sent to Bsky: ${response.uri}`);
}

const convertDataURIToUint8Array = (dataURI: string): Uint8Array => {
  const byteString = atob(dataURI.split(",")[1]);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);
  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }
  return uint8Array;
};

async function convertImageToBase64(url: string): Promise<string> {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  const buffer = Buffer.from(response.data, "binary");
  return `data:image/jpeg;base64,${buffer.toString("base64")}`;
}
