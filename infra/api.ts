import { DOMAIN } from "./domain";
import { AuthorizerTokensTable } from "./lambda-authorizer";

export const EventsPlannerApi = new sst.aws.ApiGatewayV2("EventsPlannerApi", {
  accessLog: {
    retention: "1 week",
  },
  domain: {
    name: `api.${DOMAIN}`,
  },
});

export const LambdaAuthorizerFn = EventsPlannerApi.addAuthorizer({
  name: "LambdaAuthorizerFn",
  lambda: {
    function: {
      link: [AuthorizerTokensTable],
      handler: "src/functions/lambda-authorizer.authorizeRequest",
      dev: false,
    },
  },
});
