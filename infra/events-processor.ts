import { LambdaInvoke, Map, Pass, StateMachine, Success } from "@/lib/sst-sfn";
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { AllEventsTable } from "./all-events";
import { EventsPlannerApi, LambdaAuthorizerFn } from "./api";
import { APIFY_TOKEN } from "./secrets";

const RetrieveFromApifyFunction = new sst.aws.Function("RetrieveFromApifyFunction", {
  handler: "src/functions/events-processor.retrieveFromApify",
  link: [APIFY_TOKEN],
  timeout: `${$app.stage === "prod" ? 10 : 60} seconds`,
  memory: "128 MB",
  runtime: "nodejs20.x",
});

const RetrieveFromApifyLambda = new LambdaInvoke("RetrieveFromApifyLambda", {
  Parameters: {
    FunctionName: RetrieveFromApifyFunction.arn,
    Payload: "$",
  },
  ResultSelector: {
    "result.$": "$.Payload",
  },
  ResultPath: "$.RetrieveFromApify",
  TimeoutSeconds: $app.stage === "prod" ? 10 : 60,
});

// const SendToQueueFn = new sst.aws.Function("SendToQueue", {
//   handler: "src/functions/send-to-queue.sendToQueue",
//   link: [APIFY_TOKEN, EventsIngestionQueue],
//   timeout: `${$app.stage === "prod" ? 10 : 60} seconds`,
//   memory: "128 MB",
//   runtime: "nodejs20.x",
// });

// const SendToQueueInvoke = new LambdaInvoke("SendToQueue", {
//   Parameters: {
//     FunctionName: SendToQueueFn.arn,
//     Payload: {
//       "item.$": "$",
//     },
//   },
//   ResultSelector: {
//     "result.$": "$.Payload",
//   },
//   ResultPath: "$.RetrieveFromApify",
//   TimeoutSeconds: $app.stage === "prod" ? 10 : 60,
// });

const SaveToAllFunction = new sst.aws.Function("SaveToAllFunction", {
  handler: "src/functions/all-events.saveToAll",
  link: [APIFY_TOKEN, AllEventsTable],
  timeout: `${$app.stage === "prod" ? 10 : 60} seconds`,
  memory: "128 MB",
  runtime: "nodejs20.x",
});

const SaveToAllLambda = new LambdaInvoke("SaveToAllLambda", {
  Parameters: {
    FunctionName: SaveToAllFunction.arn,
    Payload: "$",
  },
  ResultSelector: {
    "result.$": "$.Payload",
  },
  ResultPath: "$.RetrieveFromApify",
  TimeoutSeconds: $app.stage === "prod" ? 10 : 60,
});

// const Delay = new Pass("Delay", {
//   Result: {
//     "waitSeconds": 1 + Math.floor(Math.random() * 5) // Adding jitter
//   },
//   ResultPath: "$.delay",
// });

SaveToAllLambda.addRetry({
  // ErrorEquals: ["TooManyRequestsException"],
  IntervalSeconds: 10,
  MaxAttempts: 4,
  BackoffRate: 10,
  MaxDelaySeconds: 20,
});

const IterateSuccess = new Success("IterateSuccess");
const IterateRoutine = SaveToAllLambda.next(IterateSuccess);

const IterateEventsMap = new Map("IterateEventsMap", {
  ItemsPath: "$.RetrieveFromApify.result.events",
  MaxConcurrency: 1,
  Iterator: IterateRoutine,
});

const Finish = new Pass("Finish");

export const EventsProcessorStateMachine = new StateMachine("EventsProcessorStateMachine", {
  definition: RetrieveFromApifyLambda.next(IterateEventsMap).next(Finish),
});

export const StartExecutionRole = new aws.iam.Role("StartExecutionRole", {
  name: `${$app.name}-${$app.stage}-StartExecutionRole`,
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Action: "sts:AssumeRole",
        Effect: "Allow",
        Sid: "",
        Principal: {
          Service: "apigateway.amazonaws.com",
        },
      },
    ],
  }),
});

export const StartExecutionRolePolicy = new aws.iam.RolePolicy("StartExecutionRolePolicy", {
  name: `${pulumi.getStack()}-StartExecutionRolePolicy`,
  role: StartExecutionRole.id,
  policy: pulumi.output(EventsProcessorStateMachine.arn).apply(arn =>
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

EventsPlannerApi.route("POST /event/ingest", "src/functions/_template.handler", {
  auth: {
    lambda: LambdaAuthorizerFn.id,
  },
  transform: {
    integration: {
      apiId: EventsPlannerApi.nodes.api.id,
      description: "Send event to EventsProcessor",
      integrationType: "AWS_PROXY",
      integrationSubtype: "StepFunctions-StartExecution",
      payloadFormatVersion: "1.0",
      integrationUri: undefined, // has to be undefined for AWS_PROXY
      credentialsArn: StartExecutionRole.arn,
      timeoutMilliseconds: 5000,
      requestParameters: {
        StateMachineArn: EventsProcessorStateMachine.arn,
        Input: "$request.body",
      },
    },
  },
});
