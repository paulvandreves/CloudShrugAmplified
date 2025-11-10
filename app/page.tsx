"use client";

import { useState, useEffect } from "react";
import { useAuthenticator, Authenticator } from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import "./../app/app.css";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import AlarmInvestigation from "./components/AlarmInvestigation";
import ResourceTree from "./components/ResourceTree";
import { 
  demoAlarms, 
  demoOrganization, 
  initializeDemoData,
  clearDemoData
} from "./lib/demoStorage";

Amplify.configure(outputs);

const client = generateClient<Schema>();

type Alarm = Schema["Alarm"]["type"];

export default function App() {
  const { user, signOut } = useAuthenticator();
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null);
  const [organization, setOrganization] = useState<Schema["Organization"]["type"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(true);

  useEffect(() => {
    if (demoMode) {
      // Initialize demo data in LocalStorage
      initializeDemoData();
      
      // Load demo data from LocalStorage
      const demoAlarmsList = demoAlarms.list();
      const demoOrg = demoOrganization.get();
      
      setAlarms(demoAlarmsList);
      setOrganization(demoOrg as Schema["Organization"]["type"]);
      setLoading(false);
      return;
    }

    // When exiting demo mode, clear demo data
    if (!user) {
      setAlarms([]);
      setOrganization(null);
      setSelectedAlarm(null);
      setLoading(false);
      return;
    }

    // Fetch or create organization for the user
    const fetchOrganization = async () => {
      try {
        // Check if user has an organization
        const { data: orgs } = await client.models.Organization.list({
          filter: {
            owner: {
              eq: user.userId,
            },
          },
        });

        if (orgs && orgs.length > 0) {
          setOrganization(orgs[0]);
        } else {
          // Create a new organization for the user
          const newOrg = await client.models.Organization.create({
            name: `${user.signInDetails?.loginId}'s Organization`,
            webhookApiKey: generateApiKey(),
            createdAt: new Date().toISOString(),
          });
          
          if (newOrg.data) {
            setOrganization(newOrg.data);
          }
        }
      } catch (error) {
        console.error("Error fetching organization:", error);
      }
    };

    fetchOrganization();
  }, [user, demoMode]);

  useEffect(() => {
    // Don't fetch if in demo mode, no organization, or no user
    if (demoMode || !organization || !user) {
      return;
    }

    // Fetch alarms for the organization
    const fetchAlarms = async () => {
      try {
        const { data } = await client.models.Alarm.list({
          filter: {
            organizationId: {
              eq: organization.id,
            },
          },
        });

        if (data) {
          // Sort by timestamp, newest first
          const sortedAlarms = [...data].sort((a, b) => {
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
          });
          setAlarms(sortedAlarms);
        }
      } catch (error) {
        console.error("Error fetching alarms:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlarms();

    // Subscribe to real-time updates
    const subscription = client.models.Alarm.observeQuery({
      filter: {
        organizationId: {
          eq: organization.id,
        },
      },
    }).subscribe({
      next: ({ items }) => {
        const sortedAlarms = [...items].sort((a, b) => {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
        setAlarms(sortedAlarms);
      },
      error: (error) => {
        // Only log errors if user is still authenticated
        if (user) {
          console.error("Subscription error:", error);
        }
      },
    });

    return () => subscription.unsubscribe();
  }, [organization, demoMode, user]);

  const generateApiKey = () => {
    return `cw_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  };

  const copyWebhookUrl = () => {
    if (!organization) return;
    
    const customOutputs = outputs as any;
    const webhookUrl = `${customOutputs.custom?.webhookUrl || 'YOUR_WEBHOOK_URL'}?apiKey=${organization.webhookApiKey}`;
    navigator.clipboard.writeText(webhookUrl);
    alert("Webhook URL copied to clipboard!");
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case "ALARM":
        return "#ff4444";
      case "OK":
        return "#44ff44";
      case "INSUFFICIENT_DATA":
        return "#ffaa44";
      default:
        return "#888";
    }
  };

  const getStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case "RESOLVED":
        return "#48bb78"; // green
      case "INVESTIGATING":
        return "#ed8936"; // yellow/orange
      case "PENDING":
        return "#f56565"; // red
      case "ACKNOWLEDGED":
        // Map ACKNOWLEDGED to PENDING color for backward compatibility
        return "#f56565"; // red
      default:
        return "#a0aec0"; // gray
    }
  };

  // Show loading state only when not in demo mode and we're waiting for auth
  if (loading && !demoMode && !user) {
    return (
      <main className="container">
        <div className="loading">Loading...</div>
      </main>
    );
  }

  // If not authenticated and not in demo mode, show login/signup form
  if (!user && !demoMode) {
    return (
      <main className="container">
        <div className="welcome-screen">
          <div className="welcome-content">
            <h1>Alarm Trail</h1>
            <p className="welcome-subtitle">
            Recongize, investigate, and document patterns in you AWS CloudWatch Alarms
            </p>
            <div className="welcome-actions">
              <button onClick={() => setDemoMode(true)} className="btn-secondary btn-large">
                View Demo
              </button>
            </div>
            <div className="auth-container">
              <Authenticator />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      {demoMode && (
        <div className="demo-banner">
          <div className="demo-banner-content">
            <span className="demo-badge">🎭 DEMO MODE</span>
            <p>You're exploring with sample data. All changes are saved locally</p>
            <div className="demo-actions">
              <button 
                onClick={() => {
                  if (confirm("Reset all demo data? This will clear all your investigations.")) {
                    clearDemoData();
                    initializeDemoData();
                    const updatedAlarms = demoAlarms.list();
                    setAlarms(updatedAlarms);
                    setSelectedAlarm(null);
                  }
                }} 
                className="btn-secondary btn-small"
                title="Reset demo data"
              >
                Reset Demo
              </button>
              <button 
                onClick={() => {
                  setDemoMode(false);
                  setAlarms([]);
                  setOrganization(null);
                  setSelectedAlarm(null);
                }} 
                className="btn-secondary"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      )}
      
      <header className="header">
        <div className="header-content">
          <h1>Your Cloudwatch Alarms</h1>
          <div className="user-info">
            {demoMode ? (
              <>
                <span>Demo User</span>
              </>
            ) : user ? (
              <>
                <span>{user?.signInDetails?.loginId}</span>
                <button onClick={signOut} className="btn-secondary">Sign out</button>
              </>
            ) : null}
          </div>
        </div>
      </header>

      {organization && !demoMode && (
        <section className="webhook-section">
          <h2>Schedule a Call with an Implementation Specialist</h2>
          <p>Ready to get started? Schedule a call with our implementation specialist to set up your CloudWatch alarm integration.</p>
          <div className="calendly-container">
            <a 
              href="https://calendar.app.google/YCg6ubHd6YABnoap9"
              className="btn-primary btn-large"
            >
              Schedule a Call
            </a>
            <p style={{ marginTop: '12px', fontSize: '14px', color: '#718096' }}>
            </p>
          </div>
          {/* 
          <section className="webhook-section">
            <h2>Webhook Configuration</h2>
            <p>Configure your CloudWatch alarms to send notifications to this webhook URL:</p>
            <div className="webhook-url-container">
              <code className="webhook-url">
                {(outputs as any).custom?.webhookUrl || 'Deploy to get webhook URL'}?apiKey={organization.webhookApiKey}
              </code>
              <button onClick={copyWebhookUrl} className="btn-copy">Copy URL</button>
            </div>
            <p className="help-text">
              Instructions: Create an SNS topic in AWS, add the webhook URL as an HTTPS subscription, 
              then configure your CloudWatch alarms to publish to that SNS topic.
            </p>
          </section>
          */}
        </section>
      )}

      <section className="alarms-section">
        <h2>Alarms by Resource</h2>
        <p className="section-description">
          Alarms grouped by resource type and identifier. Expand to see alarm history and investigations for each resource.
        </p>
        {alarms.length === 0 ? (
          <div className="empty-state">
            <p>No alarms received yet. Configure your CloudWatch alarms to start monitoring.</p>
          </div>
        ) : (
          <ResourceTree
            alarms={alarms}
            demoMode={demoMode}
            onAlarmClick={setSelectedAlarm}
            getStateColor={getStateColor}
            getStatusColor={getStatusColor}
          />
        )}
      </section>

      {selectedAlarm && (
        <AlarmInvestigation
          alarm={selectedAlarm}
          demoMode={demoMode}
          onClose={() => {
            setSelectedAlarm(null);
            // Refresh alarms list from LocalStorage if in demo mode
            if (demoMode) {
              const updatedAlarms = demoAlarms.list();
              setAlarms(updatedAlarms);
            }
          }}
          onUpdate={(updatedAlarm) => {
            // Update the alarms array with the updated alarm
            const updatedAlarms = alarms.map(a => 
              a.id === updatedAlarm.id ? updatedAlarm : a
            );
            setAlarms(updatedAlarms);
            setSelectedAlarm(updatedAlarm);
            // Also update LocalStorage if in demo mode
            if (demoMode) {
              demoAlarms.update(updatedAlarm.id, updatedAlarm);
            }
          }}
        />
      )}
    </main>
  );
}
