-- Migration number: 0001 	 2023-12-21T00:00:00.000Z
CREATE TABLE IF NOT EXISTS checks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL,
    region_id TEXT NOT NULL,
    region_name TEXT NOT NULL,
    service_id TEXT NOT NULL,
    service_name TEXT NOT NULL,
    status TEXT NOT NULL, -- 'operational', 'degraded', 'down'
    status_code INTEGER,
    latency INTEGER,
    error TEXT
);

CREATE INDEX IF NOT EXISTS idx_checks_service_timestamp ON checks(service_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_checks_timestamp ON checks(timestamp DESC);
