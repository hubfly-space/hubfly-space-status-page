import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Region, Status } from "./types";

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

export async function getSystemStatus() {
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

  // Group by Region
  const regionsMap = new Map<string, Region>();
  let overallStatus: Status = 'operational';
  let latestTimestamp = 0;

  for (const row of results) {
    if (!regionsMap.has(row.region_id)) {
      regionsMap.set(row.region_id, {
        id: row.region_id,
        name: row.region_name,
        status: 'operational', // Will update
        ip: '', // Not stored in check, maybe irrelevant or needs separate table
        services: []
      });
    }

    const region = regionsMap.get(row.region_id)!;
    
    // Determine Service Status
    const serviceStatus = row.status as Status;
    if (serviceStatus === 'down') {
      overallStatus = 'down'; // If any is down, system is down? Or degraded?
      // Usually if critical is down -> Down. If some -> Degraded.
      // For simplicity: Down.
      region.status = 'degraded'; // Mark region as impacted
    }

    region.services.push({
      id: row.service_id,
      name: row.service_name,
      status: serviceStatus,
      statusCode: row.status_code,
      latency: row.latency,
      lastChecked: new Date(row.timestamp).toISOString(),
      error: row.error
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
    regions: Array.from(regionsMap.values())
  };
}
