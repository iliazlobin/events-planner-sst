export const AuthorizerTokensTable = new sst.aws.Dynamo("AuthorizerTokensTable", {
  fields: {
    token: "string",
  },
  primaryIndex: { hashKey: "token" },
});
