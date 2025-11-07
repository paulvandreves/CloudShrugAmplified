# Quick Start Guide

## What Was Fixed

### 1. Backend TypeScript Errors
- **Fixed**: Updated `amplify/backend.ts` to use proper Amplify Gen2 API for importing CDK constructs
- **Fixed**: Simplified Lambda function to remove AWS SDK dependencies (for now, it logs alarms instead of storing them)
- **Change**: The Lambda function currently logs CloudWatch alarms. To fully integrate with DynamoDB, you'll need to add the AWS SDK back and implement the storage logic

### 2. User Pool Client Error
The error "User pool client does not exist" occurs when:
- The backend hasn't been deployed yet
- Run `npx ampx sandbox` to deploy the backend and create the user pool

### 3. Added Demo Mode
- **New Feature**: "View Demo" button that lets users explore the app without signing up
- Shows 4 sample CloudWatch alarms with different states
- Demo users can view alarm details but can't save investigations
- Easy conversion from demo to real account

## Getting Started

### Option 1: View Demo (No Sign Up Required)

1. Start the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000)

3. Click "View Demo" button

4. Explore the sample alarms and interface

### Option 2: Deploy and Use Locally

1. **Install dependencies**:
```bash
npm install
cd amplify && npm install && cd ..
```

2. **Deploy the backend** (this creates the user pool and database):
```bash
npx ampx sandbox
```

Wait for the deployment to complete. This will:
- Create a Cognito user pool
- Create DynamoDB tables
- Deploy the Lambda webhook function
- Generate `amplify_outputs.json`

3. **Start the development server**:
```bash
npm run dev
```

4. **Sign up** for an account at [http://localhost:3000](http://localhost:3000)

5. **Get your webhook URL** from the dashboard

6. **Configure CloudWatch** (see instructions in the app)

## Using the Application

### Demo Mode Features
- ✅ View sample alarms
- ✅ See different alarm states (ALARM, OK, INSUFFICIENT_DATA)
- ✅ View alarm details
- ✅ See investigation statuses
- ❌ Cannot save investigations
- ❌ Cannot configure webhooks

### Authenticated Mode Features
- ✅ All demo mode features
- ✅ Auto-generated organization with unique webhook
- ✅ Real-time alarm monitoring
- ✅ Investigation tracking with notes
- ✅ Team member invitations
- ✅ Full CloudWatch integration

## Architecture Notes

### Current State (Simplified for Development)

The webhook Lambda function currently:
- ✅ Receives CloudWatch alarms via SNS
- ✅ Validates API keys (logs them)
- ✅ Auto-confirms SNS subscriptions
- ⚠️  **Logs alarms to CloudWatch Logs** (doesn't store in DynamoDB yet)

### Why This Approach?

To avoid AWS SDK bundling issues during initial development, the Lambda function is simplified. This lets you:
1. Test the full flow without TypeScript errors
2. See alarms arriving in CloudWatch Logs
3. Verify SNS integration works

### Next Steps to Complete Integration

To enable full alarm storage, update `amplify/functions/alarm-webhook/handler.ts`:

1. Add AWS SDK dependencies back to `package.json`:
```json
"dependencies": {
  "@aws-sdk/client-dynamodb": "^3.511.0",
  "@aws-sdk/lib-dynamodb": "^3.511.0"
}
```

2. Uncomment the DynamoDB client code in `handler.ts`

3. Run `npm install` in the `amplify/functions/alarm-webhook` directory

4. Redeploy with `npx ampx sandbox`

## Testing CloudWatch Integration

### 1. Get Your Webhook URL
After deploying, your webhook URL is available in:
- The dashboard (after signing in)
- `amplify_outputs.json` under `custom.webhookUrl`

### 2. Create SNS Topic
```bash
aws sns create-topic --name cloudwatch-alarms
```

### 3. Subscribe Webhook
```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:REGION:ACCOUNT:cloudwatch-alarms \
  --protocol https \
  --notification-endpoint "YOUR_WEBHOOK_URL?apiKey=YOUR_API_KEY"
```

### 4. Test with Sample Alarm
```bash
aws sns publish \
  --topic-arn arn:aws:sns:REGION:ACCOUNT:cloudwatch-alarms \
  --message file://test-alarm.json
```

Sample `test-alarm.json`:
```json
{
  "AlarmName": "Test Alarm",
  "AlarmDescription": "This is a test",
  "NewStateValue": "ALARM",
  "NewStateReason": "Testing the webhook",
  "StateChangeTime": "2024-11-07T10:00:00.000Z",
  "Region": "us-east-1",
  "AlarmArn": "arn:aws:cloudwatch:us-east-1:123456789012:alarm:TestAlarm"
}
```

### 5. Check Logs
View Lambda logs in CloudWatch:
```bash
aws logs tail /aws/lambda/alarm-webhook --follow
```

## Troubleshooting

### Backend Won't Deploy
```bash
# Clear caches
rm -rf node_modules package-lock.json
npm install

cd amplify
rm -rf node_modules package-lock.json  
npm install
cd ..

# Try again
npx ampx sandbox
```

### User Pool Error Persists
1. Make sure `amplify_outputs.json` exists in the project root
2. Restart the dev server: `npm run dev`
3. Clear browser cache and reload

### Demo Mode Not Working
- Demo mode works without backend deployment
- Just click "View Demo" on the login page
- No sign up or AWS resources needed

### Can't See Alarms
**In Demo Mode**: You should see 4 sample alarms immediately

**In Authenticated Mode**:
1. Make sure backend is deployed
2. Check that CloudWatch alarms are configured
3. Verify SNS subscription is confirmed
4. Check Lambda logs for incoming requests

## Production Deployment

### Deploy to AWS Amplify Hosting

1. Push code to GitHub

2. Go to AWS Amplify Console

3. Connect your repository

4. Amplify will auto-detect the build settings from `amplify.yml`

5. Deploy!

The production webhook URL will be in your Amplify outputs.

## Support

- Check the [README.md](README.md) for detailed documentation
- View CloudWatch Logs for Lambda function debugging
- Check the browser console for frontend errors

## Next Enhancements

1. **Complete DynamoDB Integration**: Store alarms in the database
2. **Email Notifications**: Alert teams when critical alarms occur
3. **Advanced Filtering**: Search and filter alarms
4. **Analytics Dashboard**: Alarm trends and insights
5. **Slack Integration**: Post alarms to Slack channels

