/**
 * Resource Parser
 * 
 * Extracts resource information from CloudWatch alarms
 * to enable grouping by resource type and identifier
 */

import type { Schema } from "@/amplify/data/resource";

type Alarm = Schema["Alarm"]["type"];

export interface ResourceInfo {
  type: string; // e.g., "Lambda", "EC2", "RDS"
  identifier: string; // e.g., "my-function", "i-1234567890abcdef0"
  displayName: string; // Human-readable name
  namespace: string; // AWS namespace
}

export interface GroupedAlarms {
  resourceType: string;
  resources: {
    resourceInfo: ResourceInfo;
    alarms: Alarm[];
    alarmCount: number;
    activeAlarmCount: number;
    latestAlarm: Alarm | null;
    investigationStatuses: string[];
  }[];
}

/**
 * Extract resource information from alarm name and metadata
 */
export function extractResourceInfo(alarm: Alarm): ResourceInfo {
  const alarmName = alarm.alarmName || "";
  const namespace = alarm.namespace || "";
  const metricName = alarm.metricName || "";
  
  // Try to extract resource identifier from alarm name
  // Common patterns:
  // - "High CPU Usage - Production API" -> type: "EC2", identifier: "Production API"
  // - "Lambda Function Errors - my-function" -> type: "Lambda", identifier: "my-function"
  // - "Database Connection Pool - my-db" -> type: "RDS", identifier: "my-db"
  
  let resourceType = "Unknown";
  let identifier = alarmName;
  let displayName = alarmName;
  
  // Determine resource type from namespace
  if (namespace.includes("Lambda")) {
    resourceType = "Lambda";
  } else if (namespace.includes("EC2")) {
    resourceType = "EC2";
  } else if (namespace.includes("RDS")) {
    resourceType = "RDS";
  } else if (namespace.includes("S3")) {
    resourceType = "S3";
  } else if (namespace.includes("DynamoDB")) {
    resourceType = "DynamoDB";
  } else if (namespace.includes("API Gateway")) {
    resourceType = "API Gateway";
  } else if (namespace.includes("ECS")) {
    resourceType = "ECS";
  } else if (namespace.includes("ElastiCache")) {
    resourceType = "ElastiCache";
  } else if (namespace.includes("CloudFront")) {
    resourceType = "CloudFront";
  } else if (namespace.includes("SNS")) {
    resourceType = "SNS";
  } else if (namespace.includes("SQS")) {
    resourceType = "SQS";
  }
  
  // Try to extract identifier from alarm name
  // Pattern: "Type - Identifier" or "Type Identifier" or "Type: Identifier"
  const patterns = [
    /^(.+?)\s*-\s*(.+)$/,  // "Type - Identifier"
    /^(.+?):\s*(.+)$/,     // "Type: Identifier"
    /^(.+?)\s+(.+)$/,      // "Type Identifier"
  ];
  
  for (const pattern of patterns) {
    const match = alarmName.match(pattern);
    if (match && match.length >= 3) {
      const firstPart = match[1].trim();
      const secondPart = match[2].trim();
      
      // If first part looks like a resource type or metric, use second part as identifier
      if (firstPart.length < 50 && secondPart.length > 0) {
        // Check if first part contains common alarm keywords
        const commonKeywords = [
          'High', 'Low', 'Error', 'Warning', 'Critical', 'CPU', 'Memory',
          'Disk', 'Connection', 'Pool', 'Usage', 'Spiking', 'Exceeded'
        ];
        const hasKeyword = commonKeywords.some(keyword => 
          firstPart.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (hasKeyword || firstPart.length < 30) {
          identifier = secondPart;
          displayName = secondPart;
          break;
        }
      }
    }
  }
  
  // Special handling for common patterns
  // "High CPU Usage - Production API" -> identifier: "Production API"
  // "Lambda Function Errors Spiking" -> try to extract function name
  if (resourceType === "Lambda" && alarmName.includes("Function")) {
    const lambdaMatch = alarmName.match(/Function\s+(.+?)(?:\s|$)/i);
    if (lambdaMatch && lambdaMatch[1]) {
      identifier = lambdaMatch[1].trim();
      displayName = identifier;
    }
  }
  
  // Try to extract from metric name or description
  if (metricName) {
    // Lambda function names often appear in metric names
    if (resourceType === "Lambda" && metricName.includes(":")) {
      const parts = metricName.split(":");
      if (parts.length > 1) {
        identifier = parts[parts.length - 1];
        displayName = identifier;
      }
    }
  }
  
  // Fallback: use alarm name as identifier if we couldn't parse
  if (identifier === alarmName && alarmName.length > 50) {
    identifier = alarmName.substring(0, 50) + "...";
    displayName = identifier;
  }
  
  return {
    type: resourceType,
    identifier,
    displayName,
    namespace,
  };
}

/**
 * Group alarms by resource type and identifier
 */
export function groupAlarmsByResource(alarms: Alarm[]): GroupedAlarms[] {
  const grouped = new Map<string, Map<string, Alarm[]>>();
  
  // Group alarms by resource type, then by resource identifier
  alarms.forEach((alarm) => {
    const resourceInfo = extractResourceInfo(alarm);
    const type = resourceInfo.type;
    const identifier = resourceInfo.identifier;
    
    if (!grouped.has(type)) {
      grouped.set(type, new Map());
    }
    
    const typeMap = grouped.get(type)!;
    if (!typeMap.has(identifier)) {
      typeMap.set(identifier, []);
    }
    
    typeMap.get(identifier)!.push(alarm);
  });
  
  // Convert to array structure
  const result: GroupedAlarms[] = [];
  
  grouped.forEach((typeMap, resourceType) => {
    const resources: GroupedAlarms["resources"] = [];
    
    typeMap.forEach((alarmList, identifier) => {
      // Get resource info from first alarm (they should all have same info)
      const resourceInfo = extractResourceInfo(alarmList[0]);
      
      // Sort alarms by timestamp (newest first)
      const sortedAlarms = [...alarmList].sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
      
      // Calculate statistics
      const alarmCount = alarmList.length;
      const activeAlarmCount = alarmList.filter(
        (a) => a.state === "ALARM"
      ).length;
      const latestAlarm = sortedAlarms[0] || null;
      const investigationStatuses = [
        ...new Set(
          alarmList
            .map((a) => a.investigationStatus || "PENDING")
            .filter((s) => s)
        ),
      ];
      
      resources.push({
        resourceInfo,
        alarms: sortedAlarms,
        alarmCount,
        activeAlarmCount,
        latestAlarm,
        investigationStatuses,
      });
    });
    
    // Sort resources by alarm count (most alarms first)
    resources.sort((a, b) => b.alarmCount - a.alarmCount);
    
    result.push({
      resourceType,
      resources,
    });
  });
  
  // Sort resource types by total alarm count
  result.sort((a, b) => {
    const aCount = a.resources.reduce((sum, r) => sum + r.alarmCount, 0);
    const bCount = b.resources.reduce((sum, r) => sum + r.alarmCount, 0);
    return bCount - aCount;
  });
  
  return result;
}

