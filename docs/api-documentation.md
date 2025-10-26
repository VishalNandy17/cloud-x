# D-CloudX API Documentation

## Overview

D-CloudX is a decentralized cloud resource marketplace that enables users to list, discover, and book cloud computing resources from various providers (AWS, Azure, GCP) through a blockchain-based platform.

## Base URL

```
http://localhost:5000/api/v1
```

## Authentication

All API endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Resources

#### List Resources
```http
GET /resources
```

**Query Parameters:**
- `resourceType` (string): Filter by resource type (compute, storage, network)
- `minPrice` (number): Minimum price per hour
- `maxPrice` (number): Maximum price per hour
- `isActive` (boolean): Filter by active status
- `limit` (number): Number of results per page (default: 10)
- `offset` (number): Number of results to skip (default: 0)

**Response:**
```json
{
  "resources": [
    {
      "id": "507f1f77bcf86cd799439011",
      "resourceId": 1,
      "provider": "0x1234567890123456789012345678901234567890",
      "resourceType": "compute",
      "cpu": 4,
      "ram": 8,
      "storage": 100,
      "pricePerHour": 0.1,
      "isActive": true,
      "reputation": 100,
      "metadata": {
        "description": "High-performance compute instance",
        "region": "us-west-2",
        "os": "Ubuntu 20.04"
      },
      "metrics": {
        "cpuUsage": 50,
        "ramUsage": 60,
        "storageUsage": 30,
        "networkUsage": 10,
        "lastUpdated": "2024-01-01T00:00:00.000Z"
      },
      "sla": {
        "uptimeTarget": 99.9,
        "latencyTarget": 100,
        "availabilityTarget": 99.5
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

#### Get Resource by ID
```http
GET /resources/:id
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "resourceId": 1,
  "provider": "0x1234567890123456789012345678901234567890",
  "resourceType": "compute",
  "cpu": 4,
  "ram": 8,
  "storage": 100,
  "pricePerHour": 0.1,
  "isActive": true,
  "reputation": 100,
  "metadata": {
    "description": "High-performance compute instance",
    "region": "us-west-2",
    "os": "Ubuntu 20.04"
  },
  "metrics": {
    "cpuUsage": 50,
    "ramUsage": 60,
    "storageUsage": 30,
    "networkUsage": 10,
    "lastUpdated": "2024-01-01T00:00:00.000Z"
  },
  "sla": {
    "uptimeTarget": 99.9,
    "latencyTarget": 100,
    "availabilityTarget": 99.5
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### Create Resource
```http
POST /resources
```

**Request Body:**
```json
{
  "resourceType": "compute",
  "cpu": 4,
  "ram": 8,
  "storage": 100,
  "pricePerHour": 0.1,
  "metadata": {
    "description": "High-performance compute instance",
    "region": "us-west-2",
    "os": "Ubuntu 20.04"
  }
}
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "resourceId": 1,
  "provider": "0x1234567890123456789012345678901234567890",
  "resourceType": "compute",
  "cpu": 4,
  "ram": 8,
  "storage": 100,
  "pricePerHour": 0.1,
  "isActive": true,
  "reputation": 100,
  "metadata": {
    "description": "High-performance compute instance",
    "region": "us-west-2",
    "os": "Ubuntu 20.04"
  },
  "metrics": {
    "cpuUsage": 0,
    "ramUsage": 0,
    "storageUsage": 0,
    "networkUsage": 0,
    "lastUpdated": "2024-01-01T00:00:00.000Z"
  },
  "sla": {
    "uptimeTarget": 99.9,
    "latencyTarget": 100,
    "availabilityTarget": 99.5
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### Update Resource
```http
PUT /resources/:id
```

**Request Body:**
```json
{
  "pricePerHour": 0.15,
  "metadata": {
    "description": "Updated description"
  }
}
```

#### Update Resource Metrics
```http
PUT /resources/:id/metrics
```

**Request Body:**
```json
{
  "cpuUsage": 75,
  "ramUsage": 80,
  "storageUsage": 45,
  "networkUsage": 25
}
```

#### Delete Resource
```http
DELETE /resources/:id
```

#### Get Resource Analytics
```http
GET /resources/analytics
```

**Response:**
```json
{
  "analytics": [
    {
      "_id": "compute",
      "count": 10,
      "avgPrice": 0.12,
      "avgReputation": 95
    },
    {
      "_id": "storage",
      "count": 5,
      "avgPrice": 0.08,
      "avgReputation": 88
    }
  ]
}
```

### Bookings

#### List Bookings
```http
GET /bookings
```

**Query Parameters:**
- `consumer` (string): Filter by consumer address
- `provider` (string): Filter by provider address
- `status` (string): Filter by status (pending, active, completed, cancelled)
- `limit` (number): Number of results per page (default: 10)
- `offset` (number): Number of results to skip (default: 0)

**Response:**
```json
{
  "bookings": [
    {
      "id": "507f1f77bcf86cd799439011",
      "resourceId": 1,
      "consumer": "0x1234567890123456789012345678901234567890",
      "provider": "0x0987654321098765432109876543210987654321",
      "startTime": "2024-01-01T00:00:00.000Z",
      "endTime": "2024-01-02T00:00:00.000Z",
      "duration": 24,
      "totalCost": 2.4,
      "status": "active",
      "escrowId": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

#### Get Booking by ID
```http
GET /bookings/:id
```

#### Create Booking
```http
POST /bookings
```

**Request Body:**
```json
{
  "resourceId": 1,
  "startTime": "2024-01-01T00:00:00.000Z",
  "duration": 24
}
```

#### Update Booking
```http
PUT /bookings/:id
```

**Request Body:**
```json
{
  "status": "completed"
}
```

#### Cancel Booking
```http
DELETE /bookings/:id
```

### Users

#### List Users
```http
GET /users
```

#### Get User by ID
```http
GET /users/:id
```

#### Create User
```http
POST /users
```

**Request Body:**
```json
{
  "walletAddress": "0x1234567890123456789012345678901234567890",
  "username": "john_doe",
  "email": "john@example.com",
  "password": "secure_password",
  "role": "provider"
}
```

#### Update User
```http
PUT /users/:id
```

#### Delete User
```http
DELETE /users/:id
```

### Cloud Provider Integration

#### Provision Resource
```http
POST /cloud/provision
```

**Request Body:**
```json
{
  "provider": "aws",
  "config": {
    "instanceType": "t3.micro",
    "imageId": "ami-0c02fb55956c7d316",
    "keyName": "my-key",
    "securityGroupIds": ["sg-12345678"],
    "subnetId": "subnet-12345678"
  }
}
```

#### Decommission Resource
```http
DELETE /cloud/:provider/:resourceId
```

#### Get Resource Status
```http
GET /cloud/:provider/:resourceId/status
```

#### Get Resource Metrics
```http
GET /cloud/:provider/:resourceId/metrics
```

**Query Parameters:**
- `startTime` (string): Start time for metrics (ISO 8601)
- `endTime` (string): End time for metrics (ISO 8601)

#### List Resources
```http
GET /cloud/:provider/resources
```

## Error Responses

All error responses follow this format:

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

### Common Error Codes

- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists
- `500 Internal Server Error`: Server error

## Rate Limiting

API requests are rate limited to prevent abuse:

- **General endpoints**: 100 requests per minute
- **Authentication endpoints**: 10 requests per minute
- **Resource creation**: 5 requests per minute

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## WebSocket Events

The API supports real-time updates via WebSocket connections:

### Connection
```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Events

#### Resource Updates
```javascript
socket.on('resource:updated', (data) => {
  console.log('Resource updated:', data);
});
```

#### Booking Updates
```javascript
socket.on('booking:updated', (data) => {
  console.log('Booking updated:', data);
});
```

#### SLA Violations
```javascript
socket.on('sla:violation', (data) => {
  console.log('SLA violation:', data);
});
```

## Blockchain Integration

### Smart Contract Events

The API listens to blockchain events and updates the database accordingly:

- `ResourceListed`: New resource listed on blockchain
- `ResourceBooked`: Resource booked by consumer
- `BookingCompleted`: Booking completed successfully
- `SLAViolation`: SLA violation detected
- `ReputationUpdated`: Provider reputation updated

### Transaction Status

All blockchain transactions are tracked with the following statuses:

- `pending`: Transaction submitted to blockchain
- `confirmed`: Transaction confirmed on blockchain
- `failed`: Transaction failed

## Monitoring and Health Checks

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "blockchain": "healthy"
  }
}
```

### Metrics
```http
GET /metrics
```

Returns Prometheus-compatible metrics for monitoring.

## SDK Examples

### JavaScript/TypeScript

```typescript
import { DCloudXClient } from '@dcloudx/sdk';

const client = new DCloudXClient({
  baseUrl: 'http://localhost:5000/api/v1',
  token: 'your-jwt-token'
});

// List resources
const resources = await client.resources.list({
  resourceType: 'compute',
  minPrice: 0.05,
  maxPrice: 0.2
});

// Create booking
const booking = await client.bookings.create({
  resourceId: 1,
  startTime: new Date(),
  duration: 24
});
```

### Python

```python
from dcloudx import DCloudXClient

client = DCloudXClient(
    base_url='http://localhost:5000/api/v1',
    token='your-jwt-token'
)

# List resources
resources = client.resources.list(
    resource_type='compute',
    min_price=0.05,
    max_price=0.2
)

# Create booking
booking = client.bookings.create(
    resource_id=1,
    start_time=datetime.now(),
    duration=24
)
```

## Support

For API support and questions:

- **Documentation**: [https://docs.dcloudx.com](https://docs.dcloudx.com)
- **GitHub**: [https://github.com/dcloudx/api](https://github.com/dcloudx/api)
- **Discord**: [https://discord.gg/dcloudx](https://discord.gg/dcloudx)
- **Email**: support@dcloudx.com
