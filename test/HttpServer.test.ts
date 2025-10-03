// Unit tests for RoleSwitch HTTP Server

import { RoleSwitchHttpServer, HttpRequest } from '../src/api/HttpServer';
import { RoleSwitchApi } from '../src/api/ApiInterface';
import { MockPlugin, TestUtils, TestRunner } from './TestSetup';

// Test suite for HTTP Server
const runner = new TestRunner();
let mockPlugin: MockPlugin;
let api: RoleSwitchApi;
let server: RoleSwitchHttpServer;

runner.beforeEach(() => {
    mockPlugin = new MockPlugin();
    api = new RoleSwitchApi(mockPlugin, 3030);
    const auth = { authenticateRequest: () => ({ isAuthenticated: true }) } as any;
    server = new RoleSwitchHttpServer(api, auth);
});

// Helper function to create test requests
function createRequest(method: string, url: string, body?: any, headers?: Record<string, string>): HttpRequest {
    return {
        method,
        url,
        headers: headers || { 'Content-Type': 'application/json' },
        body
    };
}

// Test CORS handling
runner.test('handleRequest - returns CORS headers for all requests', async () => {
    const request = createRequest('GET', '/api/status');
    const response = await server.handleRequest(request);

    const corsHeaders = [
        'Access-Control-Allow-Origin',
        'Access-Control-Allow-Methods',
        'Access-Control-Allow-Headers',
        'Content-Type'
    ];

    for (const header of corsHeaders) {
        if (!response.headers[header]) {
            throw new Error(`Expected CORS header "${header}" to be present`);
        }
    }

    if (response.headers['Access-Control-Allow-Origin'] !== '*') {
        throw new Error('Expected Access-Control-Allow-Origin to be "*"');
    }
});

runner.test('handleRequest - handles OPTIONS preflight requests', async () => {
    const request = createRequest('OPTIONS', '/api/roles');
    const response = await server.handleRequest(request);

    if (response.statusCode !== 200) {
        throw new Error(`Expected status 200 for OPTIONS, got ${response.statusCode}`);
    }

    if (response.body !== null) {
        throw new Error('Expected empty body for OPTIONS request');
    }
});

runner.test('handleRequest - returns 404 for unknown endpoints', async () => {
    const request = createRequest('GET', '/api/unknown');
    const response = await server.handleRequest(request);

    if (response.statusCode !== 404) {
        throw new Error(`Expected status 404 for unknown endpoint, got ${response.statusCode}`);
    }

    if (!response.body.error?.includes('Endpoint not found')) {
        throw new Error('Expected "Endpoint not found" error message');
    }
});

runner.test('handleRequest - returns 500 for server errors', async () => {
    // Create a request that will cause an error by using invalid body
    const request = createRequest('POST', '/api/roles', null);
    request.body = undefined; // This should cause validation error

    const response = await server.handleRequest(request);

    if (response.statusCode !== 400) {
        throw new Error(`Expected status 400 for validation error, got ${response.statusCode}`);
    }
});

// Status endpoint tests
runner.test('GET /api/status - returns current status', async () => {
    const request = createRequest('GET', '/api/status');
    const response = await server.handleRequest(request);

    if (response.statusCode !== 200) {
        throw new Error(`Expected status 200, got ${response.statusCode}`);
    }

    if (!response.body.success) {
        throw new Error('Expected successful response');
    }

    if (typeof response.body.data.isActive !== 'boolean') {
        throw new Error('Expected isActive to be a boolean');
    }

    if (typeof response.body.data.isLocked !== 'boolean') {
        throw new Error('Expected isLocked to be a boolean');
    }
});

// Role endpoint tests
runner.test('GET /api/roles - returns all roles', async () => {
    // Setup test roles
    mockPlugin.addTestRole('Developer', '#3498db');
    mockPlugin.addTestRole('Writer', '#e74c3c');

    const request = createRequest('GET', '/api/roles');
    const response = await server.handleRequest(request);

    if (response.statusCode !== 200) {
        throw new Error(`Expected status 200, got ${response.statusCode}`);
    }

    if (!response.body.success) {
        throw new Error('Expected successful response');
    }

    if (!Array.isArray(response.body.data)) {
        throw new Error('Expected data to be an array');
    }

    if (response.body.data.length !== 2) {
        throw new Error(`Expected 2 roles, got ${response.body.data.length}`);
    }
});

runner.test('GET /api/roles/:id - returns specific role', async () => {
    const role = mockPlugin.addTestRole('Developer', '#3498db');

    const request = createRequest('GET', `/api/roles/${role.id}`);
    const response = await server.handleRequest(request);

    if (response.statusCode !== 200) {
        throw new Error(`Expected status 200, got ${response.statusCode}`);
    }

    if (!response.body.success) {
        throw new Error('Expected successful response');
    }

    if (response.body.data.id !== role.id) {
        throw new Error(`Expected role ID ${role.id}, got ${response.body.data.id}`);
    }
});

runner.test('GET /api/roles/:id - returns 400 for non-existent role', async () => {
    const request = createRequest('GET', '/api/roles/non-existent-id');
    const response = await server.handleRequest(request);

    if (response.statusCode !== 400) {
        throw new Error(`Expected status 400, got ${response.statusCode}`);
    }

    if (response.body.success) {
        throw new Error('Expected unsuccessful response');
    }

    if (!response.body.error?.includes('Role not found')) {
        throw new Error('Expected "Role not found" error');
    }
});

runner.test('POST /api/roles - creates new role', async () => {
    const roleData = {
        name: 'Designer',
        colorHex: '#9b59b6',
        description: 'UI/UX design work',
        icon: 'palette'
    };

    const request = createRequest('POST', '/api/roles', roleData);
    const response = await server.handleRequest(request);

    if (response.statusCode !== 201) {
        throw new Error(`Expected status 201, got ${response.statusCode}`);
    }

    if (!response.body.success) {
        throw new Error('Expected successful response');
    }

    if (response.body.data.name !== roleData.name) {
        throw new Error(`Expected name ${roleData.name}, got ${response.body.data.name}`);
    }

    if (response.body.data.colorHex !== roleData.colorHex) {
        throw new Error(`Expected colorHex ${roleData.colorHex}, got ${response.body.data.colorHex}`);
    }
});

runner.test('POST /api/roles - returns 400 for missing body', async () => {
    const request = createRequest('POST', '/api/roles');
    const response = await server.handleRequest(request);

    if (response.statusCode !== 400) {
        throw new Error(`Expected status 400, got ${response.statusCode}`);
    }

    if (!response.body.error?.includes('Request body is required')) {
        throw new Error('Expected "Request body is required" error');
    }
});

runner.test('PUT /api/roles/:id - updates existing role', async () => {
    const role = mockPlugin.addTestRole('Developer', '#3498db');

    const updates = {
        name: 'Senior Developer',
        description: 'Advanced development work'
    };

    const request = createRequest('PUT', `/api/roles/${role.id}`, updates);
    const response = await server.handleRequest(request);

    if (response.statusCode !== 200) {
        throw new Error(`Expected status 200, got ${response.statusCode}`);
    }

    if (!response.body.success) {
        throw new Error('Expected successful response');
    }

    if (response.body.data.name !== updates.name) {
        throw new Error(`Expected updated name ${updates.name}, got ${response.body.data.name}`);
    }
});

runner.test('PUT /api/roles/:id - returns 400 for missing role ID', async () => {
    const request = createRequest('PUT', '/api/roles/', { name: 'New Name' });
    const response = await server.handleRequest(request);

    if (response.statusCode !== 404) {
        throw new Error(`Expected status 404 for malformed URL, got ${response.statusCode}`);
    }
});

runner.test('DELETE /api/roles/:id - deletes existing role', async () => {
    const role = mockPlugin.addTestRole('Developer', '#3498db');

    const request = createRequest('DELETE', `/api/roles/${role.id}`);
    const response = await server.handleRequest(request);

    if (response.statusCode !== 200) {
        throw new Error(`Expected status 200, got ${response.statusCode}`);
    }

    if (!response.body.success) {
        throw new Error('Expected successful response');
    }

    if (!response.body.message?.includes('deleted successfully')) {
        throw new Error('Expected success message');
    }
});

// Session endpoint tests
runner.test('POST /api/sessions/start - starts new session', async () => {
    const role = mockPlugin.addTestRole('Developer', '#3498db');

    const sessionData = { roleId: role.id };
    const request = createRequest('POST', '/api/sessions/start', sessionData);
    const response = await server.handleRequest(request);

    if (response.statusCode !== 200) {
        throw new Error(`Expected status 200, got ${response.statusCode}`);
    }

    if (!response.body.success) {
        throw new Error('Expected successful response');
    }

    if (!response.body.message?.includes('started successfully')) {
        throw new Error('Expected success message');
    }

    // Verify session is active
    const statusRequest = createRequest('GET', '/api/status');
    const statusResponse = await server.handleRequest(statusRequest);
    if (!statusResponse.body.data.isActive) {
        throw new Error('Expected session to be active after starting');
    }
});

runner.test('POST /api/sessions/start - returns 400 for missing roleId', async () => {
    const request = createRequest('POST', '/api/sessions/start', {});
    const response = await server.handleRequest(request);

    if (response.statusCode !== 400) {
        throw new Error(`Expected status 400, got ${response.statusCode}`);
    }

    if (!response.body.error?.includes('Role ID is required')) {
        throw new Error('Expected "Role ID is required" error');
    }
});

runner.test('POST /api/sessions/switch - switches to different role', async () => {
    const role1 = mockPlugin.addTestRole('Developer', '#3498db');
    const role2 = mockPlugin.addTestRole('Writer', '#e74c3c');

    // Start session with first role
    mockPlugin.startSession(role1.id);
    mockPlugin.setSessionLocked(false); // Remove lock for testing

    const sessionData = { roleId: role2.id };
    const request = createRequest('POST', '/api/sessions/switch', sessionData);
    const response = await server.handleRequest(request);

    if (response.statusCode !== 200) {
        throw new Error(`Expected status 200, got ${response.statusCode}`);
    }

    if (!response.body.success) {
        throw new Error('Expected successful response');
    }
});

runner.test('POST /api/sessions/switch - returns 400 when session is locked', async () => {
    const role1 = mockPlugin.addTestRole('Developer', '#3498db');
    const role2 = mockPlugin.addTestRole('Writer', '#e74c3c');

    // Start session and ensure it's locked
    mockPlugin.startSession(role1.id);
    mockPlugin.setSessionLocked(true);

    const sessionData = { roleId: role2.id };
    const request = createRequest('POST', '/api/sessions/switch', sessionData);
    const response = await server.handleRequest(request);

    if (response.statusCode !== 400) {
        throw new Error(`Expected status 400, got ${response.statusCode}`);
    }

    if (!response.body.error?.includes('locked')) {
        throw new Error('Expected error to mention session lock');
    }
});

runner.test('POST /api/sessions/end - ends active session', async () => {
    const role = mockPlugin.addTestRole('Developer', '#3498db');
    mockPlugin.startSession(role.id);

    const request = createRequest('POST', '/api/sessions/end');
    const response = await server.handleRequest(request);

    if (response.statusCode !== 200) {
        throw new Error(`Expected status 200, got ${response.statusCode}`);
    }

    if (!response.body.success) {
        throw new Error('Expected successful response');
    }

    // Verify session is ended
    const statusRequest = createRequest('GET', '/api/status');
    const statusResponse = await server.handleRequest(statusRequest);
    if (statusResponse.body.data.isActive) {
        throw new Error('Expected session to be inactive after ending');
    }
});

runner.test('GET /api/sessions - returns sessions with filters', async () => {
    const role1 = mockPlugin.addTestRole('Developer', '#3498db');
    const role2 = mockPlugin.addTestRole('Writer', '#e74c3c');

    // Create test sessions
    mockPlugin.addTestSession(role1.id);
    mockPlugin.addTestSession(role2.id);

    // Test without filters
    let request = createRequest('GET', '/api/sessions');
    let response = await server.handleRequest(request);

    if (response.statusCode !== 200) {
        throw new Error(`Expected status 200, got ${response.statusCode}`);
    }

    if (response.body.data.length !== 2) {
        throw new Error(`Expected 2 sessions, got ${response.body.data.length}`);
    }

    // Test with role filter
    request = createRequest('GET', `/api/sessions?roleId=${role1.id}`);
    response = await server.handleRequest(request);

    if (response.statusCode !== 200) {
        throw new Error(`Expected status 200 for filtered request, got ${response.statusCode}`);
    }

    if (response.body.data.length !== 1) {
        throw new Error(`Expected 1 filtered session, got ${response.body.data.length}`);
    }

    if (response.body.data[0].roleId !== role1.id) {
        throw new Error('Expected filtered session to match role filter');
    }
});

// Notes endpoint tests
runner.test('POST /api/notes - adds note to session', async () => {
    const role = mockPlugin.addTestRole('Developer', '#3498db');
    const sessionId = mockPlugin.addTestSession(role.id);

    const noteData = {
        sessionId,
        text: 'Fixed authentication bug'
    };

    const request = createRequest('POST', '/api/notes', noteData);
    const response = await server.handleRequest(request);

    if (response.statusCode !== 201) {
        throw new Error(`Expected status 201, got ${response.statusCode}`);
    }

    if (!response.body.success) {
        throw new Error('Expected successful response');
    }

    if (response.body.data.text !== noteData.text) {
        throw new Error(`Expected note text ${noteData.text}, got ${response.body.data.text}`);
    }
});

runner.test('POST /api/notes - returns 400 for missing body', async () => {
    const request = createRequest('POST', '/api/notes');
    const response = await server.handleRequest(request);

    if (response.statusCode !== 400) {
        throw new Error(`Expected status 400, got ${response.statusCode}`);
    }

    if (!response.body.error?.includes('Request body is required')) {
        throw new Error('Expected "Request body is required" error');
    }
});

runner.test('PUT /api/notes/:id - updates existing note', async () => {
    const role = mockPlugin.addTestRole('Developer', '#3498db');
    const sessionId = mockPlugin.addTestSession(role.id);
    const note = mockPlugin.addNote(sessionId, 'Original text');

    const updates = { text: 'Updated text' };
    const request = createRequest('PUT', `/api/notes/${note.id}`, updates);
    const response = await server.handleRequest(request);

    if (response.statusCode !== 200) {
        throw new Error(`Expected status 200, got ${response.statusCode}`);
    }

    if (!response.body.success) {
        throw new Error('Expected successful response');
    }

    if (!response.body.message?.includes('updated successfully')) {
        throw new Error('Expected success message');
    }
});

runner.test('PUT /api/notes/:id - returns 400 for missing note ID', async () => {
    const request = createRequest('PUT', '/api/notes/', { text: 'New text' });
    const response = await server.handleRequest(request);

    if (response.statusCode !== 404) {
        throw new Error(`Expected status 404 for malformed URL, got ${response.statusCode}`);
    }
});

runner.test('DELETE /api/notes/:id - deletes existing note', async () => {
    const role = mockPlugin.addTestRole('Developer', '#3498db');
    const sessionId = mockPlugin.addTestSession(role.id);
    const note = mockPlugin.addNote(sessionId, 'Test note');

    const request = createRequest('DELETE', `/api/notes/${note.id}`);
    const response = await server.handleRequest(request);

    if (response.statusCode !== 200) {
        throw new Error(`Expected status 200, got ${response.statusCode}`);
    }

    if (!response.body.success) {
        throw new Error('Expected successful response');
    }

    if (!response.body.message?.includes('deleted successfully')) {
        throw new Error('Expected success message');
    }
});

// Events endpoint tests
runner.test('GET /api/events - returns all events', async () => {
    const role = mockPlugin.addTestRole('Developer', '#3498db');
    mockPlugin.startSession(role.id);
    mockPlugin.endSession();

    const request = createRequest('GET', '/api/events');
    const response = await server.handleRequest(request);

    if (response.statusCode !== 200) {
        throw new Error(`Expected status 200, got ${response.statusCode}`);
    }

    if (!response.body.success) {
        throw new Error('Expected successful response');
    }

    if (!Array.isArray(response.body.data)) {
        throw new Error('Expected data to be an array');
    }

    if (response.body.data.length !== 2) {
        throw new Error(`Expected 2 events, got ${response.body.data.length}`);
    }
});

runner.test('GET /api/events - filters events by type', async () => {
    const role = mockPlugin.addTestRole('Developer', '#3498db');
    mockPlugin.startSession(role.id);
    mockPlugin.endSession();

    const request = createRequest('GET', '/api/events?type=start');
    const response = await server.handleRequest(request);

    if (response.statusCode !== 200) {
        throw new Error(`Expected status 200, got ${response.statusCode}`);
    }

    if (response.body.data.length !== 1) {
        throw new Error(`Expected 1 start event, got ${response.body.data.length}`);
    }

    if (response.body.data[0].type !== 'start') {
        throw new Error('Expected filtered event to be start type');
    }
});

// Analytics endpoint tests
runner.test('GET /api/analytics - returns comprehensive analytics', async () => {
    const role1 = mockPlugin.addTestRole('Developer', '#3498db');
    const role2 = mockPlugin.addTestRole('Writer', '#e74c3c');

    // Create test sessions
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    mockPlugin.addTestSession(role1.id, twoHoursAgo, oneHourAgo);
    mockPlugin.addTestSession(role2.id, oneHourAgo, now);

    const request = createRequest('GET', '/api/analytics');
    const response = await server.handleRequest(request);

    if (response.statusCode !== 200) {
        throw new Error(`Expected status 200, got ${response.statusCode}`);
    }

    if (!response.body.success) {
        throw new Error('Expected successful response');
    }

    const data = response.body.data;

    if (typeof data.totalSessions !== 'number') {
        throw new Error('Expected totalSessions to be a number');
    }

    if (typeof data.totalTime !== 'number') {
        throw new Error('Expected totalTime to be a number');
    }

    if (!Array.isArray(data.roleBreakdown)) {
        throw new Error('Expected roleBreakdown to be an array');
    }

    if (!Array.isArray(data.dailyBreakdown)) {
        throw new Error('Expected dailyBreakdown to be an array');
    }
});

runner.test('GET /api/analytics - handles date filters', async () => {
    const role = mockPlugin.addTestRole('Developer', '#3498db');

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    mockPlugin.addTestSession(role.id, yesterday, now);

    const startDate = yesterday.toISOString();
    const endDate = now.toISOString();

    const request = createRequest('GET', `/api/analytics?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`);
    const response = await server.handleRequest(request);

    if (response.statusCode !== 200) {
        throw new Error(`Expected status 200, got ${response.statusCode}`);
    }

    if (!response.body.success) {
        throw new Error('Expected successful response');
    }

    if (response.body.data.totalSessions !== 1) {
        throw new Error(`Expected 1 session in date range, got ${response.body.data.totalSessions}`);
    }
});

// Test path parameter extraction
runner.test('Path parameter extraction - handles UUID-like IDs', async () => {
    const role = mockPlugin.addTestRole('Developer', '#3498db');

    // Test with role ID (should be extracted as parameter)
    const request = createRequest('GET', `/api/roles/${role.id}`);
    const response = await server.handleRequest(request);

    if (response.statusCode !== 200) {
        throw new Error(`Expected status 200 for valid role ID, got ${response.statusCode}`);
    }

    if (response.body.data.id !== role.id) {
        throw new Error('Expected correct role ID in response');
    }
});

runner.test('Query parameter extraction - handles multiple parameters', async () => {
    const role1 = mockPlugin.addTestRole('Developer', '#3498db');
    const role2 = mockPlugin.addTestRole('Writer', '#e74c3c');

    mockPlugin.addTestSession(role1.id);
    mockPlugin.addTestSession(role2.id);

    const startDate = '2023-01-01T00:00:00.000Z';
    const endDate = '2023-12-31T23:59:59.999Z';

    const request = createRequest('GET', `/api/sessions?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&roleId=${role1.id}`);
    const response = await server.handleRequest(request);

    if (response.statusCode !== 200) {
        throw new Error(`Expected status 200, got ${response.statusCode}`);
    }

    // Should filter to only role1 sessions
    if (response.body.data.length > 1) {
        throw new Error('Expected query parameters to filter results');
    }
});

// Test error handling
runner.test('Error handling - catches and returns 500 for unexpected errors', async () => {
    // Mock an error in the API by passing invalid data
    const originalGetRoles = api.getRoles;
    api.getRoles = () => {
        throw new Error('Simulated error');
    };

    const request = createRequest('GET', '/api/roles');
    const response = await server.handleRequest(request);

    // Restore original method
    api.getRoles = originalGetRoles;

    if (response.statusCode !== 500) {
        throw new Error(`Expected status 500 for server error, got ${response.statusCode}`);
    }

    if (!response.body.error?.includes('Internal server error')) {
        throw new Error('Expected internal server error message');
    }
});

// Export the test runner
export { runner };

// Run tests if this file is executed directly
if (typeof window === 'undefined' && typeof process !== 'undefined' && require.main === module) {
    runner.run().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    });
}