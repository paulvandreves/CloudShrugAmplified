/**
 * Demo Mode LocalStorage API
 * 
 * This provides a mock API using LocalStorage for demo mode,
 * allowing users to interact with alarms and investigations
 * without requiring authentication.
 */

import type { Schema } from "@/amplify/data/resource";

type Alarm = Schema["Alarm"]["type"];
type Investigation = Schema["Investigation"]["type"];

const STORAGE_KEYS = {
  ALARMS: "demo_alarms",
  INVESTIGATIONS: "demo_investigations",
  ORGANIZATION: "demo_organization",
} as const;

// Initialize demo data if it doesn't exist
export function initializeDemoData() {
  if (typeof window === "undefined") return;

  // Check if demo data already exists
  if (localStorage.getItem(STORAGE_KEYS.ALARMS)) {
    return;
  }

  // Create initial demo alarms
  // 3 alarms per resource type, one for each investigation status (PENDING, INVESTIGATING, RESOLVED)
  const initialAlarms: Alarm[] = [
    // EC2 Alarms
    {
      id: "demo-1",
      organizationId: "demo-org",
      alarmName: "High CPU Usage - Production API",
      alarmDescription: "CPU utilization exceeded 80% threshold",
      state: "ALARM",
      stateReason: "Threshold Crossed: 1 datapoint [85.3 (07/11/24 10:15:00)] was greater than the threshold (80.0).",
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      region: "us-east-1",
      accountId: "123456789012",
      namespace: "AWS/EC2",
      metricName: "CPUUtilization",
      investigationStatus: "PENDING",
      rawPayload: {
        AlarmName: "High CPU Usage - Production API",
        NewStateValue: "ALARM",
        Trigger: {
          MetricName: "CPUUtilization",
          Namespace: "AWS/EC2",
        },
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      owner: "demo",
    } as unknown as Alarm,
    {
      id: "demo-2",
      organizationId: "demo-org",
      alarmName: "DiskSpace Low - Log Server",
      alarmDescription: "Available disk space below 15%",
      state: "ALARM",
      stateReason: "Threshold Crossed: Disk space below 15% threshold",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      region: "eu-west-1",
      accountId: "123456789012",
      namespace: "AWS/EC2",
      metricName: "DiskSpaceAvailable",
      investigationStatus: "INVESTIGATING",
      rawPayload: {
        AlarmName: "DiskSpace Low - Log Server",
        NewStateValue: "ALARM",
        Trigger: {
          MetricName: "DiskSpaceAvailable",
          Namespace: "AWS/EC2",
        },
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      owner: "demo",
    } as unknown as Alarm,
    {
      id: "demo-3",
      organizationId: "demo-org",
      alarmName: "Memory Usage High - Web Server",
      alarmDescription: "Memory utilization exceeded 90% threshold",
      state: "OK",
      stateReason: "Threshold Crossed: Memory usage recovered to 65%",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      region: "us-west-2",
      accountId: "123456789012",
      namespace: "AWS/EC2",
      metricName: "MemoryUtilization",
      investigationStatus: "RESOLVED",
      rawPayload: {
        AlarmName: "Memory Usage High - Web Server",
        NewStateValue: "OK",
        Trigger: {
          MetricName: "MemoryUtilization",
          Namespace: "AWS/EC2",
        },
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      owner: "demo",
    } as unknown as Alarm,
    
    // RDS Alarms
    {
      id: "demo-4",
      organizationId: "demo-org",
      alarmName: "Database Connection Pool Exhausted",
      alarmDescription: "RDS connection pool reached maximum capacity",
      state: "ALARM",
      stateReason: "Threshold Crossed: Database connections exceeded 95% of pool size",
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      region: "us-west-2",
      accountId: "123456789012",
      namespace: "AWS/RDS",
      metricName: "DatabaseConnections",
      investigationStatus: "RESOLVED",
      rawPayload: {
        AlarmName: "Database Connection Pool Exhausted",
        NewStateValue: "ALARM",
        Trigger: {
          MetricName: "DatabaseConnections",
          Namespace: "AWS/RDS",
        },
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      owner: "demo",
    } as unknown as Alarm,
    {
      id: "demo-5",
      organizationId: "demo-org",
      alarmName: "High CPU Utilization - Main Database",
      alarmDescription: "RDS CPU utilization exceeded 85% threshold",
      state: "ALARM",
      stateReason: "Threshold Crossed: CPU utilization at 87% for 5 minutes",
      timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      region: "us-east-1",
      accountId: "123456789012",
      namespace: "AWS/RDS",
      metricName: "CPUUtilization",
      investigationStatus: "PENDING",
      rawPayload: {
        AlarmName: "High CPU Utilization - Main Database",
        NewStateValue: "ALARM",
        Trigger: {
          MetricName: "CPUUtilization",
          Namespace: "AWS/RDS",
        },
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      owner: "demo",
    } as unknown as Alarm,
    {
      id: "demo-6",
      organizationId: "demo-org",
      alarmName: "Read Latency High - Analytics DB",
      alarmDescription: "Read latency exceeded 200ms threshold",
      state: "ALARM",
      stateReason: "Threshold Crossed: Read latency at 250ms average",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
      region: "eu-west-1",
      accountId: "123456789012",
      namespace: "AWS/RDS",
      metricName: "ReadLatency",
      investigationStatus: "INVESTIGATING",
      rawPayload: {
        AlarmName: "Read Latency High - Analytics DB",
        NewStateValue: "ALARM",
        Trigger: {
          MetricName: "ReadLatency",
          Namespace: "AWS/RDS",
        },
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
      owner: "demo",
    } as unknown as Alarm,
    
    // Lambda Alarms
    {
      id: "demo-7",
      organizationId: "demo-org",
      alarmName: "Lambda Function Errors Spiking",
      alarmDescription: "Error rate exceeded 5% threshold",
      state: "ALARM",
      stateReason: "Threshold Crossed: 3 datapoints with error rate above 5%",
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      region: "us-east-1",
      accountId: "123456789012",
      namespace: "AWS/Lambda",
      metricName: "Errors",
      investigationStatus: "PENDING",
      rawPayload: {
        AlarmName: "Lambda Function Errors Spiking",
        NewStateValue: "ALARM",
        Trigger: {
          MetricName: "Errors",
          Namespace: "AWS/Lambda",
        },
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      owner: "demo",
    } as unknown as Alarm,
    {
      id: "demo-8",
      organizationId: "demo-org",
      alarmName: "High Duration - Data Processing Function",
      alarmDescription: "Function duration exceeded 10 second threshold",
      state: "ALARM",
      stateReason: "Threshold Crossed: Average duration at 12.5 seconds",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5).toISOString(),
      region: "us-west-2",
      accountId: "123456789012",
      namespace: "AWS/Lambda",
      metricName: "Duration",
      investigationStatus: "INVESTIGATING",
      rawPayload: {
        AlarmName: "High Duration - Data Processing Function",
        NewStateValue: "ALARM",
        Trigger: {
          MetricName: "Duration",
          Namespace: "AWS/Lambda",
        },
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1.5).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 1.5).toISOString(),
      owner: "demo",
    } as unknown as Alarm,
    {
      id: "demo-9",
      organizationId: "demo-org",
      alarmName: "Throttles Detected - API Gateway Function",
      alarmDescription: "Function throttles exceeded threshold",
      state: "OK",
      stateReason: "Threshold Crossed: Throttles resolved, no throttles in last 10 minutes",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      region: "eu-west-1",
      accountId: "123456789012",
      namespace: "AWS/Lambda",
      metricName: "Throttles",
      investigationStatus: "RESOLVED",
      rawPayload: {
        AlarmName: "Throttles Detected - API Gateway Function",
        NewStateValue: "OK",
        Trigger: {
          MetricName: "Throttles",
          Namespace: "AWS/Lambda",
        },
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      owner: "demo",
    } as unknown as Alarm,
  ];

  // Create initial demo investigations
  // One investigation per alarm (one-to-one relationship)
  const initialInvestigations: Investigation[] = [
    // EC2 Investigations
    {
      id: "inv-1",
      alarmId: "demo-2",
      userId: "demo-user",
      userEmail: "demo@example.com",
      status: "INVESTIGATING",
      notes: "Checking disk usage patterns. Suspecting log file accumulation. Reviewing log rotation policies.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.8).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1.8).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 1.8).toISOString(),
      owner: "demo",
    } as unknown as Investigation,
    {
      id: "inv-2",
      alarmId: "demo-3",
      userId: "demo-user",
      userEmail: "demo@example.com",
      status: "RESOLVED",
      notes: "Identified memory leak in application. Applied patch and restarted services. Memory usage normalized to 65%.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3.5).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3.5).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3.5).toISOString(),
      owner: "demo",
    } as unknown as Investigation,
    
    // RDS Investigations
    {
      id: "inv-3",
      alarmId: "demo-4",
      userId: "demo-user",
      userEmail: "demo@example.com",
      status: "RESOLVED",
      notes: "Increased connection pool size from 50 to 100. Monitoring for stability. No issues observed since change.",
      timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
      owner: "demo",
    } as unknown as Investigation,
    {
      id: "inv-4",
      alarmId: "demo-6",
      userId: "demo-user",
      userEmail: "demo@example.com",
      status: "INVESTIGATING",
      notes: "Analyzing slow query logs. Found several unoptimized queries. Working with dev team to optimize.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 0.8).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 0.8).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 0.8).toISOString(),
      owner: "demo",
    } as unknown as Investigation,
    
    // Lambda Investigations
    {
      id: "inv-5",
      alarmId: "demo-8",
      userId: "demo-user",
      userEmail: "demo@example.com",
      status: "INVESTIGATING",
      notes: "Reviewing function code for performance bottlenecks. Suspecting inefficient data processing algorithm.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.3).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1.3).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 1.3).toISOString(),
      owner: "demo",
    } as unknown as Investigation,
    {
      id: "inv-6",
      alarmId: "demo-9",
      userId: "demo-user",
      userEmail: "demo@example.com",
      status: "RESOLVED",
      notes: "Increased Lambda concurrency limits and optimized function code. Throttles resolved. Function now handling load efficiently.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2.8).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2.8).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2.8).toISOString(),
      owner: "demo",
    } as unknown as Investigation,
  ];

  // Store initial data
  localStorage.setItem(STORAGE_KEYS.ALARMS, JSON.stringify(initialAlarms));
  localStorage.setItem(STORAGE_KEYS.INVESTIGATIONS, JSON.stringify(initialInvestigations));
}

// Alarm operations
export const demoAlarms = {
  list: (): Alarm[] => {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(STORAGE_KEYS.ALARMS);
    if (!data) {
      initializeDemoData();
      return demoAlarms.list();
    }
    const alarms = JSON.parse(data) as Alarm[];
    return alarms.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  },

  get: (id: string): Alarm | null => {
    const alarms = demoAlarms.list();
    return alarms.find((a) => a.id === id) || null;
  },

  update: (id: string, updates: Partial<Alarm>): Alarm | null => {
    const alarms = demoAlarms.list();
    const index = alarms.findIndex((a) => a.id === id);
    if (index === -1) return null;

    const updated = {
      ...alarms[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    alarms[index] = updated;
    localStorage.setItem(STORAGE_KEYS.ALARMS, JSON.stringify(alarms));
    return updated;
  },
};

// Investigation operations
export const demoInvestigations = {
  list: (alarmId?: string): Investigation[] => {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(STORAGE_KEYS.INVESTIGATIONS);
    if (!data) {
      initializeDemoData();
      return demoInvestigations.list(alarmId);
    }
    let investigations = JSON.parse(data) as Investigation[];
    if (alarmId) {
      investigations = investigations.filter((inv) => inv.alarmId === alarmId);
    }
    return investigations.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  },

  create: (investigation: Omit<Investigation, "id" | "createdAt" | "updatedAt">): Investigation => {
    const investigations = demoInvestigations.list();
    const newInvestigation: Investigation = {
      ...investigation,
      id: `inv-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      owner: "demo",
    } as unknown as Investigation;

    investigations.push(newInvestigation);
    localStorage.setItem(STORAGE_KEYS.INVESTIGATIONS, JSON.stringify(investigations));
    return newInvestigation;
  },

  get: (id: string): Investigation | null => {
    const investigations = demoInvestigations.list();
    return investigations.find((inv) => inv.id === id) || null;
  },

  getByAlarmId: (alarmId: string): Investigation | null => {
    const investigations = demoInvestigations.list(alarmId);
    return investigations.length > 0 ? investigations[0] : null;
  },

  update: (id: string, updates: Partial<Investigation>): Investigation | null => {
    const investigations = demoInvestigations.list();
    const index = investigations.findIndex((inv) => inv.id === id);
    if (index === -1) return null;

    const updated = {
      ...investigations[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    investigations[index] = updated;
    localStorage.setItem(STORAGE_KEYS.INVESTIGATIONS, JSON.stringify(investigations));
    return updated;
  },

  updateOrCreate: (
    alarmId: string,
    investigation: Omit<Investigation, "id" | "createdAt" | "updatedAt">
  ): Investigation => {
    const existing = demoInvestigations.getByAlarmId(alarmId);
    
    if (existing) {
      // Update existing investigation
      return demoInvestigations.update(existing.id, {
        ...investigation,
        timestamp: new Date().toISOString(),
      })!;
    } else {
      // Create new investigation
      return demoInvestigations.create(investigation);
    }
  },
};

// Organization operations
export const demoOrganization = {
  get: () => {
    if (typeof window === "undefined") return null;
    const data = localStorage.getItem(STORAGE_KEYS.ORGANIZATION);
    if (data) {
      return JSON.parse(data);
    }
    return {
      id: "demo-org",
      name: "Demo Organization",
      webhookApiKey: "demo_api_key_12345678",
      createdAt: new Date().toISOString(),
      owner: "demo",
    };
  },
};

// Clear all demo data (for resetting demo)
export function clearDemoData() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.ALARMS);
  localStorage.removeItem(STORAGE_KEYS.INVESTIGATIONS);
  localStorage.removeItem(STORAGE_KEYS.ORGANIZATION);
  initializeDemoData();
}

