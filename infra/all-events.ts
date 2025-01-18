export const AllEventsTable = new sst.aws.Dynamo("AllEventsTable", {
  fields: {
    url: "string",
  },
  primaryIndex: { hashKey: "url" },
  stream: "new-and-old-images",
});
