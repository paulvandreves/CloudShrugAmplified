# CloudWatch Alarm Documentation SaaS

A multi-tenant SaaS application that automatically ingests and documents AWS CloudWatch alarms. Teams can investigate alarms, add notes, track status changes, and maintain a complete history of alarm investigations.

## Features

- 🔔 **Automatic Alarm Ingestion**: Receive CloudWatch alarms via webhook
- 👥 **Multi-Tenant**: Organizations can invite team members
- 📝 **Investigation Tracking**: Document who investigated each alarm with notes and status
- 🔄 **Real-Time Updates**: Live alarm feed with WebSocket subscriptions
- 🎨 **Modern UI**: Clean, responsive interface with status color coding
- 🔐 **Secure**: Built on AWS Amplify Gen2 with Cognito authentication

## Architecture

```
CloudWatch Alarm  ─▶  SNS Topic  ─▶  HTTPS Webhook  ─▶  Lambda Function  ─▶  DynamoDB
                                                                                    │
                                                                                    ▼
                                                                      Amplify Data (GraphQL API)
                                                                                    │
                                                                                    ▼
                                                                        Next.js Frontend App
```

## Data Model

### Organization
- Unique webhook URL (API key)
- Team members with roles
- Linked to all alarms

### Alarm
- CloudWatch alarm data (name, state, reason, metrics)
- Investigation status (Pending, Acknowledged, Investigating, Resolved)
- Raw CloudWatch payload
- Links to investigations

### Investigation
- User who investigated
- Status update
- Notes and findings
- Timestamp

### OrganizationMember
- Team member information
- Role (owner/member)
- Join date

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- AWS Account
- AWS Amplify CLI (`npm install -g @aws-amplify/cli`)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd CloudShrugAmplified
```

2. Install dependencies:
```bash
npm install
cd amplify && npm install && cd ..
```

3. Deploy the Amplify backend:
```bash
npx ampx sandbox
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

### First-Time Setup

1. **Create an Account**: Sign up with your email
2. **Organization Created**: An organization is automatically created with a unique webhook URL
3. **Configure CloudWatch**: Follow the setup instructions to connect your AWS CloudWatch alarms

## Configuring CloudWatch Alarms

### Step 1: Get Your Webhook URL

1. Log into the application
2. Copy your unique webhook URL from the dashboard
3. Note: This URL is unique to your organization

### Step 2: Create SNS Topic

In your AWS Console:

1. Go to **SNS** → **Topics** → **Create topic**
2. Select **Standard** type
3. Name it (e.g., `cloudwatch-alarm-notifications`)
4. Create the topic

### Step 3: Subscribe Webhook to SNS

1. Open your SNS topic
2. Click **Create subscription**
3. Protocol: **HTTPS**
4. Endpoint: Paste your webhook URL
5. Click **Create subscription**
6. The subscription will be auto-confirmed by the Lambda function

### Step 4: Configure CloudWatch Alarms

For each alarm you want to monitor:

1. Go to **CloudWatch** → **Alarms**
2. Create or edit an alarm
3. Under **Notifications**, add your SNS topic
4. Save the alarm

### Testing

Trigger a test alarm or wait for a real alarm. You should see it appear in your dashboard within seconds!

## Using the Application

### Dashboard

- View all recent alarms for your organization
- See alarm status at a glance (color-coded badges)
- Click any alarm to investigate

### Investigating an Alarm

1. Click an alarm card to open the investigation modal
2. Review alarm details, metrics, and raw payload
3. Update status (Acknowledged → Investigating → Resolved)
4. Add notes about your findings
5. Save investigation
6. View timeline of all investigations for this alarm

### Organization Settings

- Access via the organization settings page
- View and regenerate your webhook API key
- Invite team members by email
- See setup instructions

### Team Collaboration

- Invite team members to your organization
- All members can see and investigate alarms
- Investigation history shows who did what and when

## Development

### Project Structure

```
CloudShrugAmplified/
├── amplify/
│   ├── auth/              # Cognito authentication config
│   ├── data/              # Data models and schema
│   ├── functions/         # Lambda functions
│   │   └── alarm-webhook/ # Webhook handler
│   └── backend.ts         # Backend configuration
├── app/
│   ├── components/        # React components
│   │   └── AlarmInvestigation.tsx
│   ├── organization/      # Organization management page
│   ├── page.tsx           # Main dashboard
│   ├── layout.tsx         # Root layout
│   └── app.css            # Styles
└── package.json
```

### Key Technologies

- **Framework**: Next.js 14 (App Router)
- **Backend**: AWS Amplify Gen2
- **Database**: DynamoDB (via Amplify Data)
- **Auth**: AWS Cognito (via Amplify Auth)
- **Real-time**: GraphQL Subscriptions
- **Functions**: AWS Lambda (Node.js)
- **UI**: React with Amplify UI Components

## Deployment

### Deploy to AWS Amplify Hosting

1. Push your code to GitHub
2. Connect your repository to AWS Amplify Console
3. Amplify will auto-deploy backend and frontend
4. Get your production webhook URL from outputs

### Environment Variables

The application uses `amplify_outputs.json` which is auto-generated on deployment.

## Security

- **Authentication**: All users must sign in with Cognito
- **Authorization**: 
  - Users can only see their organization's alarms
  - Webhooks use API key validation
  - Team members have scoped permissions
- **API Keys**: Can be regenerated if compromised
- **HTTPS Only**: All webhook traffic is encrypted

## Troubleshooting

### Alarms Not Appearing

1. Check SNS subscription is confirmed
2. Verify webhook URL has correct API key parameter
3. Check Lambda function logs in CloudWatch
4. Ensure alarm is configured to notify the SNS topic

### Webhook URL Not Showing

- The webhook URL appears after deploying the backend
- It's available in `amplify_outputs.json` under `custom.webhookUrl`
- Redeploy if needed: `npx ampx sandbox`

### API Key Issues

- Regenerate the API key from Organization Settings
- Update your SNS subscription endpoint with new URL
- Confirm the new subscription

## Scaling Considerations

For production use:

- Enable DynamoDB auto-scaling
- Add CloudWatch alarms for Lambda errors
- Implement rate limiting on webhook endpoint
- Consider DynamoDB Global Tables for multi-region
- Add CloudFront for frontend CDN

## Future Enhancements

- Email/SMS notifications for critical alarms
- Alarm analytics and insights
- Custom alarm routing rules
- Slack/Teams integrations
- Advanced filtering and search
- Alarm escalation workflows
- Export investigation reports

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

See LICENSE file for details.

## Support

For issues and questions:
- Open a GitHub issue
- Check CloudWatch Logs for backend errors
- Review Amplify Console for deployment issues
