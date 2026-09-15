export enum Role {
  CITIZEN = 'CITIZEN',
  OFFICER = 'OFFICER',
  ADMIN = 'ADMIN'
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  EMERGENCY = 'EMERGENCY'
}

export enum Status {
  NEW = 'NEW',
  AI_PROCESSING = 'AI_PROCESSING',
  ASSIGNED = 'ASSIGNED',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  VERIFICATION = 'VERIFICATION',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  REOPENED = 'REOPENED'
}

export interface AIPredictionResult {
  departmentCode: string;
  departmentName: string;
  confidenceScore: number;
  priority: Priority;
  estimatedHours: number;
  duplicateMatchRatio: number;
  similarComplaintIds: string[];
  summary: string;
}

export interface UserPayload {
  id: string;
  email: string;
  role: Role;
  name: string;
  departmentId?: string;
}
