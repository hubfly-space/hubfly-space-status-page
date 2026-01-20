import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Region, Status, SystemStatus } from "./types";

interface DBCheckRow {
  region_id: string;
  region_name: string;
  service_id: string;
  service_name: string;
  status: string;
  latency: number;
  status_code: number;
  error: string | null;
  timestamp: number;
}

interface DBIncidentRow {
  id: number;
  service_id: string;
  service_name: string;
  region_id: string;
  region_name: string;
  started_at: number;
  resolved_at: number | null;
  last_error: string | null;
}

export async function getSystemStatus(): Promise<SystemStatus> {
  const { env } = await getCloudflareContext({ async: true });
  const db = env.DB;

  // Get latest checks
  const { results } = await db.prepare(`
    SELECT 
      region_id, region_name, 
      service_id, service_name, 
      status, latency, status_code, error,
      timestamp 
    FROM checks 
    WHERE id IN (
      SELECT MAX(id) FROM checks GROUP BY service_id
    )
    ORDER BY region_name, service_name
  `).all<DBCheckRow>();

  // Get History (Last 45 checks per service)
  // Optimization: Fetch all recent checks and map them in JS to avoid N+1 queries
  // Since D1 doesn't support sophisticated window functions easily in one go with the current schema for all services efficiently without a huge query,
  // we will fetch the last 2000 checks globally (should cover all services for the last hour or so if we have ~40 services)
  // Adjust limit based on service count. 
  const { results: historyResults } = await db.prepare(`
    SELECT service_id, status, latency, timestamp 
    FROM checks 
    WHERE timestamp > ? 
    ORDER BY timestamp ASC
  `).bind(Date.now() - 1000 * 60 * 60 * 2).all<{ service_id: string, status: string, latency: number, timestamp: number }>(); // Last 2 hours

  const historyMap = new Map<string, { status: Status; latency: number; timestamp: number }[]>();
  for (const h of historyResults) {
    if (!historyMap.has(h.service_id)) {
      historyMap.set(h.service_id, []);
    }
    historyMap.get(h.service_id)!.push({
        status: h.status as Status,
        latency: h.latency,
        timestamp: h.timestamp
    });
  }

  const { results: incidentResults } = await db.prepare(`
    SELECT id, service_id, service_name, region_id, region_name, started_at, resolved_at, last_error
    FROM incidents
    ORDER BY resolved_at IS NULL DESC, started_at DESC
    LIMIT 12
  `).all<DBIncidentRow>();

  const incidents = incidentResults.map((incident) => ({
    id: incident.id,
    serviceId: incident.service_id,
    serviceName: incident.service_name,
    regionId: incident.region_id,
    regionName: incident.region_name,
    startedAt: new Date(incident.started_at).toISOString(),
    resolvedAt: incident.resolved_at ? new Date(incident.resolved_at).toISOString() : null,
    lastError: incident.last_error
  }));

  // Group by Region
  const regionsMap = new Map<string, Region>();
  let overallStatus: Status = 'operational';
  let latestTimestamp = 0;

  for (const row of results) {
    if (!regionsMap.has(row.region_id)) {
      regionsMap.set(row.region_id, {
        id: row.region_id,
        name: row.region_name,
        status: 'operational', 
        ip: '', 
        services: []
      });
    }

    const region = regionsMap.get(row.region_id)!;
    
    // Determine Service Status
    const serviceStatus = row.status as Status;
    if (serviceStatus === 'down') {
      overallStatus = 'down'; 
      region.status = 'degraded'; 
    }

    const history = historyMap.get(row.service_id) || [];
    // Take last 45 for UI
    const recentHistory = history.slice(-45);

    region.services.push({
      id: row.service_id,
      name: row.service_name,
      status: serviceStatus,
      statusCode: row.status_code,
      latency: row.latency,
      lastChecked: new Date(row.timestamp).toISOString(),
      error: row.error,
      history: recentHistory
    });

    if (row.timestamp > latestTimestamp) {
      latestTimestamp = row.timestamp;
    }
  }

  // Refine Region Status
  for (const region of regionsMap.values()) {
    const downCount = region.services.filter(s => s.status === 'down').length;
    if (downCount === region.services.length && downCount > 0) {
      region.status = 'down';
    } else if (downCount > 0) {
      region.status = 'degraded';
    }
  }

  // Refine Overall Status
  const allServices = Array.from(regionsMap.values()).flatMap(r => r.services);
  const totalDown = allServices.filter(s => s.status === 'down').length;
  if (totalDown === allServices.length && allServices.length > 0) {
    overallStatus = 'down';
  } else if (totalDown > 0) {
    overallStatus = 'degraded'; // Or partial outage
  }

  return {
    status: overallStatus,
    timestamp: new Date(latestTimestamp).toISOString(),
    regions: Array.from(regionsMap.values()),
    incidents
  };
}
