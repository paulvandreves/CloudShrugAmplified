import type { APIGatewayProxyHandler } from "aws-lambda";

interface CloudWatchAlarmMessage {
  AlarmName: string;
  AlarmDescription?: string;
  NewStateValue: string;
  NewStateReason: string;
  StateChangeTime: string;
  Region: string;
  AlarmArn: string;
  Trigger?: {
    MetricName?: string;
    Namespace?: string;
    Dimensions?: Array<{ name: string; value: string }>;
  };
}

interface SNSMessage {
  Type: string;
  MessageId: string;
  TopicArn?: string;
  Message: string;
  Timestamp: string;
  SubscribeURL?: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log("Received webhook event:", JSON.stringify(event, null, 2));

  try {
    // Parse SNS message from body
    const snsMessage: SNSMessage = JSON.parse(event.body || "{}");

    // Handle SNS subscription confirmation
    if (snsMessage.Type === "SubscriptionConfirmation" && snsMessage.SubscribeURL) {
      console.log("SNS Subscription confirmation received");
      
      // Auto-confirm the subscription
      const response = await fetch(snsMessage.SubscribeURL);
      console.log("Subscription confirmed:", response.status);
      
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: "Subscription confirmed" }),
      };
    }

    // Handle SNS notification
    if (snsMessage.Type === "Notification") {
      // For now, we'll accept any alarm and log it
      // In a production setup, you would validate the API key against your organization table
      const apiKey = 
        event.queryStringParameters?.apiKey || 
        event.headers?.["x-api-key"] || 
        event.headers?.["X-Api-Key"];

      console.log("API Key received:", apiKey);
      
      // TODO: Implement proper API key validation using Amplify Data API
      // For now, just extract the organizationId from the API key
      // In production, query the Organization table to validate

      // Parse CloudWatch alarm from SNS message
      const alarmMessage: CloudWatchAlarmMessage = JSON.parse(snsMessage.Message);

      // Extract account ID from ARN (format: arn:aws:cloudwatch:region:account-id:alarm:alarm-name)
      const accountId = alarmMessage.AlarmArn?.split(":")[4] || "";

      // Log the alarm for now
      // TODO: Store in DynamoDB using Amplify Data API or AWS SDK
      console.log("CloudWatch Alarm Received:", {
        alarmName: alarmMessage.AlarmName,
        state: alarmMessage.NewStateValue,
        reason: alarmMessage.NewStateReason,
        timestamp: alarmMessage.StateChangeTime,
        region: alarmMessage.Region,
        accountId: accountId,
        namespace: alarmMessage.Trigger?.Namespace,
        metricName: alarmMessage.Trigger?.MetricName,
      });

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Alarm received and logged",
          alarmName: alarmMessage.AlarmName,
        }),
      };
    }

    // Unknown SNS message type
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Unknown message type" }),
    };
  } catch (error) {
    console.error("Error processing webhook:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};

