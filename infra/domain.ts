// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path=".sst/platform/config.d.ts" />

export const DOMAIN_PREFIX = `eventsplanner${$app?.stage && $app.stage !== "production" && $app.stage !== "prod" ? `-${$app.stage}` : ""}`;
export const DOMAIN = `${DOMAIN_PREFIX}.iliazlobin.com`;
// export const URL_BASE = `${$app.stage === "production" || $app.stage === "prod" ? "https" : "http"}://${DOMAIN}`;
