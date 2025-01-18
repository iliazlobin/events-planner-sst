// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path=".sst/platform/config.d.ts" />

import * as pulumi from "@pulumi/pulumi";
// import * as awsnative from "@pulumi/aws-native";

export default $config({
  app(input: any) {
    return {
      // name: "EventsPlanner", // EventsPlannerSst
      name: "EventsPlanner",
      // removal: input?.stage === "production" || input?.stage === "prod" ? "retain" : "remove",
      // removal: "remove", // uncomment to remove production
      protect: ["production", "prod"].includes(input?.stage),
      home: "aws",
      providers: { "aws-native": "1.25.0" },
    };
  },
  async run() {
    const stacks = await import("./infra");

    return {
      // EventsPlannerApi: stacks.EventsPlannerApi,
      EventsPlannerApiId: stacks.EventsPlannerApi.nodes.api.id,
      EventsPlannerApiUrl: stacks.EventsPlannerApi.url,
      RetrieveRelevantEventsFunctionArn: stacks.RetrieveRelevantEventsFunction.arn,
      SharpLayerArn: stacks.SharpLayer.arn,
      SharpReleaseX64Uri: stacks.SharpRelease.uri,
    };
  },
});
