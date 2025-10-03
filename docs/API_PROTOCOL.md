# RoleSwitch Plugin REST API Protocol

This document defines the REST API protocol for the RoleSwitch Obsidian plugin, allowing external applications to interact with the plugin's functionality.

## Overview

The RoleSwitch API provides programmatic access to:
- Current plugin status and active sessions
- Role management (create, read, update, delete roles)
- Session management (start, switch, end sessions)
- Notes management for sessions
- Event tracking and analytics

## Configuration

### API Settings

To enable the API, configure the following settings in the plugin:

```json
{
  "enableApi": true,
  "apiPort": 3030
}
```

### Starting the API Server

The API server can be started:
1. Automatically when the plugin loads (if `enableApi` is true)
2. Using the command palette: "RoleSwitch: Start API server"
3. Programmatically via the plugin API

## Base URL

When running locally, the API is available at:
```
http://localhost:3030/api
```

## Authentication

Currently, the API does not require authentication. All endpoints are publicly accessible when the server is running.

⚠️ **Security Note**: The API should only be used in trusted environments. Consider implementing authentication before deploying in production environments.

## Response Format

All API responses follow this standard format:

```json
{
  "success": boolean,
  "data": any,
  "error": string,
  "message": string
}
```

- `success`: Indicates if the request was successful
- `data`: Contains the response data (present on successful requests)
- `error`: Contains error details (present on failed requests)
- `message`: Contains additional information or success messages

## HTTP Status Codes

- `200`: Successful GET, PUT, DELETE requests
- `201`: Successful POST requests (resource created)
- `400`: Bad request (validation errors, missing parameters)
- `404`: Resource not found
- `500`: Internal server error

## CORS Support

The API includes CORS headers allowing cross-origin requests:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

## API Endpoints

### Status Endpoints

#### Get Current Status
```http
GET /api/status
```

Returns the current plugin status including active role, session, and lock information.

**Response:**
```json
{
  "success": true,
  "data": {
    "isActive": true,
    "currentRole": {
      "id": "role-123",
      "name": "Developer",
      "colorHex": "#3498db",
      "description": "Development work",
      "icon": "code"
    },
    "currentSession": {
      "id": "session-456",
      "roleId": "role-123",
      "startAt": "2023-12-07T10:00:00.000Z",
      "duration": 3600
    },
    "isLocked": true,
    "lockTimeRemaining": 120
  }
}
```

### Role Management

#### List All Roles
```http
GET /api/roles
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "role-123",
      "name": "Developer",
      "colorHex": "#3498db",
      "description": "Development work",
      "icon": "code"
    }
  ]
}
```

#### Get Single Role
```http
GET /api/roles/{roleId}
```

**Parameters:**
- `roleId` (path): The unique identifier of the role

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "role-123",
    "name": "Developer",
    "colorHex": "#3498db",
    "description": "Development work",
    "icon": "code"
  }
}
```

#### Create New Role
```http
POST /api/roles
```

**Request Body:**
```json
{
  "name": "Writer",
  "colorHex": "#e74c3c",
  "description": "Writing and content creation",
  "icon": "edit"
}
```

**Required Fields:**
- `name`: Role name (string)
- `colorHex`: Hex color code (string)

**Optional Fields:**
- `description`: Role description (string)
- `icon`: Icon identifier (string)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "role-789",
    "name": "Writer",
    "colorHex": "#e74c3c",
    "description": "Writing and content creation",
    "icon": "edit"
  },
  "message": "Role created successfully"
}
```

#### Update Role
```http
PUT /api/roles/{roleId}
```

**Parameters:**
- `roleId` (path): The unique identifier of the role

**Request Body:**
```json
{
  "name": "Senior Developer",
  "description": "Advanced development work"
}
```

All fields are optional. Only provided fields will be updated.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "role-123",
    "name": "Senior Developer",
    "colorHex": "#3498db",
    "description": "Advanced development work",
    "icon": "code"
  },
  "message": "Role updated successfully"
}
```

#### Delete Role
```http
DELETE /api/roles/{roleId}
```

**Parameters:**
- `roleId` (path): The unique identifier of the role

**Response:**
```json
{
  "success": true,
  "message": "Role deleted successfully"
}
```

### Session Management

#### Start Session
```http
POST /api/sessions/start
```

**Request Body:**
```json
{
  "roleId": "role-123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Session started successfully"
}
```

#### Switch Session
```http
POST /api/sessions/switch
```

**Request Body:**
```json
{
  "roleId": "role-789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Session switched successfully"
}
```

**Error Response (if session is locked):**
```json
{
  "success": false,
  "error": "Session is locked for 120 more seconds"
}
```

#### End Current Session
```http
POST /api/sessions/end
```

**Response:**
```json
{
  "success": true,
  "message": "Session ended successfully"
}
```

#### Get Sessions
```http
GET /api/sessions
```

**Query Parameters:**
- `startDate` (optional): Filter sessions from this date (ISO 8601 format)
- `endDate` (optional): Filter sessions until this date (ISO 8601 format)
- `roleId` (optional): Filter sessions by role ID

**Example:**
```http
GET /api/sessions?startDate=2023-12-01T00:00:00.000Z&roleId=role-123
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "session-456",
      "roleId": "role-123",
      "startAt": "2023-12-07T10:00:00.000Z",
      "endAt": "2023-12-07T12:00:00.000Z",
      "notes": [
        {
          "id": "note-789",
          "text": "Implemented user authentication",
          "createdAt": "2023-12-07T11:00:00.000Z"
        }
      ]
    }
  ]
}
```

### Notes Management

#### Add Note to Session
```http
POST /api/notes
```

**Request Body:**
```json
{
  "sessionId": "session-456",
  "text": "Fixed bug in user login flow"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "note-101",
    "text": "Fixed bug in user login flow",
    "createdAt": "2023-12-07T14:30:00.000Z"
  },
  "message": "Note added successfully"
}
```

#### Update Note
```http
PUT /api/notes/{noteId}
```

**Parameters:**
- `noteId` (path): The unique identifier of the note

**Request Body:**
```json
{
  "text": "Fixed critical bug in user login flow"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Note updated successfully"
}
```

#### Delete Note
```http
DELETE /api/notes/{noteId}
```

**Parameters:**
- `noteId` (path): The unique identifier of the note

**Response:**
```json
{
  "success": true,
  "message": "Note deleted successfully"
}
```

### Events

#### Get Events
```http
GET /api/events
```

**Query Parameters:**
- `startDate` (optional): Filter events from this date (ISO 8601 format)
- `endDate` (optional): Filter events until this date (ISO 8601 format)
- `roleId` (optional): Filter events by role ID
- `type` (optional): Filter by event type (`start`, `end`, `switch`, `cancelTransition`)

**Example:**
```http
GET /api/events?type=start&roleId=role-123
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "event-123",
      "type": "start",
      "roleId": "role-123",
      "at": "2023-12-07T10:00:00.000Z",
      "meta": {
        "sessionId": "session-456"
      }
    }
  ]
}
```

### Analytics

#### Get Analytics
```http
GET /api/analytics
```

**Query Parameters:**
- `startDate` (optional): Start date for analytics period (ISO 8601 format)
- `endDate` (optional): End date for analytics period (ISO 8601 format)

**Example:**
```http
GET /api/analytics?startDate=2023-12-01T00:00:00.000Z&endDate=2023-12-07T23:59:59.999Z
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSessions": 15,
    "totalTime": 28800,
    "roleBreakdown": [
      {
        "roleId": "role-123",
        "roleName": "Developer",
        "sessionCount": 8,
        "totalTime": 18000,
        "percentage": 62.5
      },
      {
        "roleId": "role-789",
        "roleName": "Writer",
        "sessionCount": 7,
        "totalTime": 10800,
        "percentage": 37.5
      }
    ],
    "dailyBreakdown": [
      {
        "date": "2023-12-01",
        "totalTime": 7200,
        "sessionCount": 3
      },
      {
        "date": "2023-12-02",
        "totalTime": 5400,
        "sessionCount": 2
      }
    ]
  }
}
```

## Error Handling

### Common Error Responses

**Role Not Found:**
```json
{
  "success": false,
  "error": "Role not found"
}
```

**Session Locked:**
```json
{
  "success": false,
  "error": "Session is locked for 120 more seconds"
}
```

**Missing Required Field:**
```json
{
  "success": false,
  "error": "Role ID is required"
}
```

**Server Not Running:**
```json
{
  "success": false,
  "error": "API server not initialized"
}
```

## Example Usage

### JavaScript/Node.js

```javascript
// Get current status
const response = await fetch('http://localhost:3030/api/status');
const status = await response.json();

if (status.success) {
  console.log('Current role:', status.data.currentRole?.name);
  console.log('Session duration:', status.data.currentSession?.duration, 'seconds');
}

// Create a new role
const newRole = await fetch('http://localhost:3030/api/roles', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Designer',
    colorHex: '#9b59b6',
    description: 'UI/UX design work',
    icon: 'palette'
  })
});

const roleResult = await newRole.json();
if (roleResult.success) {
  console.log('Created role:', roleResult.data.name);
}

// Start a session
const startSession = await fetch('http://localhost:3030/api/sessions/start', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    roleId: roleResult.data.id
  })
});

const sessionResult = await startSession.json();
console.log('Session started:', sessionResult.success);
```

### Python

```python
import requests
import json

BASE_URL = 'http://localhost:3030/api'

# Get current status
response = requests.get(f'{BASE_URL}/status')
status = response.json()

if status['success']:
    current_role = status['data'].get('currentRole')
    if current_role:
        print(f"Current role: {current_role['name']}")

# Create a new role
new_role_data = {
    'name': 'Researcher',
    'colorHex': '#2ecc71',
    'description': 'Research and analysis work',
    'icon': 'search'
}

response = requests.post(f'{BASE_URL}/roles', json=new_role_data)
role_result = response.json()

if role_result['success']:
    print(f"Created role: {role_result['data']['name']}")

    # Start a session with the new role
    session_data = {'roleId': role_result['data']['id']}
    session_response = requests.post(f'{BASE_URL}/sessions/start', json=session_data)

    if session_response.json()['success']:
        print("Session started successfully")
```

### cURL Examples

```bash
# Get current status
curl -X GET http://localhost:3030/api/status

# Create a new role
curl -X POST http://localhost:3030/api/roles \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Analyst",
    "colorHex": "#f39c12",
    "description": "Data analysis work",
    "icon": "chart"
  }'

# Start a session
curl -X POST http://localhost:3030/api/sessions/start \
  -H "Content-Type: application/json" \
  -d '{"roleId": "role-123"}'

# Get analytics for the last week
curl -X GET "http://localhost:3030/api/analytics?startDate=2023-12-01T00:00:00.000Z&endDate=2023-12-07T23:59:59.999Z"
```

## Integration Examples

### Task Management Integration

```javascript
// Example: Automatically start/switch roles based on task assignments
class TaskRoleIntegration {
  constructor(apiUrl = 'http://localhost:3030/api') {
    this.apiUrl = apiUrl;
    this.roleMapping = {
      'development': 'role-dev-123',
      'writing': 'role-writer-456',
      'design': 'role-design-789'
    };
  }

  async switchToTaskRole(taskType) {
    const roleId = this.roleMapping[taskType];
    if (!roleId) {
      console.warn(`No role mapping found for task type: ${taskType}`);
      return;
    }

    try {
      const response = await fetch(`${this.apiUrl}/sessions/switch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId })
      });

      const result = await response.json();
      if (result.success) {
        console.log(`Switched to ${taskType} role`);
      } else {
        console.error(`Failed to switch role: ${result.error}`);
      }
    } catch (error) {
      console.error('API request failed:', error);
    }
  }

  async logTaskCompletion(taskDescription) {
    // Get current session
    const statusResponse = await fetch(`${this.apiUrl}/status`);
    const status = await statusResponse.json();

    if (status.success && status.data.currentSession) {
      // Add note to current session
      await fetch(`${this.apiUrl}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: status.data.currentSession.id,
          text: `Completed task: ${taskDescription}`
        })
      });
    }
  }
}

// Usage
const integration = new TaskRoleIntegration();
await integration.switchToTaskRole('development');
await integration.logTaskCompletion('Implemented user authentication feature');
```

### Time Tracking Dashboard

```javascript
// Example: Build a dashboard showing role-based time tracking
class RoleTrackingDashboard {
  constructor(apiUrl = 'http://localhost:3030/api') {
    this.apiUrl = apiUrl;
  }

  async getDashboardData(days = 7) {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

    try {
      // Get analytics and sessions
      const [analyticsResponse, sessionsResponse] = await Promise.all([
        fetch(`${this.apiUrl}/analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
        fetch(`${this.apiUrl}/sessions?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
      ]);

      const analytics = await analyticsResponse.json();
      const sessions = await sessionsResponse.json();

      return {
        analytics: analytics.data,
        sessions: sessions.data,
        summary: this.generateSummary(analytics.data)
      };
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      return null;
    }
  }

  generateSummary(analytics) {
    const hoursWorked = Math.round(analytics.totalTime / 3600 * 100) / 100;
    const avgSessionDuration = analytics.totalSessions > 0
      ? Math.round(analytics.totalTime / analytics.totalSessions / 60)
      : 0;

    return {
      hoursWorked,
      avgSessionDuration,
      topRole: analytics.roleBreakdown[0]?.roleName || 'None',
      productivity: this.calculateProductivity(analytics)
    };
  }

  calculateProductivity(analytics) {
    // Simple productivity calculation based on session consistency
    const dailyVariance = this.calculateDailyVariance(analytics.dailyBreakdown);
    return Math.max(0, 100 - dailyVariance);
  }

  calculateDailyVariance(dailyBreakdown) {
    if (dailyBreakdown.length === 0) return 100;

    const times = dailyBreakdown.map(day => day.totalTime / 3600);
    const mean = times.reduce((sum, time) => sum + time, 0) / times.length;
    const variance = times.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / times.length;

    return Math.sqrt(variance) * 10; // Scale variance to percentage
  }
}

// Usage
const dashboard = new RoleTrackingDashboard();
const data = await dashboard.getDashboardData(7);
console.log(`Worked ${data.summary.hoursWorked} hours this week`);
console.log(`Top role: ${data.summary.topRole}`);
console.log(`Productivity score: ${data.summary.productivity}%`);
```

## Best Practices

1. **Error Handling**: Always check the `success` field in API responses
2. **Rate Limiting**: Be mindful of request frequency to avoid overwhelming the plugin
3. **Session Management**: Check session lock status before attempting to switch roles
4. **Data Validation**: Validate input data before sending requests
5. **Connection Handling**: Implement proper connection error handling and retries
6. **Security**: Only use the API in trusted environments

## Troubleshooting

### Common Issues

1. **API Server Not Starting**
   - Check if the port is already in use
   - Ensure `enableApi` is set to `true` in plugin settings
   - Verify plugin is loaded and running

2. **Connection Refused**
   - Confirm API server is running
   - Check the port number in settings
   - Verify firewall settings

3. **CORS Errors**
   - API includes CORS headers, but some browsers may still block requests
   - Try using a local proxy or server for complex integrations

4. **Session Lock Errors**
   - Wait for the lock timeout to expire
   - Or end the current session before switching

## Limitations

- The API server runs only while Obsidian is open and the plugin is active
- No built-in authentication or authorization
- Limited to local network access (localhost)
- Session data is stored in Obsidian's plugin data directory
- API server stops when plugin is disabled or Obsidian is closed

## Future Enhancements

Potential future improvements to the API:

1. **Authentication**: JWT or API key-based authentication
2. **Webhooks**: Event notifications for external systems
3. **Real-time Updates**: WebSocket support for live session updates
4. **Bulk Operations**: Batch endpoints for multiple operations
5. **Export/Import**: Endpoints for data backup and migration
6. **Advanced Analytics**: More detailed analytics and reporting endpoints