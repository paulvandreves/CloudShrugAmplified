"use client";

import { useState, useMemo, useEffect } from "react";
import type React from "react";
import type { Schema } from "@/amplify/data/resource";
import { groupAlarmsByResource, type GroupedAlarms } from "../lib/resourceParser";
import { demoInvestigations } from "../lib/demoStorage";

type Alarm = Schema["Alarm"]["type"];

interface ResourceTreeProps {
  alarms: Alarm[];
  demoMode?: boolean;
  onAlarmClick: (alarm: Alarm) => void;
  getStateColor: (state: string) => string;
  getStatusColor: (status: string | null | undefined) => string;
}

export default function ResourceTree({
  alarms,
  demoMode = false,
  onAlarmClick,
  getStateColor,
  getStatusColor,
}: ResourceTreeProps) {
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set());
  
  // Recalculate grouping whenever alarms change
  const grouped = useMemo(() => {
    return groupAlarmsByResource(alarms);
  }, [alarms]);
  
  // The component will automatically re-render when alarms prop changes
  // This ensures all counts (active alarms, investigations) are recalculated
  
  const toggleType = (type: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedTypes(newExpanded);
  };
  
  const toggleResource = (resourceKey: string) => {
    const newExpanded = new Set(expandedResources);
    if (newExpanded.has(resourceKey)) {
      newExpanded.delete(resourceKey);
    } else {
      newExpanded.add(resourceKey);
    }
    setExpandedResources(newExpanded);
  };
  
  const getResourceKey = (type: string, identifier: string) => `${type}:${identifier}`;
  
  // Get investigation count for a resource
  // This will recalculate when alarms change
  const getInvestigationCount = (resourceAlarms: Alarm[]): number => {
    if (demoMode) {
      let count = 0;
      resourceAlarms.forEach((alarm) => {
        const investigations = demoInvestigations.list(alarm.id);
        count += investigations.length;
      });
      return count;
    }
    // For real mode, we'd need to fetch investigations
    // For now, return 0 and it can be enhanced later
    return 0;
  };

  // Count alarms by investigation status
  const countAlarmsByStatus = (alarms: Alarm[]): Record<string, number> => {
    const counts: Record<string, number> = {
      PENDING: 0,
      INVESTIGATING: 0,
      RESOLVED: 0,
    };

    alarms.forEach((alarm) => {
      const status = alarm.investigationStatus || "PENDING";
      // Map ACKNOWLEDGED to PENDING for backward compatibility
      const normalizedStatus = status === "ACKNOWLEDGED" ? "PENDING" : status;
      if (normalizedStatus in counts) {
        counts[normalizedStatus]++;
      } else {
        counts[normalizedStatus] = 1;
      }
    });

    return counts;
  };

  // Get investigation status color
  const getInvestigationStatusColor = (status: string): string => {
    switch (status) {
      case "PENDING":
        return "#f56565"; // red
      case "INVESTIGATING":
        return "#ed8936"; // yellow/orange
      case "RESOLVED":
        return "#48bb78"; // green
      default:
        return "#718096"; // gray
    }
  };

  // Format status breakdown for display with color coding
  const formatStatusBreakdown = (counts: Record<string, number>): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    
    if (counts.PENDING > 0) {
      parts.push(
        <span key="pending" className="status-count-item" style={{ color: getInvestigationStatusColor("PENDING") }}>
          {counts.PENDING} PENDING
        </span>
      );
    }
    if (counts.INVESTIGATING > 0) {
      parts.push(
        <span key="investigating" className="status-count-item" style={{ color: getInvestigationStatusColor("INVESTIGATING") }}>
          {counts.INVESTIGATING} INVESTIGATING
        </span>
      );
    }
    if (counts.RESOLVED > 0) {
      parts.push(
        <span key="resolved" className="status-count-item" style={{ color: getInvestigationStatusColor("RESOLVED") }}>
          {counts.RESOLVED} RESOLVED
        </span>
      );
    }
    
    // Handle any other statuses
    Object.entries(counts).forEach(([status, count]) => {
      if (!["PENDING", "INVESTIGATING", "RESOLVED"].includes(status) && count > 0) {
        parts.push(
          <span key={status} className="status-count-item" style={{ color: getInvestigationStatusColor(status) }}>
            {count} {status}
          </span>
        );
      }
    });

    if (parts.length === 0) return null;
    
    // Build the breakdown with separators
    const breakdownParts: React.ReactNode[] = [];
    parts.forEach((part, index) => {
      if (index > 0) {
        breakdownParts.push(<span key={`sep-${index}`}>, </span>);
      }
      breakdownParts.push(part);
    });
    
    return (
      <span className="status-breakdown">
        {" ("}
        {breakdownParts}
        {")"}
      </span>
    );
  };
  
  if (grouped.length === 0) {
    return (
      <div className="empty-state">
        <p>No alarms to display.</p>
      </div>
    );
  }
  
  return (
    <div className="resource-tree">
      {grouped.map((group) => {
        const isTypeExpanded = expandedTypes.has(group.resourceType);
        const totalAlarms = group.resources.reduce(
          (sum, r) => sum + r.alarmCount,
          0
        );

        
        // Count alarms by investigation status for this resource type
        const allTypeAlarms = group.resources.flatMap(r => r.alarms);
        const typeStatusCounts = countAlarmsByStatus(allTypeAlarms);
        const typeStatusBreakdown = formatStatusBreakdown(typeStatusCounts);
        
        return (
          <div key={group.resourceType} className="resource-type-group">
            <div
              className="resource-type-header"
              onClick={() => toggleType(group.resourceType)}
            >
              <div className="resource-type-info">
                <span className="resource-type-icon">
                  {isTypeExpanded ? "▼" : "▶"}
                </span>
                <span className="resource-type-name">{group.resourceType}</span>
                <span className="resource-type-count">
                  {totalAlarms} alarm{totalAlarms !== 1 ? "s" : ""}
                  {typeStatusBreakdown}
                </span>
              </div>
            </div>
            
            {isTypeExpanded && (
              <div className="resource-type-content">
                {group.resources.map((resource) => {
                  const resourceKey = getResourceKey(
                    group.resourceType,
                    resource.resourceInfo.identifier
                  );
                  const isResourceExpanded = expandedResources.has(resourceKey);
                  const investigationCount = getInvestigationCount(resource.alarms);
                  
                  
                  // Count alarms by investigation status for this resource
                  const resourceStatusCounts = countAlarmsByStatus(resource.alarms);
                  const resourceStatusBreakdown = formatStatusBreakdown(resourceStatusCounts);
                  
                  return (
                    <div key={resourceKey} className="resource-item">
                      <div
                        className="resource-header"
                        onClick={() => toggleResource(resourceKey)}
                      >
                        <div className="resource-info">
                          <span className="resource-icon">
                            {isResourceExpanded ? "▼" : "▶"}
                          </span>
                          <span className="resource-name">
                            {resource.resourceInfo.displayName}
                          </span>
                          <span className="resource-meta">
                            <span className="alarm-count-badge">
                              {resource.alarmCount} alarm{resource.alarmCount !== 1 ? "s" : ""}
                              {resourceStatusBreakdown}
                            </span>
                            {investigationCount > 0 && (
                              <span className="investigation-count">
                                {investigationCount} investigation{investigationCount !== 1 ? "s" : ""}
                              </span>
                            )}
                          </span>
                        </div>
                        {resource.latestAlarm && (
                          <div className="resource-latest">
                            <span className="resource-time">
                              {new Date(resource.latestAlarm.timestamp).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {isResourceExpanded && (
                        <div className="resource-alarms">
                          {resource.alarms.map((alarm) => (
                            <div
                              key={alarm.id}
                              className="alarm-item"
                              onClick={() => onAlarmClick(alarm)}
                            >
                              <div className="alarm-item-header">
                                <span className="alarm-item-name">
                                  {alarm.alarmName}
                                </span>
                                <span
                                  className="state-badge"
                                  style={{
                                    backgroundColor: getStateColor(alarm.state),
                                  }}
                                >
                                  {alarm.state}
                                </span>
                              </div>
                              {alarm.alarmDescription && (
                                <p className="alarm-item-description">
                                  {alarm.alarmDescription}
                                </p>
                              )}
                              <div className="alarm-item-footer">
                                <span className="alarm-item-time">
                                  {new Date(alarm.timestamp).toLocaleString()}
                                </span>
                                <span
                                  className="status-badge"
                                  style={{
                                    backgroundColor: getStatusColor(
                                      alarm.investigationStatus
                                    ),
                                  }}
                                >
                                  {alarm.investigationStatus || "PENDING"}
                                </span>
                                {alarm.metricName && (
                                  <span className="metric-name">
                                    {alarm.metricName}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

