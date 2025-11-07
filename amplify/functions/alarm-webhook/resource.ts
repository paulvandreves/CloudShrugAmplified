import { defineFunction } from "@aws-amplify/backend";

export const alarmWebhook = defineFunction({
  name: "alarm-webhook",
  entry: "./handler.ts",
});

