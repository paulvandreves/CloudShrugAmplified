"use client";

import { useState, useEffect } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import Link from "next/link";

Amplify.configure(outputs);

const client = generateClient<Schema>();

type Organization = Schema["Organization"]["type"];
type OrganizationMember = Schema["OrganizationMember"]["type"];

export default function OrganizationPage() {
  const { user, signOut } = useAuthenticator();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchOrganization = async () => {
      try {
        const { data: orgs } = await client.models.Organization.list({
          filter: {
            owner: {
              eq: user.userId,
            },
          },
        });

        if (orgs && orgs.length > 0) {
          setOrganization(orgs[0]);
          fetchMembers(orgs[0].id);
        }
      } catch (error) {
        console.error("Error fetching organization:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [user]);

  const fetchMembers = async (orgId: string) => {
    try {
      const { data } = await client.models.OrganizationMember.list({
        filter: {
          organizationId: {
            eq: orgId,
          },
        },
      });

      if (data) {
        setMembers(data);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  const handleInviteMember = async () => {
    if (!organization || !newMemberEmail.trim()) return;

    setInviting(true);
    try {
      // Note: In a real implementation, you'd send an invitation email
      // For now, we'll just add them as a pending member
      await client.models.OrganizationMember.create({
        organizationId: organization.id,
        userId: `pending-${Date.now()}`,
        userEmail: newMemberEmail,
        role: "member",
        joinedAt: new Date().toISOString(),
      });

      setNewMemberEmail("");
      fetchMembers(organization.id);
      alert(`Invitation sent to ${newMemberEmail}`);
    } catch (error) {
      console.error("Error inviting member:", error);
      alert("Error sending invitation. Please try again.");
    } finally {
      setInviting(false);
    }
  };

  const copyWebhookUrl = () => {
    if (!organization) return;
    
    const customOutputs = outputs as any;
    const webhookUrl = `${customOutputs.custom?.webhookUrl || 'YOUR_WEBHOOK_URL'}?apiKey=${organization.webhookApiKey}`;
    navigator.clipboard.writeText(webhookUrl);
    alert("Webhook URL copied to clipboard!");
  };

  const regenerateApiKey = async () => {
    if (!organization) return;
    
    if (!confirm("Are you sure you want to regenerate the API key? This will break existing webhook configurations.")) {
      return;
    }

    try {
      const newApiKey = `cw_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      
      const updated = await client.models.Organization.update({
        id: organization.id,
        webhookApiKey: newApiKey,
      });

      if (updated.data) {
        setOrganization(updated.data);
        alert("API key regenerated successfully!");
      }
    } catch (error) {
      console.error("Error regenerating API key:", error);
      alert("Error regenerating API key. Please try again.");
    }
  };

  if (loading) {
    return (
      <main className="container">
        <div className="loading">Loading...</div>
      </main>
    );
  }

  if (!organization) {
    return (
      <main className="container">
        <div className="empty-state">
          <p>No organization found. Please go to the home page to create one.</p>
          <Link href="/" className="btn-primary">Go to Home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <header className="header">
        <div className="header-content">
          <h1>Organization Settings</h1>
          <div className="user-info">
            <Link href="/" className="btn-secondary">← Back to Alarms</Link>
            <span>{user?.signInDetails?.loginId}</span>
            <button onClick={signOut} className="btn-secondary">Sign out</button>
          </div>
        </div>
      </header>

      <section className="settings-section">
        <h2>Organization Details</h2>
        <div className="detail-grid">
          <div className="detail-item">
            <label>Organization Name:</label>
            <span>{organization.name}</span>
          </div>
          <div className="detail-item">
            <label>Created:</label>
            <span>{organization.createdAt ? new Date(organization.createdAt).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>
      </section>

      <section className="settings-section">
        <h2>Webhook Configuration</h2>
        <p>Use this webhook URL to receive CloudWatch alarm notifications:</p>
        <div className="webhook-url-container">
          <code className="webhook-url">
            {(outputs as any).custom?.webhookUrl || 'Deploy to get webhook URL'}?apiKey={organization.webhookApiKey}
          </code>
          <button onClick={copyWebhookUrl} className="btn-copy">Copy URL</button>
        </div>
        <button onClick={regenerateApiKey} className="btn-danger">
          Regenerate API Key
        </button>

        <div className="setup-instructions">
          <h3>Setup Instructions</h3>
          <ol>
            <li>
              <strong>Create an SNS Topic in AWS:</strong>
              <p>Go to AWS SNS Console and create a new Standard topic. Note the topic ARN.</p>
            </li>
            <li>
              <strong>Subscribe the Webhook:</strong>
              <p>Create a new subscription for the topic:</p>
              <ul>
                <li>Protocol: HTTPS</li>
                <li>Endpoint: Your webhook URL (above)</li>
                <li>The subscription will be auto-confirmed</li>
              </ul>
            </li>
            <li>
              <strong>Configure CloudWatch Alarms:</strong>
              <p>For each alarm you want to monitor:</p>
              <ul>
                <li>Edit the alarm's notification settings</li>
                <li>Add the SNS topic you created</li>
                <li>Save the alarm configuration</li>
              </ul>
            </li>
            <li>
              <strong>Test the Integration:</strong>
              <p>Trigger an alarm manually or wait for a real alarm to verify the integration works.</p>
            </li>
          </ol>
        </div>
      </section>

      <section className="settings-section">
        <h2>Team Members</h2>
        <div className="invite-form">
          <input
            type="email"
            placeholder="Email address"
            value={newMemberEmail}
            onChange={(e) => setNewMemberEmail(e.target.value)}
            className="form-input"
          />
          <button
            onClick={handleInviteMember}
            disabled={inviting || !newMemberEmail.trim()}
            className="btn-primary"
          >
            {inviting ? "Inviting..." : "Invite Member"}
          </button>
        </div>

        {members.length === 0 ? (
          <div className="empty-state">
            <p>No team members yet. Invite someone to collaborate!</p>
          </div>
        ) : (
          <div className="members-list">
            {members.map((member) => (
              <div key={member.id} className="member-item">
                <div className="member-info">
                  <span className="member-email">{member.userEmail || member.userId}</span>
                  <span className="member-role">{member.role || 'member'}</span>
                </div>
                <span className="member-joined">
                  Joined {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

