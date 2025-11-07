import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { FunctionUrlAuthType, HttpMethod } from 'aws-cdk-lib/aws-lambda';
import { auth } from './auth/resource.js';
import { data } from './data/resource.js';
import { alarmWebhook } from './functions/alarm-webhook/resource.js';

const backend = defineBackend({
  auth,
  data,
  alarmWebhook,
});

// Grant the webhook function access to DynamoDB tables
// The function will use the Amplify Data API, so we grant access to all tables with wildcard
backend.alarmWebhook.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      'dynamodb:Query',
      'dynamodb:GetItem',
      'dynamodb:PutItem',
      'dynamodb:UpdateItem',
      'dynamodb:Scan'
    ],
    resources: ['*'], //TODO:  In production, scope this to specific table ARNs
  })
);

// Add function URL for public webhook access
const fnUrl = backend.alarmWebhook.resources.lambda.addFunctionUrl({
  authType: FunctionUrlAuthType.NONE,
  cors: {
    allowedOrigins: ['*'],
    allowedMethods: [HttpMethod.POST, HttpMethod.GET],
    allowedHeaders: ['*'],
  },
});

// Output the function URL
backend.addOutput({
  custom: {
    webhookUrl: fnUrl.url,
  },
});
