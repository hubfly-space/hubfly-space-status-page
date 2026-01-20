-- Migration number: 0002 	 2025-01-12T00:00:00.000Z
CREATE TABLE IF NOT EXISTS incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id TEXT NOT NULL,
    service_name TEXT NOT NULL,
    region_id TEXT NOT NULL,
    region_name TEXT NOT NULL,
    started_at INTEGER NOT NULL,
    resolved_at INTEGER,
    last_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_incidents_service_open ON incidents(service_id, resolved_at);
CREATE INDEX IF NOT EXISTS idx_incidents_started_at ON incidents(started_at DESC);
