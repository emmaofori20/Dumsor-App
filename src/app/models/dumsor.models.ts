export type PowerGroup = 'A' | 'B' | 'C';
export type PowerStatus = 'ON' | 'OFF';
export type Confidence = 'Low' | 'Medium' | 'High';

export interface Area {
  id: string;
  name: string;
  region: string;
  group: PowerGroup;
  keywords: string[];
  popularScore: number;
  latitude?: number;
  longitude?: number;
}

export interface Schedule {
  id: string;
  date: string;
  group: PowerGroup;
  startTime: string;
  endTime: string;
  status: 'OFF';
}

export interface PowerWindow {
  date: string;
  group: PowerGroup;
  start: Date;
  end: Date;
  startLabel: string;
  endLabel: string;
  startBuffer: string;
  endBuffer: string;
}

export interface AreaStatus {
  area: Area;
  status: PowerStatus;
  currentOutage?: PowerWindow;
  nextOutage: PowerWindow;
  nextRestoration: Date;
  restorationLabel: string;
}

export interface PowerReport {
  areaId: string;
  areaName: string;
  group: PowerGroup;
  status: PowerStatus;
  comment: string;
  createdAt: Date;
  deviceId: string;
}

export interface CommunitySummary {
  areaId: string;
  onCount: number;
  offCount: number;
  lastReportedAt?: Date;
  confidence: Confidence;
}

export interface MissingAreaReport {
  query: string;
  createdAt: Date;
  deviceId: string;
}
