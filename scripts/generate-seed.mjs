
import fs from 'fs';

const REGIONS = [
    { id: 'us-east-1', name: 'US East (N. Virginia)' },
    { id: 'eu-west-2', name: 'EU West (London)' },
    { id: 'ap-south-1', name: 'AP South (Mumbai)' }
];

const SERVICES = [
    { id: 'api-gateway', name: 'API Gateway' },
    { id: 'auth-service', name: 'Authentication' },
    { id: 'db-cluster', name: 'Database Cluster' },
    { id: 'storage', name: 'Object Storage' }
];

const NOW = Date.now();
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const START_TIME = NOW - ONE_DAY_MS - (60 * 60 * 1000); // 25 hours ago

let sql = `DELETE FROM checks;\n\n`;

// Helper for random integer
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Generate checks
for (const region of REGIONS) {
    for (const service of SERVICES) {
        let currentTime = START_TIME;

        while (currentTime <= NOW) {
            let status = 'operational';
            let latency = rand(20, 80); // Base latency
            let error = 'NULL';

            // Simulate regional latency differences
            if (region.id === 'ap-south-1') latency += 80;
            if (region.id === 'eu-west-2') latency += 30;

            // Scenario: Database incident in EU West 4 hours ago for 30 mins
            if (region.id === 'eu-west-2' && service.id === 'db-cluster') {
                const fourHoursAgo = NOW - (4 * 60 * 60 * 1000);
                if (currentTime > fourHoursAgo && currentTime < fourHoursAgo + (30 * 60 * 1000)) {
                    status = 'degraded';
                    latency += rand(300, 600);
                    error = "'High CPU Load'";
                }
            }

            // Occasional random spikes
            if (Math.random() > 0.98) {
                latency += rand(100, 300);
            }

            // Create Insert
            sql += `INSERT INTO checks (timestamp, region_id, region_name, service_id, service_name, status, status_code, latency, error) VALUES (${currentTime}, '${region.id}', '${region.name}', '${service.id}', '${service.name}', '${status}', 200, ${latency}, ${error});\n`;

            // Advance time by 5 minutes
            currentTime += 5 * 60 * 1000;
        }
    }
}

fs.writeFileSync('seed.sql', sql);
console.log('Generated seed.sql successfully.');
