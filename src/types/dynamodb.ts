import { Event } from "./event";

export interface DynamoDBAttributeValue {
  S?: string;
  N?: string;
  SS?: string[];
  BOOL?: boolean;
  L?: DynamoDBAttributeValue[];
}

export interface ItemImage {
  url: DynamoDBAttributeValue;
  dateStart: DynamoDBAttributeValue;
  dateEnd: DynamoDBAttributeValue;
  title: DynamoDBAttributeValue;
  hosts: DynamoDBAttributeValue;
  group: DynamoDBAttributeValue;
  address: DynamoDBAttributeValue;
  guests: DynamoDBAttributeValue;
  attendees: DynamoDBAttributeValue;
  description: DynamoDBAttributeValue;
  cover: DynamoDBAttributeValue;
  tags?: DynamoDBAttributeValue;
  venue?: DynamoDBAttributeValue;
  online?: DynamoDBAttributeValue;
  eventSeriesDates?: DynamoDBAttributeValue;
  price?: DynamoDBAttributeValue;
  minPrice?: DynamoDBAttributeValue;
  maxPrice?: DynamoDBAttributeValue;
  spotsLeft?: DynamoDBAttributeValue;
  waitlist?: DynamoDBAttributeValue;
  registrationClosed?: DynamoDBAttributeValue;
}

export interface DynamoDBStreamRecord {
  ApproximateCreationDateTime: number;
  Keys: {
    url: DynamoDBAttributeValue;
  };
  NewImage: ItemImage;
  OldImage: ItemImage;
  SequenceNumber: string;
  SizeBytes: number;
  StreamViewType: string;
}

export interface Record {
  eventID: string;
  eventName: string; // INSERT, MODIFY, REMOVE
  eventVersion: string;
  eventSource: string;
  awsRegion: string;
  dynamodb: DynamoDBStreamRecord;
  eventSourceARN: string;
}

export interface DynamoDbStreamPayload {
  Records: Record[];
}

export interface ItemChange {
  oldItem: Event;
  newItem: Event;
}
