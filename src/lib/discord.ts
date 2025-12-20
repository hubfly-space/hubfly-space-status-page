export async function sendDiscordNotification(
  webhookUrl: string,
  type: 'DOWN' | 'RECOVERED',
  serviceName: string,
  regionName: string,
  details: { error?: string; duration?: string; time?: string }
) {
  if (!webhookUrl) {
    console.warn('No Discord webhook URL provided');
    return;
  }

  const color = type === 'DOWN' ? 15158332 : 3066993; // Red or Green
  const title = type === 'DOWN' ? '🔴 Service Down' : '🟢 Service Recovered';
  
  const description = type === 'DOWN'
    ? `**${serviceName}** in **${regionName}** is down.`
    : `**${serviceName}** in **${regionName}** is back online.`;

  const fields = [];
  if (details.error) {
    fields.push({ name: 'Error', value: `\`${details.error}\`` });
  }
  if (details.duration) {
    fields.push({ name: 'Downtime Duration', value: details.duration });
  }
  if (details.time) {
    fields.push({ name: 'Time', value: details.time });
  }

  const payload = {
    embeds: [
      {
        title,
        description,
        color,
        fields,
        footer: {
          text: 'Hubfly Status Monitor',
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error('Failed to send Discord notification:', await res.text());
    }
  } catch (err) {
    console.error('Error sending Discord notification:', err);
  }
}
