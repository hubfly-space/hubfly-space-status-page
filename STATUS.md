# Hubfly Status API Documentation

## Overview
The Status API (`GET /api/status`) serves as the central health monitoring endpoint for the Hubfly infrastructure. It performs real-time connectivity and health checks on critical services across configured regions.

## Authentication
This endpoint is protected to prevent unauthorized access and resource abuse. It requires the `CRON_SECRET` environment variable to be passed as a Bearer token.

**Request Header:**
```http
Authorization: Bearer <CRON_SECRET>
```

## Functionality
1.  **Multi-Region Monitoring:** Iterates through all regions and services defined in `lib/status-config.ts`.
2.  **Health Verification:** Sends HTTP GET requests to specific health endpoints (e.g., `/healthz`, `/_ping`) for each service.
3.  **Latency Tracking:** Measures the response time for each check.
4.  **Detailed Reporting:** Returns comprehensive status information including IP addresses and specific error messages if a service is down.

## Response Format

The API returns a JSON object containing the overall system status and a breakdown by region.

**Example Response:**
```json
{
  "status": "operational", // "operational" | "degraded" | "down"
  "timestamp": "2023-12-20T12:00:00.000Z",
  "regions": [
    {
      "id": "primary",
      "name": "Primary Region",
      "status": "operational",
      "ip": "100.106.206.92",
      "services": [
        {
          "id": "hubfly-registry",
          "name": "Hubfly Registry",
          "status": "operational",
          "statusCode": 200,
          "latency": 150, // in milliseconds
          "lastChecked": "2023-12-20T12:00:00.000Z",
          "error": null
        },
        {
          "id": "docker-engine",
          "name": "Docker Engine",
          "status": "down",
          "statusCode": 500,
          "latency": 5002,
          "lastChecked": "2023-12-20T12:00:00.000Z",
          "error": "HTTP Status 500: Internal Server Error"
        }
      ]
    }
  ]
}
```
Regions will be many and services will be many too. thats just an example with structure

## Status Definitions
*   **Operational:** All services in the region/system are responding successfully (2xx status codes or configured success codes).
*   **Degraded:** Some, but not all, services are down.
*   **Down:** All services in the region/system are unreachable or failing.

## Current Configuration
The following services are currently monitored in the **Primary Region**:
*   **Hubfly Registry:** Port 32768 (`/v2/`)
*   **Hubfly Primary Proxy:** Port 80
*   **Prometheus:** Port 9090 (`/-/healthy`)
*   **Grafana:** Port 3000 (`/api/health`)
*   **Hubfly Builder:** Port 8781 (`/healthz`)
*   **Hubfly Storage:** Port 8203 (`/health`)
*   **Docker Engine:** Port 2375 (`/_ping`)
*   **cAdvisor:** Port 8080 (`/healthz`)
