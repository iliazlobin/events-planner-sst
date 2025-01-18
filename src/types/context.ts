export interface Context {
  awsRequestId: string;
  invokedFunctionArn: string;
  identity?: any;
  clientContext?: any;
  functionName: string;
  functionVersion: string;
  memoryLimitInMB?: number;
  logGroupName: string;
  logStreamName: string;
  callbackWaitsForEmptyEventLoop: boolean;
}
