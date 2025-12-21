import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { StatusResponse, Status } from "@/lib/types";
import { sendDiscordNotification } from "@/lib/discord";

// Helper to handle check logic: Notify if changed, then Insert
async function handleServiceCheck(
  db: D1Database,
  webhookUrl: string,
  timestamp: number,
  region: { id: string; name: string },
  service: {
    id: string;
    name: string;
    status: Status;
    statusCode: number;
    latency: number;
    error: string | null;
  }
) {
  // Get last check for this service
  const lastCheck = await db
    .prepare(
      `SELECT status, timestamp FROM checks WHERE service_id = ? ORDER BY timestamp DESC LIMIT 1`
    )
    .bind(service.id)
    .first<{ status: string; timestamp: number }>();

  // Handle Notifications
  if (lastCheck) {
    const wasDown = lastCheck.status === 'down';
    const isDown = service.status === 'down';

    if (!wasDown && isDown) {
      // Service went DOWN
      await sendDiscordNotification(
        webhookUrl,
        'DOWN',
        service.name,
        region.name,
        { error: service.error || 'Unknown error', time: new Date().toISOString() }
      );
    } else if (wasDown && !isDown) {
      // Service RECOVERED
      const lastUpCheck = await db
        .prepare(
          `SELECT timestamp FROM checks 
             WHERE service_id = ? AND status != 'down' 
             ORDER BY timestamp DESC LIMIT 1`
        )
        .bind(service.id)
        .first<{ timestamp: number }>();

      let durationStr = 'Unknown';
      if (lastUpCheck) {
        const diff = timestamp - lastUpCheck.timestamp;
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        if (minutes >= 60) {
          const hours = Math.floor(minutes / 60);
          const mins = minutes % 60;
          durationStr = `${hours}h ${mins}m`;
        } else {
          durationStr = `${minutes}m ${seconds}s`;
        }
      }

      await sendDiscordNotification(
        webhookUrl,
        'RECOVERED',
        service.name,
        region.name,
        { duration: durationStr, time: new Date().toISOString() }
      );
    }
  }

  // Insert new check
  await db
    .prepare(
      `INSERT INTO checks (timestamp, region_id, region_name, service_id, service_name, status, status_code, latency, error)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      timestamp,
      region.id,
      region.name,
      service.id,
      service.name,
      service.status,
      service.statusCode,
      service.latency,
      service.error || null
    )
    .run();
}

export async function GET(request: Request) {
  const { env } = await getCloudflareContext({ async: true });
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const upstreamUrl = env.UPSTREAM_STATUS_API_URL;
  if (!upstreamUrl) {
    return NextResponse.json(
      { error: "Upstream URL not configured" },
      { status: 500 }
    );
  }

  const db = env.DB;
  const timestamp = Date.now();
  const upstreamRegion = { id: 'system-internals', name: 'System Internals' };
  const upstreamServiceId = 'hubfly-upstream-monitor';
  const upstreamServiceName = 'Upstream Monitor';

  let data: StatusResponse | null = null;
  let upstreamError: string | null = null;
  let upstreamStatus: Status = 'operational';
  let upstreamLatency = 0;
  let upstreamStatusCode = 200;

  // 1. Check Upstream Availability
  const start = Date.now();
  try {
    const response = await fetch(upstreamUrl, {
      headers: {
        Authorization: `Bearer ${env.CRON_SECRET}`,
      },
    });
    
    upstreamLatency = Date.now() - start;
    upstreamStatusCode = response.status;

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    data = await response.json();

    // Check for high latency
    if (upstreamLatency > 1500) {
        upstreamStatus = 'degraded';
    }

  } catch (error: unknown) {
    upstreamStatus = 'down';
    upstreamError = error instanceof Error ? error.message : 'Connection failed';
    upstreamStatusCode = 0;
    // Calculate latency even on failure if possible, or just use timeout duration
    upstreamLatency = Date.now() - start;
  }

  // 2. Record Upstream Monitor Status
  await handleServiceCheck(
    db,
    env.DISCORD_WEBHOOK_URL,
    timestamp,
    upstreamRegion,
    {
        id: upstreamServiceId,
        name: upstreamServiceName,
        status: upstreamStatus,
        statusCode: upstreamStatusCode,
        latency: upstreamLatency,
        error: upstreamError
    }
  );

  // 3. Process Downstream Data (if upstream was UP)
  if (data && upstreamStatus !== 'down') {
    try {
        for (const region of data.regions) {
          for (const service of region.services) {
             await handleServiceCheck(db, env.DISCORD_WEBHOOK_URL, timestamp, region, service);
          }
        }
        return NextResponse.json({ success: true, processed: data.regions.length, upstream: 'operational' });
    } catch (err: unknown) {
         console.error("Processing error:", err);
         const msg = err instanceof Error ? err.message : 'Unknown processing error';
         return NextResponse.json({ error: msg }, { status: 500 });
    }
  } else {
    // Upstream was down, we only recorded the monitor check.
    return NextResponse.json({ success: true, upstream: 'down', error: upstreamError });
  }
}