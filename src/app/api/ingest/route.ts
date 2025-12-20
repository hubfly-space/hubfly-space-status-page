import { NextResponse } from 'next/server';
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { StatusResponse } from '@/lib/types';
import { sendDiscordNotification } from '@/lib/discord';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { env } = await getCloudflareContext({ async: true });
  
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const upstreamUrl = env.UPSTREAM_STATUS_API_URL;
  if (!upstreamUrl) {
    return NextResponse.json({ error: 'Upstream URL not configured' }, { status: 500 });
  }

  try {
    const response = await fetch(upstreamUrl, {
      headers: {
        'Authorization': `Bearer ${env.CRON_SECRET}` 
      }
    });

    if (!response.ok) {
      throw new Error(`Upstream API error: ${response.status}`);
    }

    const data: StatusResponse = await response.json();
    const timestamp = Date.now();
    const db = env.DB;

    for (const region of data.regions) {
      for (const service of region.services) {
        // Get last check for this service
        const lastCheck = await db.prepare(
          `SELECT status, timestamp FROM checks WHERE service_id = ? ORDER BY timestamp DESC LIMIT 1`
        ).bind(service.id).first<{ status: string; timestamp: number }>();

        // Insert new check
        await db.prepare(
          `INSERT INTO checks (timestamp, region_id, region_name, service_id, service_name, status, status_code, latency, error)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          timestamp,
          region.id,
          region.name,
          service.id,
          service.name,
          service.status,
          service.statusCode,
          service.latency,
          service.error || null
        ).run();

        // Handle Notifications
        if (lastCheck) {
          if (lastCheck.status !== 'down' && service.status === 'down') {
            // Service went DOWN
            await sendDiscordNotification(
              env.DISCORD_WEBHOOK_URL,
              'DOWN',
              service.name,
              region.name,
              { error: service.error || 'Unknown error', time: new Date().toISOString() }
            );
          } else if (lastCheck.status === 'down' && service.status !== 'down') {
            // Service RECOVERED
            // Find start of downtime
             const startOfDowntime = await db.prepare(
              `SELECT timestamp FROM checks 
               WHERE service_id = ? AND status != 'down' 
               ORDER BY timestamp DESC LIMIT 1`
             ).bind(service.id).first<{ timestamp: number }>();
             
             let durationStr = 'Unknown';
             if (startOfDowntime) {
                const downStart = startOfDowntime.timestamp;
                const diff = timestamp - downStart;
                const minutes = Math.floor(diff / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                durationStr = `${minutes}m ${seconds}s`;
             }

            await sendDiscordNotification(
              env.DISCORD_WEBHOOK_URL,
              'RECOVERED',
              service.name,
              region.name,
              { duration: durationStr, time: new Date().toISOString() }
            );
          }
        }
      }
    }

    return NextResponse.json({ success: true, processed: data.regions.length });
  } catch (error: unknown) {
    console.error('Ingest error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
