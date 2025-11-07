"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import { useAuthenticator } from "@aws-amplify/ui-react";
import type { Schema } from "@/amplify/data/resource";
import { demoInvestigations, demoAlarms } from "../lib/demoStorage";

const client = generateClient<Schema>();

type Alarm = Schema["Alarm"]["type"];
type Investigation = Schema["Investigation"]["type"];

interface AlarmInvestigationProps {
  alarm: Alarm;
  demoMode?: boolean;
  onClose: () => void;
  onUpdate: (alarm: Alarm) => void;
}

export default function AlarmInvestigation({
  alarm,
  demoMode = false,
  onClose,
  onUpdate,
}: AlarmInvestigationProps) {
  const { user } = useAuthenticator();
  const [status, setStatus] = useState<string>(alarm.investigationStatus || "PENDING");
  const [notes, setNotes] = useState<string>("");
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInvestigation();
  }, [alarm.id, demoMode]);

  // Load existing investigation notes if one exists
  useEffect(() => {
    if (investigation) {
      setNotes(investigation.notes || "");
      setStatus(investigation.status);
    } else {
      // Clear notes if no investigation exists
      setNotes("");
      setStatus(alarm.investigationStatus || "PENDING");
    }
  }, [investigation, alarm.investigationStatus]);

  const fetchInvestigation = async () => {
    setLoading(true);
    try {
      if (demoMode) {
        // Use LocalStorage for demo mode - get the single investigation for this alarm
        const existing = demoInvestigations.getByAlarmId(alarm.id);
        setInvestigation(existing);
      } else {
        // Use real API - get the single investigation for this alarm
        const { data } = await client.models.Investigation.list({
          filter: {
            alarmId: {
              eq: alarm.id,
            },
          },
        });

        if (data && data.length > 0) {
          // Get the most recent investigation (should only be one)
          const sorted = [...data].sort((a, b) => {
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
          });
          setInvestigation(sorted[0]);
        } else {
          setInvestigation(null);
        }
      }
    } catch (error) {
      console.error("Error fetching investigation:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!demoMode && !user) return;

    setSaving(true);
    try {
      if (demoMode) {
        // Use LocalStorage for demo mode
        const userEmail = "demo@example.com";
        const userId = "demo-user";

        // Update or create investigation (one-to-one relationship)
        demoInvestigations.updateOrCreate(alarm.id, {
          alarmId: alarm.id,
          userId,
          userEmail,
          status,
          notes,
          timestamp: new Date().toISOString(),
          owner: "demo",
        } as unknown as Omit<Investigation, "id" | "createdAt" | "updatedAt">);

        // Update alarm investigation status
        const updated = demoAlarms.update(alarm.id, {
          investigationStatus: status,
        });

        if (updated) {
          onUpdate(updated);
          // Close the dialog after saving
          onClose();
        }
      } else {
        // Use real API
        // Check if investigation exists
        const existing = investigation;
        if (existing) {
          // Update existing investigation
          await client.models.Investigation.update({
            id: existing.id,
            status,
            notes,
            timestamp: new Date().toISOString(),
          });
        } else {
          // Create new investigation
          await client.models.Investigation.create({
            alarmId: alarm.id,
            userId: user.userId,
            userEmail: user.signInDetails?.loginId || "",
            status,
            notes,
            timestamp: new Date().toISOString(),
          });
        }

        // Update alarm investigation status
        const updated = await client.models.Alarm.update({
          id: alarm.id,
          investigationStatus: status,
        });

        if (updated.data) {
          onUpdate(updated.data);
          // Close the dialog after saving
          onClose();
        }
      }
    } catch (error) {
      console.error("Error saving investigation:", error);
      alert("Error saving investigation. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const formatRawPayload = (payload: any) => {
    try {
      return JSON.stringify(payload, null, 2);
    } catch {
      return String(payload);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Alarm Investigation</h2>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <section className="alarm-details">
            <h3>Alarm Details</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Alarm Name:</label>
                <span>{alarm.alarmName}</span>
              </div>
              {alarm.alarmDescription && (
                <div className="detail-item">
                  <label>Description:</label>
                  <span>{alarm.alarmDescription}</span>
                </div>
              )}
              <div className="detail-item">
                <label>State:</label>
                <span className={`state-${alarm.state.toLowerCase()}`}>
                  {alarm.state}
                </span>
              </div>
              <div className="detail-item">
                <label>State Reason:</label>
                <span>{alarm.stateReason}</span>
              </div>
              <div className="detail-item">
                <label>Timestamp:</label>
                <span>{new Date(alarm.timestamp).toLocaleString()}</span>
              </div>
              {alarm.region && (
                <div className="detail-item">
                  <label>Region:</label>
                  <span>{alarm.region}</span>
                </div>
              )}
              {alarm.accountId && (
                <div className="detail-item">
                  <label>Account ID:</label>
                  <span>{alarm.accountId}</span>
                </div>
              )}
              {alarm.namespace && (
                <div className="detail-item">
                  <label>Namespace:</label>
                  <span>{alarm.namespace}</span>
                </div>
              )}
              {alarm.metricName && (
                <div className="detail-item">
                  <label>Metric:</label>
                  <span>{alarm.metricName}</span>
                </div>
              )}
            </div>

            {alarm.rawPayload && (
              <details className="raw-payload">
                <summary>Raw CloudWatch Payload</summary>
                <pre>{formatRawPayload(alarm.rawPayload)}</pre>
              </details>
            )}
          </section>

          <section className="investigation-form">
            <h3>Add Investigation</h3>
            <div className="form-group">
              <label htmlFor="status">Status:</label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="form-select"
              >
                <option value="PENDING">Pending</option>
                <option value="INVESTIGATING">Investigating</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="notes">Notes:</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add investigation notes, findings, or resolution details..."
                rows={4}
                className="form-textarea"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? "Saving..." : "Save Investigation"}
            </button>
          </section>

          <section className="investigation-history">
            <h3>Investigation Details</h3>
            {loading ? (
              <div className="loading">Loading investigation...</div>
            ) : !investigation ? (
              <div className="empty-state">
                No investigation yet. Add notes and status above to create an investigation for this alarm.
              </div>
            ) : (
              <div className="timeline">
                <div key={investigation.id} className="timeline-item">
                  <div className="timeline-header">
                    <span className="timeline-user">
                      {investigation.userEmail || investigation.userId}
                    </span>
                    <span className="timeline-time">
                      {new Date(investigation.timestamp).toLocaleString()}
                      {investigation.updatedAt && investigation.updatedAt !== investigation.createdAt && (
                        <span className="updated-badge"> (Updated)</span>
                      )}
                    </span>
                  </div>
                  <div className="timeline-status">
                    <span className={`status-badge status-${investigation.status.toLowerCase()}`}>
                      {investigation.status}
                    </span>
                  </div>
                  {investigation.notes && (
                    <div className="timeline-notes">{investigation.notes}</div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

