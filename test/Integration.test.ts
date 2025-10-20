// Integration tests for complete API workflows

import { RoleSwitchApi } from '../src/api/ApiInterface';
import { RoleSwitchHttpServer } from '../src/api/HttpServer';
import { AuthService } from '../src/api/AuthService';
import { MockPlugin, TestUtils, TestRunner } from './TestSetup';
import { ApiKey, ApiPermission, Role, Session, Note } from '../src/types';

// Mock auth service for testing - implements only the method needed by HttpServer
class MockAuthService implements Pick<AuthService, 'authenticateRequest'> {
    authenticateRequest(_headers: Record<string, string>, _requiredPermission?: ApiPermission): {
        isAuthenticated: boolean;
        apiKey?: ApiKey;
        error?: string;
    } {
        return { isAuthenticated: true };
    }
}

// Integration test suite
const runner = new TestRunner();
let mockPlugin: MockPlugin;
let api: RoleSwitchApi;
let server: RoleSwitchHttpServer;

runner.beforeEach(() => {
    mockPlugin = new MockPlugin();
    api = new RoleSwitchApi(mockPlugin, 3030);
    const auth = new MockAuthService() as AuthService;
    server = new RoleSwitchHttpServer(api, auth);
});

// Helper function to simulate HTTP requests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function makeRequest(method: string, url: string, body?: any) {
    return await server.handleRequest({
        method,
        url,
        headers: { 'Content-Type': 'application/json' },
        body
    });
}

// Complete role management workflow
runner.test('Complete Role Management Workflow', async () => {
    // 1. Initially no roles
    let response = await makeRequest('GET', '/api/roles');
    if (response.statusCode !== 200 || response.body.data.length !== 0) {
        throw new Error('Expected empty roles list initially');
    }

    // 2. Create first role
    const role1Data = {
        name: 'Developer',
        colorHex: '#3498db',
        description: 'Software development tasks',
        icon: 'code'
    };

    response = await makeRequest('POST', '/api/roles', role1Data);
    if (response.statusCode !== 201 || !response.body.success) {
        throw new Error('Failed to create first role');
    }

    const role1 = response.body.data;
    if (!role1.id || role1.name !== role1Data.name) {
        throw new Error('Created role data mismatch');
    }

    // 3. Create second role
    const role2Data = {
        name: 'Writer',
        colorHex: '#e74c3c',
        description: 'Content creation and writing',
        icon: 'edit'
    };

    response = await makeRequest('POST', '/api/roles', role2Data);
    if (response.statusCode !== 201 || !response.body.success) {
        throw new Error('Failed to create second role');
    }

    const role2 = response.body.data;

    // 4. List all roles (should have 2)
    response = await makeRequest('GET', '/api/roles');
    if (response.statusCode !== 200 || response.body.data.length !== 2) {
        throw new Error('Expected 2 roles in list');
    }

    // 5. Get specific role
    response = await makeRequest('GET', `/api/roles/${role1.id}`);
    if (response.statusCode !== 200 || response.body.data.id !== role1.id) {
        throw new Error('Failed to get specific role');
    }

    // 6. Update role
    const updates = { name: 'Senior Developer', description: 'Advanced development work' };
    response = await makeRequest('PUT', `/api/roles/${role1.id}`, updates);
    if (response.statusCode !== 200 || response.body.data.name !== updates.name) {
        throw new Error('Failed to update role');
    }

    // 7. Verify update persisted
    response = await makeRequest('GET', `/api/roles/${role1.id}`);
    if (response.body.data.name !== updates.name) {
        throw new Error('Role update did not persist');
    }

    // 8. Delete role
    response = await makeRequest('DELETE', `/api/roles/${role2.id}`);
    if (response.statusCode !== 200 || !response.body.success) {
        throw new Error('Failed to delete role');
    }

    // 9. Verify deletion
    response = await makeRequest('GET', '/api/roles');
    if (response.body.data.length !== 1) {
        throw new Error('Role was not deleted');
    }
});

// Complete session management workflow
runner.test('Complete Session Management Workflow', async () => {
    // Setup: Create roles
    const role1Response = await makeRequest('POST', '/api/roles', {
        name: 'Developer',
        colorHex: '#3498db'
    });
    const role2Response = await makeRequest('POST', '/api/roles', {
        name: 'Writer',
        colorHex: '#e74c3c'
    });

    const role1 = role1Response.body.data;
    const role2 = role2Response.body.data;

    // 1. Check initial status (no active session)
    let response = await makeRequest('GET', '/api/status');
    if (response.body.data.isActive) {
        throw new Error('Expected no active session initially');
    }

    // 2. Start session with first role
    response = await makeRequest('POST', '/api/sessions/start', { roleId: role1.id });
    if (response.statusCode !== 200 || !response.body.success) {
        throw new Error('Failed to start session');
    }

    // 3. Verify session is active
    response = await makeRequest('GET', '/api/status');
    if (!response.body.data.isActive || response.body.data.currentRole.id !== role1.id) {
        throw new Error('Session not properly started');
    }

    const session1Duration = response.body.data.currentSession.duration;
    if (typeof session1Duration !== 'number' || session1Duration < 0) {
        throw new Error('Invalid session duration');
    }

    // 4. Wait a moment and check duration increased
    await TestUtils.delay(100);
    response = await makeRequest('GET', '/api/status');
    const session1NewDuration = response.body.data.currentSession.duration;
    if (session1NewDuration <= session1Duration) {
        throw new Error('Session duration should increase over time');
    }

    // 5. Try to switch when locked (should fail)
    response = await makeRequest('POST', '/api/sessions/switch', { roleId: role2.id });
    if (response.statusCode === 200) {
        throw new Error('Session switch should fail when locked');
    }

    // 6. Remove lock and switch successfully
    mockPlugin.setSessionLocked(false);
    response = await makeRequest('POST', '/api/sessions/switch', { roleId: role2.id });
    if (response.statusCode !== 200 || !response.body.success) {
        throw new Error('Failed to switch session');
    }

    // 7. Verify switched to new role
    response = await makeRequest('GET', '/api/status');
    if (response.body.data.currentRole.id !== role2.id) {
        throw new Error('Session did not switch to new role');
    }

    // 8. End session
    response = await makeRequest('POST', '/api/sessions/end');
    if (response.statusCode !== 200 || !response.body.success) {
        throw new Error('Failed to end session');
    }

    // 9. Verify session ended
    response = await makeRequest('GET', '/api/status');
    if (response.body.data.isActive) {
        throw new Error('Session should be inactive after ending');
    }

    // 10. Get session history
    response = await makeRequest('GET', '/api/sessions');
    if (response.statusCode !== 200 || !Array.isArray(response.body.data)) {
        throw new Error('Failed to get session history');
    }

    // Should have sessions from the workflow
    if (response.body.data.length === 0) {
        throw new Error('Expected session history');
    }
});

// Complete notes workflow
runner.test('Complete Notes Workflow', async () => {
    // Setup: Create role and session
    const roleResponse = await makeRequest('POST', '/api/roles', {
        name: 'Developer',
        colorHex: '#3498db'
    });
    const role = roleResponse.body.data;

    await makeRequest('POST', '/api/sessions/start', { roleId: role.id });
    await makeRequest('POST', '/api/sessions/end');

    // Get the session ID from sessions list
    const sessionsResponse = await makeRequest('GET', '/api/sessions');
    const session = sessionsResponse.body.data[0];

    // 1. Add first note
    const note1Data = {
        sessionId: session.id,
        text: 'Implemented user authentication'
    };

    let response = await makeRequest('POST', '/api/notes', note1Data);
    if (response.statusCode !== 201 || !response.body.success) {
        throw new Error('Failed to add first note');
    }

    const note1 = response.body.data;
    if (note1.text !== note1Data.text) {
        throw new Error('Note text mismatch');
    }

    // 2. Add second note
    const note2Data = {
        sessionId: session.id,
        text: 'Fixed login validation bug'
    };

    response = await makeRequest('POST', '/api/notes', note2Data);
    if (response.statusCode !== 201 || !response.body.success) {
        throw new Error('Failed to add second note');
    }

    const note2 = response.body.data;

    // 3. Verify notes are associated with session
    response = await makeRequest('GET', '/api/sessions');
    const updatedSession = response.body.data.find((s: Session) => s.id === session.id);
    if (!updatedSession || updatedSession.notes.length !== 2) {
        throw new Error('Notes not properly associated with session');
    }

    // 4. Update note
    const updateData = { text: 'Implemented secure user authentication with JWT' };
    response = await makeRequest('PUT', `/api/notes/${note1.id}`, updateData);
    if (response.statusCode !== 200 || !response.body.success) {
        throw new Error('Failed to update note');
    }

    // 5. Verify note update
    response = await makeRequest('GET', '/api/sessions');
    const sessionWithUpdatedNote = response.body.data.find((s: Session) => s.id === session.id);
    const updatedNote = sessionWithUpdatedNote.notes.find((n: Note) => n.id === note1.id);
    if (updatedNote.text !== updateData.text) {
        throw new Error('Note update did not persist');
    }

    // 6. Delete note
    response = await makeRequest('DELETE', `/api/notes/${note2.id}`);
    if (response.statusCode !== 200 || !response.body.success) {
        throw new Error('Failed to delete note');
    }

    // 7. Verify note deletion
    response = await makeRequest('GET', '/api/sessions');
    const sessionAfterDeletion = response.body.data.find((s: Session) => s.id === session.id);
    if (sessionAfterDeletion.notes.length !== 1) {
        throw new Error('Note was not deleted');
    }

    const remainingNote = sessionAfterDeletion.notes[0];
    if (remainingNote.id !== note1.id) {
        throw new Error('Wrong note was deleted');
    }
});

// Events and analytics workflow
runner.test('Events and Analytics Workflow', async () => {
    // Setup: Create multiple roles and sessions
    const developerResponse = await makeRequest('POST', '/api/roles', {
        name: 'Developer',
        colorHex: '#3498db'
    });
    const writerResponse = await makeRequest('POST', '/api/roles', {
        name: 'Writer',
        colorHex: '#e74c3c'
    });

    const developer = developerResponse.body.data;
    const writer = writerResponse.body.data;

    // Create multiple sessions with known patterns
    const startTime = new Date();

    // Developer session 1
    await makeRequest('POST', '/api/sessions/start', { roleId: developer.id });
    await TestUtils.delay(50);
    await makeRequest('POST', '/api/sessions/end');

    // Writer session
    mockPlugin.setSessionLocked(false);
    await makeRequest('POST', '/api/sessions/start', { roleId: writer.id });
    await TestUtils.delay(50);
    await makeRequest('POST', '/api/sessions/end');

    // Developer session 2
    mockPlugin.setSessionLocked(false);
    await makeRequest('POST', '/api/sessions/start', { roleId: developer.id });
    await TestUtils.delay(50);
    await makeRequest('POST', '/api/sessions/end');

    // 1. Get all events
    let response = await makeRequest('GET', '/api/events');
    if (response.statusCode !== 200 || !Array.isArray(response.body.data)) {
        throw new Error('Failed to get events');
    }

    const allEvents = response.body.data;
    if (allEvents.length !== 6) { // 3 start + 3 end events
        throw new Error(`Expected 6 events, got ${allEvents.length}`);
    }

    // 2. Filter events by type
    response = await makeRequest('GET', '/api/events?type=start');
    if (response.body.data.length !== 3) {
        throw new Error(`Expected 3 start events, got ${response.body.data.length}`);
    }

    response = await makeRequest('GET', '/api/events?type=end');
    if (response.body.data.length !== 3) {
        throw new Error(`Expected 3 end events, got ${response.body.data.length}`);
    }

    // 3. Filter events by role
    response = await makeRequest('GET', `/api/events?roleId=${developer.id}`);
    const developerEvents = response.body.data;
    if (developerEvents.length !== 4) { // 2 developer sessions = 4 events
        throw new Error(`Expected 4 developer events, got ${developerEvents.length}`);
    }

    response = await makeRequest('GET', `/api/events?roleId=${writer.id}`);
    const writerEvents = response.body.data;
    if (writerEvents.length !== 2) { // 1 writer session = 2 events
        throw new Error(`Expected 2 writer events, got ${writerEvents.length}`);
    }

    // 4. Get comprehensive analytics
    response = await makeRequest('GET', '/api/analytics');
    if (response.statusCode !== 200 || !response.body.success) {
        throw new Error('Failed to get analytics');
    }

    const analytics = response.body.data;

    // Verify analytics structure
    if (analytics.totalSessions !== 3) {
        throw new Error(`Expected 3 total sessions, got ${analytics.totalSessions}`);
    }

    if (typeof analytics.totalTime !== 'number' || analytics.totalTime <= 0) {
        throw new Error('Invalid total time in analytics');
    }

    if (!Array.isArray(analytics.roleBreakdown) || analytics.roleBreakdown.length !== 2) {
        throw new Error('Expected role breakdown for 2 roles');
    }

    if (!Array.isArray(analytics.dailyBreakdown) || analytics.dailyBreakdown.length === 0) {
        throw new Error('Expected daily breakdown data');
    }

    // Verify role breakdown
    interface RoleBreakdown {
        roleId: string;
        roleName: string;
        sessionCount: number;
        totalTime: number;
        percentage: number;
    }
    const devStats = analytics.roleBreakdown.find((r: RoleBreakdown) => r.roleId === developer.id);
    const writerStats = analytics.roleBreakdown.find((r: RoleBreakdown) => r.roleId === writer.id);

    if (!devStats || !writerStats) {
        throw new Error('Missing role statistics');
    }

    if (devStats.sessionCount !== 2) {
        throw new Error(`Expected 2 developer sessions, got ${devStats.sessionCount}`);
    }

    if (writerStats.sessionCount !== 1) {
        throw new Error(`Expected 1 writer session, got ${writerStats.sessionCount}`);
    }

    // Verify percentages add up to 100
    const totalPercentage = analytics.roleBreakdown.reduce((sum: number, role: RoleBreakdown) => sum + role.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.1) {
        throw new Error(`Expected percentages to sum to 100, got ${totalPercentage}`);
    }

    // 5. Test analytics with date filters
    const endTime = new Date();
    response = await makeRequest('GET', `/api/analytics?startDate=${startTime.toISOString()}&endDate=${endTime.toISOString()}`);
    if (response.statusCode !== 200 || response.body.data.totalSessions !== 3) {
        throw new Error('Date-filtered analytics incorrect');
    }

    // Test narrow date range (should have no sessions)
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    response = await makeRequest('GET', `/api/analytics?startDate=${futureDate.toISOString()}`);
    if (response.body.data.totalSessions !== 0) {
        throw new Error('Future date filter should return no sessions');
    }
});

// Error handling and edge cases
runner.test('Error Handling and Edge Cases', async () => {
    // 1. Test invalid role ID formats
    let response = await makeRequest('GET', '/api/roles/invalid-id');
    if (response.statusCode !== 400) {
        throw new Error('Should return 400 for invalid role ID');
    }

    // 2. Test missing required fields
    response = await makeRequest('POST', '/api/roles', { name: 'Test' }); // Missing colorHex
    if (response.statusCode !== 400) {
        throw new Error('Should return 400 for missing required fields');
    }

    // 3. Test operations on non-existent resources
    response = await makeRequest('PUT', '/api/roles/non-existent-id', { name: 'New Name' });
    if (response.statusCode !== 400) {
        throw new Error('Should return 400 for non-existent role update');
    }

    response = await makeRequest('DELETE', '/api/roles/non-existent-id');
    if (response.statusCode !== 400) {
        throw new Error('Should return 400 for non-existent role deletion');
    }

    // 4. Test session operations without active session
    response = await makeRequest('POST', '/api/sessions/end');
    if (response.statusCode !== 400) {
        throw new Error('Should return 400 when ending non-existent session');
    }

    // 5. Test notes operations with invalid session
    response = await makeRequest('POST', '/api/notes', {
        sessionId: 'non-existent-session',
        text: 'Test note'
    });
    if (response.statusCode !== 400) {
        throw new Error('Should return 400 for note with invalid session');
    }

    response = await makeRequest('PUT', '/api/notes/non-existent-note', { text: 'Updated' });
    if (response.statusCode !== 400) {
        throw new Error('Should return 400 for updating non-existent note');
    }

    response = await makeRequest('DELETE', '/api/notes/non-existent-note');
    if (response.statusCode !== 400) {
        throw new Error('Should return 400 for deleting non-existent note');
    }

    // 6. Test malformed requests
    response = await makeRequest('POST', '/api/roles', null);
    if (response.statusCode !== 400) {
        throw new Error('Should return 400 for null body');
    }

    response = await makeRequest('PUT', '/api/roles/test-id', null);
    if (response.statusCode !== 400) {
        throw new Error('Should return 400 for null update body');
    }

    // 7. Test unknown endpoints
    response = await makeRequest('GET', '/api/unknown-endpoint');
    if (response.statusCode !== 404) {
        throw new Error('Should return 404 for unknown endpoints');
    }

    response = await makeRequest('POST', '/api/invalid/path');
    if (response.statusCode !== 404) {
        throw new Error('Should return 404 for invalid paths');
    }
});

// Performance and data consistency
runner.test('Data Consistency and State Management', async () => {
    // 1. Create role and verify it's immediately available
    const roleResponse = await makeRequest('POST', '/api/roles', {
        name: 'Tester',
        colorHex: '#f39c12'
    });
    const role = roleResponse.body.data;

    let response = await makeRequest('GET', '/api/roles');
    if (!response.body.data.find((r: Role) => r.id === role.id)) {
        throw new Error('Newly created role not immediately available');
    }

    // 2. Start session and verify immediate state change
    await makeRequest('POST', '/api/sessions/start', { roleId: role.id });

    response = await makeRequest('GET', '/api/status');
    if (!response.body.data.isActive || response.body.data.currentRole.id !== role.id) {
        throw new Error('Session state not immediately updated');
    }

    // 3. Update role and verify active session reflects changes
    const updatedName = 'Senior Tester';
    await makeRequest('PUT', `/api/roles/${role.id}`, { name: updatedName });

    response = await makeRequest('GET', '/api/status');
    if (response.body.data.currentRole.name !== updatedName) {
        throw new Error('Active session should reflect role updates');
    }

    // 4. Add note and verify it's immediately available
    const noteResponse = await makeRequest('POST', '/api/notes', {
        sessionId: response.body.data.currentSession.id,
        text: 'Test note for consistency'
    });
    const note = noteResponse.body.data;

    response = await makeRequest('GET', '/api/sessions');
    const session = response.body.data.find((s: Session) => s.id === response.body.data.currentSession?.id);
    if (!session || !session.notes.find((n: Note) => n.id === note.id)) {
        throw new Error('Note not immediately available in session');
    }

    // 5. Delete role with active session and verify cleanup
    await makeRequest('DELETE', `/api/roles/${role.id}`);

    response = await makeRequest('GET', '/api/status');
    if (response.body.data.isActive) {
        throw new Error('Session should end when active role is deleted');
    }

    response = await makeRequest('GET', '/api/roles');
    if (response.body.data.find((r: Role) => r.id === role.id)) {
        throw new Error('Deleted role should not be available');
    }
});

// Multi-user simulation (concurrent operations)
runner.test('Concurrent Operations Simulation', async () => {
    // Simulate multiple operations happening "simultaneously"
    const role1Response = await makeRequest('POST', '/api/roles', {
        name: 'Developer',
        colorHex: '#3498db'
    });
    const role2Response = await makeRequest('POST', '/api/roles', {
        name: 'Writer',
        colorHex: '#e74c3c'
    });

    const role1 = role1Response.body.data;
    const role2 = role2Response.body.data;

    // 1. Start session, add notes, and get analytics "concurrently"
    await makeRequest('POST', '/api/sessions/start', { roleId: role1.id });

    const statusPromise = makeRequest('GET', '/api/status');
    const rolesPromise = makeRequest('GET', '/api/roles');
    const eventsPromise = makeRequest('GET', '/api/events');

    const [statusResponse, rolesResponse, eventsResponse] = await Promise.all([
        statusPromise,
        rolesPromise,
        eventsPromise
    ]);

    // All should succeed
    if (statusResponse.statusCode !== 200 || rolesResponse.statusCode !== 200 || eventsResponse.statusCode !== 200) {
        throw new Error('Concurrent read operations should all succeed');
    }

    // 2. Verify data consistency across concurrent reads
    if (!statusResponse.body.data.isActive) {
        throw new Error('Status should show active session');
    }

    if (rolesResponse.body.data.length !== 2) {
        throw new Error('Should have 2 roles');
    }

    if (eventsResponse.body.data.length === 0) {
        throw new Error('Should have events from session start');
    }

    // 3. Test rapid role switching (simulating user clicking quickly)
    mockPlugin.setSessionLocked(false);

    const switch1Promise = makeRequest('POST', '/api/sessions/switch', { roleId: role2.id });
    await TestUtils.delay(10);
    const switch2Promise = makeRequest('POST', '/api/sessions/switch', { roleId: role1.id });

    const [switch1Response, switch2Response] = await Promise.all([
        switch1Promise,
        switch2Promise
    ]);

    // At least one should succeed, system should remain in consistent state
    const finalStatus = await makeRequest('GET', '/api/status');
    if (!finalStatus.body.data.isActive) {
        throw new Error('Should still have active session after rapid switching');
    }

    const activeRole = finalStatus.body.data.currentRole.id;
    if (activeRole !== role1.id && activeRole !== role2.id) {
        throw new Error('Active role should be one of the valid roles');
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