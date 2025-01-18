import { LambdaInvoke, Map, Pass, StateMachine, Success } from "@/lib/sst-sfn";

import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { AllEventsTable } from "./all-events";
import { UpcomingEventsTable } from "./upcoming-events";
import { OPENAI_API_KEY } from "./secrets";

// export const EventUpdatesQueue = new sst.aws.Queue("EventUpdatesQueue", {
//   visibilityTimeout: "60 seconds",
// });

// const lambdaLayer = new aws.lambda.LayerVersion("lambda_layer", {
//   code: new pulumi.asset.FileArchive("lambda_layer_payload.zip"),
//   layerName: "lambda_layer_name",
//   compatibleRuntimes: ["nodejs20.x"],
// });

const ExtractFeaturesFunction = new sst.aws.Function("ExtractFeaturesFunction", {
  handler: "src/functions/updates-processor.extractFeatures",
  // handler: "functions/updates_processor.extract_features",
  // handler: "src/functions/updates_processor.extract_features",
  link: [OPENAI_API_KEY],
  environment: {
    OPENAI_API_MODEL_NAME: process.env.OPENAI_API_MODEL_NAME!,
  },
  timeout: `${$app.stage === "prod" ? 10 : 60} seconds`,
  memory: "128 MB",
  runtime: "nodejs20.x",
  // runtime: "python3.10",
  // dev: false,
  // environment: {
  //   PYTHONPATH: "$PYTHONPATH:../:py/",
  // },
  // layers: [],
});

const ExtractFeaturesLambda = new LambdaInvoke("ExtractFeaturesLambda", {
  Parameters: {
    FunctionName: ExtractFeaturesFunction.arn,
    Payload: {
      "event.$": "$",
    },
  },
  ResultSelector: {
    "result.$": "$.Payload",
  },
  ResultPath: "$.ExtractFeatures",
  TimeoutSeconds: $app.stage === "prod" ? 10 : 60,
});

ExtractFeaturesLambda.addRetry({
  // ErrorEquals: ["TooManyRequestsException"],
  IntervalSeconds: 10,
  MaxAttempts: 4,
  BackoffRate: 10,
  MaxDelaySeconds: 20,
});

export const ProcessFeaturesFunction = new sst.aws.Function("ProcessFeaturesFunction", {
  handler: "src/functions/updates-processor.processFeatures",
  link: [],
  environment: {
    OPENSEARCH_URL: process.env.OPENSEARCH_URL!,
    ALL_EVENTS_INDEX: process.env.ALL_EVENTS_INDEX!,
  },
  timeout: `${$app.stage === "prod" ? 10 : 60} seconds`,
  memory: "128 MB",
  runtime: "nodejs20.x",
  transform: {
    role: (args, opts) => {
      const newPolicy = {
        name: "ingest-opensearch-policy",
        policy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Action: "es:*",
              Effect: "Allow",
              Resource: "arn:aws:es:us-east-1:913524919104:domain/manual-test/*",
            },
          ],
        }),
      };
      args.inlinePolicies = pulumi.output(args.inlinePolicies).apply(policies => [...(policies || []), newPolicy]);
    },
  },
});

const ProcessFeaturesLambda = new LambdaInvoke("ProcessFeaturesLambda", {
  Parameters: {
    FunctionName: ProcessFeaturesFunction.arn,
    Payload: {
      "event.$": "$",
      "eventScores.$": "$.ExtractFeatures.result.eventScores",
      "eventHighlights.$": "$.ExtractFeatures.result.eventHighlights",
    },
  },
  ResultSelector: {
    "result.$": "$.Payload",
  },
  ResultPath: "$.ProcessFeatures",
  TimeoutSeconds: $app.stage === "prod" ? 10 : 60,
});

ProcessFeaturesLambda.addRetry({
  // ErrorEquals: ["TooManyRequestsException"],
  IntervalSeconds: 10,
  MaxAttempts: 4,
  BackoffRate: 10,
  MaxDelaySeconds: 20,
});

const Finish = new Pass("Finish");

export const UpdatesProcessorStateMachine = new StateMachine("UpdatesProcessorStateMachine", {
  definition: ExtractFeaturesLambda.next(ProcessFeaturesLambda).next(Finish),
});

const ScheduleForProcessing = AllEventsTable.subscribe("ScheduleForProcessing", {
  handler: "src/functions/updates-processor.startExecution",
  link: [UpdatesProcessorStateMachine],
  // environment: {
  //   ALL_EVENTS_INDEX: process.env.ALL_EVENTS_INDEX!,
  // },
  timeout: `${$app.stage === "prod" ? 10 : 60} seconds`,
  memory: "128 MB",
  runtime: "nodejs20.x",
  // transform: {
  //   role: (args, opts) => {
  //     const newPolicy = {
  //       name: "update-processor-policy",
  //       policy: JSON.stringify({
  //         Version: "2012-10-17",
  //         Statement: [
  //           {
  //             Action: "es:*",
  //             Effect: "Allow",
  //             Resource: "arn:aws:es:us-east-1:913524919104:domain/manual-test/*",
  //           },
  //         ],
  //       }),
  //     };
  //     args.inlinePolicies = pulumi.output(args.inlinePolicies).apply(policies => [...(policies || []), newPolicy]);
  //   },
  // },
});
