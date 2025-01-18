import { LambdaInvoke, Map, Pass, StateMachine } from "@/lib/sst-sfn";

import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { BSKY_PASSWORD, OPENAI_API_KEY } from "./secrets";

export const PostStatusTable = new sst.aws.Dynamo("PostStatusTable", {
  fields: {
    url: "string",
  },
  primaryIndex: { hashKey: "url" },
});

export const SharpRelease = new pulumi.asset.RemoteArchive("https://github.com/pH200/sharp-layer/releases/download/0.33.5/release-x64.zip");

export const SharpLayer = new aws.lambda.LayerVersion("SharpLayer", {
  // code: new pulumi.asset.FileArchive("../../layers/sharp/release-x64.zip"),
  code: SharpRelease,
  layerName: `${$app.name}-${$app.stage}-SharpLayer`,
  compatibleRuntimes: ["nodejs18.x", "nodejs20.x"],
  compatibleArchitectures: ["x86_64"],
});

// export const sharpLambdaLayerArn = lambdaLayer.arn.apply(arn => {
//   console.log("Layer ARN:", arn);
//   return arn;
// });

// const configLayer = new aws.lambda.LayerVersion("config-layer", {
//   layerName: "my-config-layer",

//   code: new pulumi.asset.AssetArchive({
//     config: new pulumi.asset.FileArchive("./layers/sharp"),
//   }),
// });

// configLayer.arn.apply(arn => {
//   console.log("Layer ARN:", arn);
// });

// lambdaLayer.arn.apply(arn => {
//   console.log("Layer ARN:", arn);
// });

export const RetrieveRelevantEventsFunction = new sst.aws.Function("RetrieveRelevantEventsFunction", {
  handler: "src/functions/post-publisher.retrieveRelevantEvents",
  link: [PostStatusTable, BSKY_PASSWORD, OPENAI_API_KEY],
  environment: {
    OPENSEARCH_URL: process.env.OPENSEARCH_URL!,
    BSKY_HANDLE: process.env.BSKY_HANDLE!,
    POST_PUBLISHER_BATCH_SIZE: process.env.POST_PUBLISHER_BATCH_SIZE!,
    DEBUG: "sharp:*",
  },
  timeout: `${$app.stage === "prod" ? 30 : 60} seconds`,
  memory: "256 MB",
  runtime: "nodejs18.x",
  architecture: "x86_64",
  nodejs: {
    esbuild: {
      external: ["sharp"],
    },
  },
  // layers: ["arn:aws:lambda:us-east-1:913524919104:layer:sharp:7"],
  layers: [SharpLayer.arn],
});

const RetrieveRelevantEventsLambda = new LambdaInvoke("RetrieveRelevantEventsLambda", {
  Parameters: {
    FunctionName: RetrieveRelevantEventsFunction.arn,
    Payload: "$",
  },
  ResultSelector: {
    "result.$": "$.Payload",
  },
  ResultPath: "$.RetrieveRelevantEvents",
  TimeoutSeconds: $app.stage === "prod" ? 30 : 60,
});

const GenerateTweetEventFunction = new sst.aws.Function("GenerateTweetEventFunction", {
  handler: "src/functions/post-publisher.generateTweetEvent",
  link: [PostStatusTable, BSKY_PASSWORD, OPENAI_API_KEY],
  environment: {
    OPENSEARCH_URL: process.env.OPENSEARCH_URL!,
    BSKY_HANDLE: process.env.BSKY_HANDLE!,
    POST_PUBLISHER_BATCH_SIZE: process.env.POST_PUBLISHER_BATCH_SIZE!,
    DEBUG: "sharp:*",
  },
  timeout: `${$app.stage === "prod" ? 30 : 60} seconds`,
  memory: "256 MB",
  runtime: "nodejs18.x",
  architecture: "x86_64",
  nodejs: {
    esbuild: {
      external: ["sharp"],
    },
  },
  layers: [SharpLayer.arn],
});

const GenerateTweetEventLambda = new LambdaInvoke("GenerateTweetEventLambda", {
  Parameters: {
    FunctionName: GenerateTweetEventFunction.arn,
    Payload: "$",
  },
  ResultSelector: {
    "result.$": "$.Payload",
  },
  ResultPath: "$.GenerateTweetEvent",
  TimeoutSeconds: $app.stage === "prod" ? 30 : 60,
});

const PostTweetEventFunction = new sst.aws.Function("PostTweetEventFunction", {
  handler: "src/functions/post-publisher.postTweetEvent",
  link: [PostStatusTable, BSKY_PASSWORD, OPENAI_API_KEY],
  environment: {
    OPENSEARCH_URL: process.env.OPENSEARCH_URL!,
    BSKY_HANDLE: process.env.BSKY_HANDLE!,
    POST_PUBLISHER_BATCH_SIZE: process.env.POST_PUBLISHER_BATCH_SIZE!,
    DEBUG: "sharp:*",
  },
  timeout: `${$app.stage === "prod" ? 30 : 60} seconds`,
  memory: "256 MB",
  runtime: "nodejs18.x",
  architecture: "x86_64",
  nodejs: {
    esbuild: {
      external: ["sharp"],
    },
  },
  layers: [SharpLayer.arn],
});

const PostTweetEventLambda = new LambdaInvoke("PostTweetEventLambda", {
  Parameters: {
    FunctionName: PostTweetEventFunction.arn,
    Payload: {
      "tweetEvent.$": "$.GenerateTweetEvent.result.tweetEvent",
    },
  },
  ResultSelector: {
    "result.$": "$.Payload",
  },
  ResultPath: "$.PostTweetEvent",
  TimeoutSeconds: $app.stage === "prod" ? 30 : 60,
});

PostTweetEventLambda.addRetry({
  ErrorEquals: ["States.ALL"],
  IntervalSeconds: 10,
  MaxAttempts: 4,
  BackoffRate: 10,
  MaxDelaySeconds: 20,
});

const IterateRoutine = GenerateTweetEventLambda.next(PostTweetEventLambda);

const IterateEventsMap = new Map("IterateEventsMap", {
  ItemsPath: "$.RetrieveRelevantEvents.result.events",
  MaxConcurrency: 2,
  Iterator: IterateRoutine,
});

const Finish = new Pass("Finish");

export const PostPublisherStateMachine = new StateMachine("PostPublisherStateMachine", {
  definition: RetrieveRelevantEventsLambda.next(IterateEventsMap).next(Finish),
});

const rule = new aws.cloudwatch.EventRule("PostPublisherRule", {
  name: `${$app.name}-${$app.stage}-PostPublisherRule`,
  scheduleExpression: "cron(0 11-23/3 * * ? *)",
});

const eventRole = new aws.iam.Role("EventBridgeInvokeRole", {
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Action: "sts:AssumeRole",
        Effect: "Allow",
        Sid: "",
        Principal: {
          Service: "events.amazonaws.com",
        },
      },
    ],
  }),
});

const eventRolePolicy = new aws.iam.RolePolicy("EventBridgeInvokeRolePolicy", {
  name: `${pulumi.getStack()}-EventBridgeInvokeRolePolicy`,
  role: eventRole.id,
  policy: pulumi.output(PostPublisherStateMachine.arn).apply(arn =>
    JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Action: ["states:StartExecution"],
          Effect: "Allow",
          Resource: [arn],
        },
      ],
    }),
  ),
});

new aws.cloudwatch.EventTarget("PostPublisherTarget", {
  rule: rule.name,
  arn: PostPublisherStateMachine.arn,
  roleArn: eventRole.arn,
});
