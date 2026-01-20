export type Status = 'operational' | 'degraded' | 'down';

export interface Service {
  id: string;
  name: string;
  status: Status;
  statusCode: number;
  latency: number;
  lastChecked: string;
  error: string | null;
  history: { status: Status; latency: number; timestamp: number }[];
}

export interface Region {
  id: string;
  name: string;
  status: Status;
  ip: string;
  services: Service[];
}

export interface Incident {
  id: number;
  serviceId: string;
  serviceName: string;
  regionId: string;
  regionName: string;
  startedAt: string;
  resolvedAt: string | null;
  lastError: string | null;
}

export interface StatusResponse {
  status: Status;
  timestamp: string;
  regions: Region[];
}

export interface SystemStatus extends StatusResponse {
  incidents: Incident[];
}
