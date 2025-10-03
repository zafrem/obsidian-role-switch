# API Authentication and Synchronization

This document describes the two-way authentication system and cross-device synchronization features added to the RoleSwitch plugin.

## Overview

The RoleSwitch plugin now supports:

1. **API Key Authentication** - Secure access to the REST API
2. **Two-way Authentication** - Cryptographic signatures for secure communication
3. **Cross-Device Synchronization** - Automatic syncing of roles, sessions, and events

## API Authentication

### Enabling Authentication

1. Go to Settings → RoleSwitch → API Settings
2. Enable "Enable API"
3. Enable "Enable Authentication" (recommended)
4. Generate API keys for your applications

### API Key Types

Three permission levels are available:

- **Read Only**: View roles, sessions, events, and analytics
- **Read/Write**: Modify roles and sessions, add notes
- **Admin**: Full access including API key management

### API Key Management

#### Generate API Key
```bash
POST /api/auth/keys
Content-Type: application/json
Authorization: Bearer <admin-key>

{
  "name": "My Application",
  "permissions": ["write"]
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "key-12345",
    "name": "My Application",
    "key": "abcd1234...",
    "secret": "xyz789...",
    "permissions": ["write"],
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Using API Keys

Three methods to authenticate:

1. **Bearer Token** (Simple):
```bash
Authorization: Bearer <api-key>
```

2. **API Key Header**:
```bash
X-API-Key: <api-key>
```

3. **Signed Requests** (Most Secure):
```bash
X-API-Key: <api-key>
X-Timestamp: <unix-timestamp-ms>
X-Signature: <hmac-signature>
```

### Two-Way Authentication

For maximum security, use signed requests:

1. **Create Payload**: `timestamp + request_body`
2. **Generate Signature**: HMAC-like hash using API secret
3. **Send Headers**: Include API key, timestamp, and signature

Example:
```javascript
const timestamp = Date.now().toString();
const payload = timestamp + JSON.stringify(requestBody);
const signature = generateHMACSignature(payload, apiSecret);

const headers = {
  'X-API-Key': apiKey,
  'X-Timestamp': timestamp,
  'X-Signature': signature,
  'Content-Type': 'application/json'
};
```

## Cross-Device Synchronization

### Setup

1. Go to Settings → RoleSwitch → Synchronization Settings
2. Set a device name for identification
3. Enable "Enable Sync"
4. Configure sync interval (1-60 minutes)

### Adding Sync Endpoints

Each device can sync with multiple other RoleSwitch instances:

1. Generate an API key with appropriate permissions
2. Add sync endpoint with:
   - **Name**: Descriptive name (e.g., "Home Computer")
   - **URL**: Full API URL (e.g., "http://192.168.1.100:3030")
   - **API Key**: Select from generated keys
   - **Direction**: Push, Pull, or Bidirectional

### Sync Directions

- **Push Only**: Send local changes to remote device
- **Pull Only**: Receive changes from remote device
- **Bidirectional**: Both send and receive changes

### Sync Endpoints API

#### Push Data
```bash
POST /api/sync/push
Content-Type: application/json
X-API-Key: <key>

{
  "deviceId": "device-abc123",
  "deviceName": "My Laptop",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "roles": [...],
  "events": [...],
  "state": {...}
}
```

#### Pull Data
```bash
GET /api/sync/pull?since=2024-01-01T00:00:00.000Z&deviceId=device-xyz
X-API-Key: <key>
```

#### Bidirectional Sync
```bash
POST /api/sync/bidirectional
Content-Type: application/json
X-API-Key: <key>

{
  "deviceId": "device-abc123",
  "deviceName": "My Laptop",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "roles": [...],
  "events": [...],
  "state": {...}
}
```

Returns merged data for the requesting device to sync.

## Conflict Resolution

### Data Merging Rules

1. **Roles**: Update existing by ID, add new ones
2. **Events**: Add new events, ignore duplicates by ID
3. **State**: Use most recent active session based on timestamp
4. **Notes**: Merge all notes, no deduplication

### Session State Sync

When multiple devices have active sessions:
- Most recent session timestamp wins
- Role must exist locally to accept state
- Only one active session per device network

## Security Best Practices

1. **Always Use Authentication**: Never disable authentication in production
2. **Limit Permissions**: Use minimum required permissions for each key
3. **Rotate Keys**: Regularly generate new keys and disable old ones
4. **Network Security**: Use HTTPS/SSL for remote endpoints
5. **Monitor Usage**: Check "Last Used" timestamps for suspicious activity

## Monitoring and Troubleshooting

### API Key Status
- View all keys in Settings → API Settings
- Check last used timestamps
- Enable/disable keys as needed

### Sync Status
- View sync endpoint status in Settings
- Test connections with "Test" button
- Manual sync with "Sync Now" button
- Monitor last sync timestamps

### Common Issues

1. **Authentication Failed**: Check API key permissions and expiry
2. **Sync Failed**: Verify network connectivity and endpoint URLs
3. **Signature Invalid**: Ensure clock synchronization between devices
4. **Role Not Found**: Remote role may not exist locally yet

## Example Use Cases

### Home/Work Sync
```
Device A (Home): Push/Pull with Device B (Work)
- Bidirectional sync every 5 minutes
- Share all roles and session history
```

### Team Dashboard
```
Central Server: Pull from multiple team members
- Team members push their data
- Server provides read-only analytics API
```

### Backup Device
```
Primary Device: Push to backup
- One-way sync to backup device
- Backup pulls every 30 minutes
```

## API Reference

See the main API documentation for complete endpoint reference. New authentication endpoints:

- `POST /api/auth/keys` - Generate API key
- `GET /api/auth/keys` - List API keys
- `PUT /api/auth/keys/:id` - Update API key
- `DELETE /api/auth/keys/:id` - Delete API key
- `POST /api/sync/push` - Push sync data
- `GET /api/sync/pull` - Pull sync data
- `POST /api/sync/bidirectional` - Bidirectional sync