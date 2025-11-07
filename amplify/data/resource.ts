import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/**
 * CloudWatch Alarm Documentation SaaS Schema
 * 
 * This schema defines three main models:
 * - Organization: Represents a team/company with a unique webhook URL
 * - Alarm: CloudWatch alarm data ingested via webhook
 * - Investigation: Records of users investigating alarms with notes and status
 */

const schema = a.schema({
  Organization: a
    .model({
      name: a.string().required(),
      webhookApiKey: a.string().required(),
      createdAt: a.datetime(),
      // Relationships
      alarms: a.hasMany("Alarm", "organizationId"),
      members: a.hasMany("OrganizationMember", "organizationId"),
    })
    .secondaryIndexes((index) => [
      index("webhookApiKey"),
    ])
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(["read"]),
    ]),

  OrganizationMember: a
    .model({
      organizationId: a.id().required(),
      organization: a.belongsTo("Organization", "organizationId"),
      userId: a.string().required(),
      userEmail: a.string(),
      role: a.string(), // 'owner' or 'member'
      joinedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(["read"]),
    ]),

  Alarm: a
    .model({
      organizationId: a.id().required(),
      organization: a.belongsTo("Organization", "organizationId"),
      
      // CloudWatch Alarm Data
      alarmName: a.string().required(),
      alarmDescription: a.string(),
      state: a.string().required(), // 'ALARM', 'OK', 'INSUFFICIENT_DATA'
      stateReason: a.string(),
      timestamp: a.datetime().required(),
      region: a.string(),
      accountId: a.string(),
      namespace: a.string(),
      metricName: a.string(),
      
      // Investigation tracking
      investigationStatus: a.string(), // 'PENDING', 'INVESTIGATING', 'RESOLVED'
      rawPayload: a.json(),
      
      // Relationships
      investigations: a.hasMany("Investigation", "alarmId"),
    })
    .authorization((allow) => [
      allow.authenticated().to(["read", "create"]),
      allow.publicApiKey().to(["create"]), // For webhook ingestion
    ]),

  Investigation: a
    .model({
      alarmId: a.id().required(),
      alarm: a.belongsTo("Alarm", "alarmId"),
      userId: a.string().required(),
      userEmail: a.string(),
      status: a.string().required(), // 'PENDING', 'INVESTIGATING', 'RESOLVED'
      notes: a.string(),
      timestamp: a.datetime().required(),
    })
    .authorization((allow) => [
      allow.authenticated().to(["read", "create"]),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    apiKeyAuthorizationMode: {
      expiresInDays: 365,
    },
  },
});
