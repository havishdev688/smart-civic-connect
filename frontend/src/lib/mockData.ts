import { Complaint, Department } from '../types';

export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'dept-roads', name: 'Roads & Asphalt', code: 'ROADS_ASPHALT', icon: 'HardHat', description: 'Potholes, broken tar, pavement damage & footpath repairs.', slaHours: 48, activeComplaints: 0, totalResolved: 0 },
  { id: 'dept-water', name: 'Water Supply', code: 'WATER_SUPPLY', icon: 'Droplets', description: 'Pipeline bursts, contaminated water & emergency tanker requests.', slaHours: 24, activeComplaints: 0, totalResolved: 0 },
  { id: 'dept-sanitation', name: 'Sanitation & Health', code: 'SANITATION_HEALTH', icon: 'Trash2', description: 'Garbage dump clearing, street sweeping & vector control.', slaHours: 24, activeComplaints: 0, totalResolved: 0 },
  { id: 'dept-electrical', name: 'Street Lighting', code: 'STREET_LIGHTING', icon: 'Zap', description: 'Dark streets, non-functional LED poles & loose wiring.', slaHours: 12, activeComplaints: 0, totalResolved: 0 },
];

export const INITIAL_COMPLAINTS: Complaint[] = [];
