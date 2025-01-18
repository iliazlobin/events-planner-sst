// Payload example: https://docs.apify.com/platform/integrations/webhooks/actions
export interface ApifyPayload {
  eventData: {
    actorId: string;
    actorRunId: string;
  };
  resource: {
    actId: string;
    defaultDatasetId: string;
    exitCode: number;
  };
  url: string;
  title: string;
  text: string;
  date: string;
}
