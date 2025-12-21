-- Seed System Status Data

-- Regions
-- US East (N. Virginia), EU West (London), AP South (Mumbai)

-- Services
-- API Gateway, Authentication Service, Database Cluster, Object Storage

INSERT INTO checks (timestamp, region_id, region_name, service_id, service_name, status, status_code, latency, error) VALUES
-- US East
(1703116800000, 'us-east-1', 'US East (N. Virginia)', 'api-gateway', 'API Gateway', 'operational', 200, 45, NULL),
(1703116800000, 'us-east-1', 'US East (N. Virginia)', 'auth-service', 'Authentication', 'operational', 200, 32, NULL),
(1703116800000, 'us-east-1', 'US East (N. Virginia)', 'db-cluster', 'Database Cluster', 'operational', 200, 15, NULL),
(1703116800000, 'us-east-1', 'US East (N. Virginia)', 'storage', 'Object Storage', 'operational', 200, 89, NULL),

-- EU West
(1703116800000, 'eu-west-2', 'EU West (London)', 'api-gateway', 'API Gateway', 'operational', 200, 55, NULL),
(1703116800000, 'eu-west-2', 'EU West (London)', 'auth-service', 'Authentication', 'operational', 200, 42, NULL),
(1703116800000, 'eu-west-2', 'EU West (London)', 'db-cluster', 'Database Cluster', 'degraded', 200, 250, 'High replication lag'), -- Degraded example
(1703116800000, 'eu-west-2', 'EU West (London)', 'storage', 'Object Storage', 'operational', 200, 95, NULL),

-- AP South
(1703116800000, 'ap-south-1', 'AP South (Mumbai)', 'api-gateway', 'API Gateway', 'operational', 200, 120, NULL),
(1703116800000, 'ap-south-1', 'AP South (Mumbai)', 'auth-service', 'Authentication', 'operational', 200, 98, NULL),
(1703116800000, 'ap-south-1', 'AP South (Mumbai)', 'db-cluster', 'Database Cluster', 'operational', 200, 45, NULL),
(1703116800000, 'ap-south-1', 'AP South (Mumbai)', 'storage', 'Object Storage', 'operational', 200, 150, NULL);

-- Add some history entries for graphs (simplified)
-- Generate 10 points for API Gateway US East
INSERT INTO checks (timestamp, region_id, region_name, service_id, service_name, status, status_code, latency, error) VALUES
(1703116860000, 'us-east-1', 'US East (N. Virginia)', 'api-gateway', 'API Gateway', 'operational', 200, 48, NULL),
(1703116920000, 'us-east-1', 'US East (N. Virginia)', 'api-gateway', 'API Gateway', 'operational', 200, 42, NULL),
(1703116980000, 'us-east-1', 'US East (N. Virginia)', 'api-gateway', 'API Gateway', 'operational', 200, 50, NULL),
(1703117040000, 'us-east-1', 'US East (N. Virginia)', 'api-gateway', 'API Gateway', 'operational', 200, 44, NULL),
(1703117100000, 'us-east-1', 'US East (N. Virginia)', 'api-gateway', 'API Gateway', 'operational', 200, 46, NULL);
