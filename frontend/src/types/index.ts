export type Role = 'CITIZEN' | 'OFFICER' | 'ADMIN';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
export type Status = 'NEW' | 'AI_PROCESSING' | 'ASSIGNED' | 'ACCEPTED' | 'IN_PROGRESS' | 'VERIFICATION' | 'RESOLVED' | 'CLOSED' | 'REOPENED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string;
  departmentId?: string;
  departmentName?: string;
}

export interface Complaint {
  id: string;
  complaintNo: string;
  title: string;
  description: string;
  category: string;
  departmentCode?: string;
  departmentName: string;
  priority: Priority;
  status: Status;
  address: string;
  landmark?: string;
  latitude: number;
  longitude: number;
  citizenName: string;
  citizenPhone?: string;
  estimatedHours: number;
  createdAt: string;
  updatedAt: string;
  images: string[];
  resolutionImages?: string[];
  resolutionRemarks?: string[];
  rating?: number;
  feedbackText?: string;
  aiPrediction?: {
    confidenceScore: number;
    duplicateMatchRatio: number;
    summary?: string;
  };
  statusHistory?: {
    id: string;
    status: Status;
    remarks: string;
    timestamp: string;
  }[];
}

export interface Department {
  id: string;
  name: string;
  code: string;
  icon: string;
  description: string;
  slaHours: number;
  activeComplaints: number;
  totalResolved: number;
}
