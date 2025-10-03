// Unit tests for RoleSwitch API Interface

import { RoleSwitchApi } from '../src/api/ApiInterface';
import { MockPlugin, TestUtils, TestRunner } from './TestSetup';

// Test suite for API Interface
const runner = new TestRunner();
let mockPlugin: MockPlugin;
let api: RoleSwitchApi;

runner.beforeEach(() => {
    mockPlugin = new MockPlugin();
    api = new RoleSwitchApi(mockPlugin, 3030);
});

// Status Endpoints Tests
runner.test('getStatus - returns correct status when no active session', () => {
    const result = api.getStatus();

    if (!result.success) {
        throw new Error('Expected getStatus to succeed');
    }

    if (!result.data) {
        throw new Error('Expected result data to be present');
    }

    const expected = {
        isActive: false,
        isLocked: false
    };

    if (result.data.isActive !== expected.isActive) {
        throw new Error(`Expected isActive to be ${expected.isActive}, got ${result.data.isActive}`);
    }

    if (result.data.isLocked !== expected.isLocked) {
        throw new Error(`Expected isLocked to be ${expected.isLocked}, got ${result.data.isLocked}`);
    }

    if (result.data.currentRole !== undefined) {
        throw new Error('Expected currentRole to be undefined when no active session');
    }

    if (result.data.currentSession !== undefined) {
        throw new Error('Expected currentSession to be undefined when no active session');
    }
});

runner.test('getStatus - returns correct status with active session', () => {
    // Setup: create role and start session
    const role = mockPlugin.addTestRole('Developer', '#3498db');
    mockPlugin.startSession(role.id);

    const result = api.getStatus();

    if (!result.success) {
        throw new Error('Expected getStatus to succeed');
    }

    if (!result.data) {
        throw new Error('Expected result data to be present');
    }

    if (!result.data.isActive) {
        throw new Error('Expected isActive to be true with active session');
    }

    if (!result.data.currentRole) {
        throw new Error('Expected currentRole to be present');
    }

    if (result.data.currentRole.id !== role.id) {
        throw new Error(`Expected currentRole.id to be ${role.id}, got ${result.data.currentRole.id}`);
    }

    if (!result.data.currentSession) {
        throw new Error('Expected currentSession to be present');
    }

    if (result.data.currentSession.roleId !== role.id) {
        throw new Error(`Expected currentSession.roleId to be ${role.id}, got ${result.data.currentSession.roleId}`);
    }

    if (typeof result.data.currentSession.duration !== 'number') {
        throw new Error('Expected currentSession.duration to be a number');
    }
});

// Role Management Tests
runner.test('getRoles - returns empty array initially', () => {
    const result = api.getRoles();

    if (!result.success) {
        throw new Error('Expected getRoles to succeed');
    }

    if (!result.data) {
        throw new Error('Expected result data to be present');
    }

    if (!Array.isArray(result.data)) {
        throw new Error('Expected getRoles to return an array');
    }

    if (result.data.length !== 0) {
        throw new Error(`Expected empty array, got array with ${result.data.length} items`);
    }
});

runner.test('getRoles - returns all roles', () => {
    // Setup: create test roles
    const role1 = mockPlugin.addTestRole('Developer', '#3498db');
    const role2 = mockPlugin.addTestRole('Writer', '#e74c3c');

    const result = api.getRoles();

    if (!result.success) {
        throw new Error('Expected getRoles to succeed');
    }

    if (!result.data) {
        throw new Error('Expected result data to be present');
    }

    if (result.data.length !== 2) {
        throw new Error(`Expected 2 roles, got ${result.data.length}`);
    }

    const roleIds = result.data.map((r: any) => r.id).sort();
    const expectedIds = [role1.id, role2.id].sort();

    TestUtils.assertDeepEqual(roleIds, expectedIds);
});

runner.test('getRole - returns specific role', () => {
    const role = mockPlugin.addTestRole('Developer', '#3498db');

    const result = api.getRole(role.id);

    if (!result.success) {
        throw new Error('Expected getRole to succeed');
    }

    if (!result.data) {
        throw new Error('Expected result data to be present');
    }

    TestUtils.assertDeepEqual(result.data, role);
});

runner.test('getRole - returns error for non-existent role', () => {
    const result = api.getRole('non-existent-id');

    if (result.success) {
        throw new Error('Expected getRole to fail for non-existent role');
    }

    if (result.error !== 'Role not found') {
        throw new Error(`Expected error "Role not found", got "${result.error}"`);
    }
});

runner.test('createRole - creates new role successfully', () => {
    const request = {
        name: 'Designer',
        colorHex: '#9b59b6',
        description: 'UI/UX design work',
        icon: 'palette'
    };

    const result = api.createRole(request);

    if (!result.success) {
        throw new Error('Expected createRole to succeed');
    }

    if (!result.data) {
        throw new Error('Expected result data to be present');
    }

    if (!result.data.id) {
        throw new Error('Expected created role to have an ID');
    }

    if (result.data.name !== request.name) {
        throw new Error(`Expected name to be ${request.name}, got ${result.data.name}`);
    }

    if (result.data.colorHex !== request.colorHex) {
        throw new Error(`Expected colorHex to be ${request.colorHex}, got ${result.data.colorHex}`);
    }

    if (result.data.description !== request.description) {
        throw new Error(`Expected description to be ${request.description}, got ${result.data.description}`);
    }

    if (result.data.icon !== request.icon) {
        throw new Error(`Expected icon to be ${request.icon}, got ${result.data.icon}`);
    }

    // Verify role was added to plugin data
    const roles = api.getRoles();
    if (!roles.data || roles.data.length !== 1) {
        throw new Error('Expected role to be added to plugin data');
    }
});

runner.test('updateRole - updates existing role', () => {
    const role = mockPlugin.addTestRole('Developer', '#3498db');

    const updates = {
        name: 'Senior Developer',
        description: 'Advanced development work'
    };

    const result = api.updateRole(role.id, updates);

    if (!result.success) {
        throw new Error('Expected updateRole to succeed');
    }

    if (!result.data) {
        throw new Error('Expected result data to be present');
    }

    if (result.data.name !== updates.name) {
        throw new Error(`Expected updated name to be ${updates.name}, got ${result.data.name}`);
    }

    if (result.data.description !== updates.description) {
        throw new Error(`Expected updated description to be ${updates.description}, got ${result.data.description}`);
    }

    // Verify original colorHex is preserved
    if (result.data.colorHex !== '#3498db') {
        throw new Error('Expected original colorHex to be preserved');
    }
});

runner.test('updateRole - returns error for non-existent role', () => {
    const result = api.updateRole('non-existent-id', { name: 'New Name' });

    if (result.success) {
        throw new Error('Expected updateRole to fail for non-existent role');
    }

    if (!result.error?.includes('Failed to update role')) {
        throw new Error(`Expected error to mention update failure, got "${result.error}"`);
    }
});

runner.test('deleteRole - deletes existing role', () => {
    const role = mockPlugin.addTestRole('Developer', '#3498db');

    const result = api.deleteRole(role.id);

    if (!result.success) {
        throw new Error('Expected deleteRole to succeed');
    }

    if (result.message !== 'Role deleted successfully') {
        throw new Error(`Expected success message, got "${result.message}"`);
    }

    // Verify role was removed
    const roles = api.getRoles();
    if (!roles.data || roles.data.length !== 0) {
        throw new Error('Expected role to be removed from plugin data');
    }
});

runner.test('deleteRole - ends active session when deleting active role', () => {
    const role = mockPlugin.addTestRole('Developer', '#3498db');
    mockPlugin.startSession(role.id);

    // Verify session is active
    let status = api.getStatus();
    if (!status.data || !status.data.isActive) {
        throw new Error('Expected session to be active before deletion');
    }

    const result = api.deleteRole(role.id);

    if (!result.success) {
        throw new Error('Expected deleteRole to succeed');
    }

    // Verify session was ended
    status = api.getStatus();
    if (!status.data || status.data.isActive) {
        throw new Error('Expected session to be ended after deleting active role');
    }
});

// Session Management Tests
runner.test('startSession - starts new session successfully', () => {
    const role = mockPlugin.addTestRole('Developer', '#3498db');

    const result = api.startSession(role.id);

    if (!result.success) {
        throw new Error('Expected startSession to succeed');
    }

    if (result.message !== 'Session started successfully') {
        throw new Error(`Expected success message, got "${result.message}"`);
    }

    // Verify session is active
    const status = api.getStatus();
    if (!status.data || !status.data.isActive) {
        throw new Error('Expected session to be active after starting');
    }

    if (!status.data.currentRole || status.data.currentRole.id !== role.id) {
        throw new Error(`Expected active role to be ${role.id}`);
    }
});

runner.test('startSession - fails for non-existent role', () => {
    const result = api.startSession('non-existent-id');

    if (result.success) {
        throw new Error('Expected startSession to fail for non-existent role');
    }

    if (!result.error?.includes('Failed to start session')) {
        throw new Error(`Expected error to mention start failure, got "${result.error}"`);
    }
});

runner.test('switchSession - switches to different role', () => {
    const role1 = mockPlugin.addTestRole('Developer', '#3498db');
    const role2 = mockPlugin.addTestRole('Writer', '#e74c3c');

    // Start session with first role
    mockPlugin.startSession(role1.id);
    mockPlugin.setSessionLocked(false); // Remove lock for testing

    const result = api.switchSession(role2.id);

    if (!result.success) {
        throw new Error('Expected switchSession to succeed');
    }

    // Verify switched to new role
    const status = api.getStatus();
    if (!status.data || !status.data.currentRole || status.data.currentRole.id !== role2.id) {
        throw new Error(`Expected active role to be ${role2.id}`);
    }
});

runner.test('switchSession - fails when session is locked', () => {
    const role1 = mockPlugin.addTestRole('Developer', '#3498db');
    const role2 = mockPlugin.addTestRole('Writer', '#e74c3c');

    // Start session and ensure it's locked
    mockPlugin.startSession(role1.id);
    mockPlugin.setSessionLocked(true);

    const result = api.switchSession(role2.id);

    if (result.success) {
        throw new Error('Expected switchSession to fail when session is locked');
    }

    if (!result.error?.includes('locked')) {
        throw new Error(`Expected error to mention lock, got "${result.error}"`);
    }
});

runner.test('endSession - ends active session', () => {
    const role = mockPlugin.addTestRole('Developer', '#3498db');
    mockPlugin.startSession(role.id);

    const result = api.endSession();

    if (!result.success) {
        throw new Error('Expected endSession to succeed');
    }

    // Verify session is ended
    const status = api.getStatus();
    if (!status.data || status.data.isActive) {
        throw new Error('Expected session to be inactive after ending');
    }
});

runner.test('endSession - fails when no active session', () => {
    const result = api.endSession();

    if (result.success) {
        throw new Error('Expected endSession to fail when no active session');
    }

    if (!result.error?.includes('Failed to end session')) {
        throw new Error(`Expected error to mention end failure, got "${result.error}"`);
    }
});

runner.test('getSessions - returns filtered sessions', () => {
    const role1 = mockPlugin.addTestRole('Developer', '#3498db');
    const role2 = mockPlugin.addTestRole('Writer', '#e74c3c');

    // Create test sessions
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    mockPlugin.addTestSession(role1.id, yesterday, now);
    mockPlugin.addTestSession(role2.id, now, tomorrow);

    // Test without filters
    let result = api.getSessions();
    if (!result.success || !result.data || result.data.length !== 2) {
        throw new Error('Expected to get all sessions without filters');
    }

    // Test with role filter
    result = api.getSessions({ roleId: role1.id });
    if (!result.success || !result.data || result.data.length !== 1) {
        throw new Error('Expected to get filtered sessions by role');
    }

    if (result.data[0].roleId !== role1.id) {
        throw new Error('Expected filtered session to match role filter');
    }

    // Test with date filter
    result = api.getSessions({
        startDate: now.toISOString(),
        endDate: tomorrow.toISOString()
    });
    if (!result.success || !result.data || result.data.length !== 1) {
        throw new Error('Expected to get filtered sessions by date');
    }
});

// Notes Management Tests
runner.test('addNote - adds note to session', () => {
    const role = mockPlugin.addTestRole('Developer', '#3498db');
    const sessionId = mockPlugin.addTestSession(role.id);

    const request = {
        sessionId,
        text: 'Fixed authentication bug'
    };

    const result = api.addNote(request);

    if (!result.success) {
        throw new Error('Expected addNote to succeed');
    }

    if (!result.data) {
        throw new Error('Expected result data to be present');
    }

    if (!result.data.id) {
        throw new Error('Expected note to have an ID');
    }

    if (result.data.text !== request.text) {
        throw new Error(`Expected note text to be "${request.text}", got "${result.data.text}"`);
    }

    if (!result.data.createdAt) {
        throw new Error('Expected note to have createdAt timestamp');
    }
});

runner.test('addNote - fails for non-existent session', () => {
    const request = {
        sessionId: 'non-existent-session',
        text: 'Test note'
    };

    const result = api.addNote(request);

    if (result.success) {
        throw new Error('Expected addNote to fail for non-existent session');
    }

    if (!result.error?.includes('Failed to add note')) {
        throw new Error(`Expected error to mention add failure, got "${result.error}"`);
    }
});

runner.test('updateNote - updates existing note', () => {
    const role = mockPlugin.addTestRole('Developer', '#3498db');
    const sessionId = mockPlugin.addTestSession(role.id);
    const note = mockPlugin.addNote(sessionId, 'Original text');

    const request = { text: 'Updated text' };

    const result = api.updateNote(note.id, request);

    if (!result.success) {
        throw new Error('Expected updateNote to succeed');
    }

    if (result.message !== 'Note updated successfully') {
        throw new Error(`Expected success message, got "${result.message}"`);
    }

    // Verify note was updated
    const sessions = mockPlugin.getDerivedSessions();
    const session = sessions.find(s => s.id === sessionId);
    const updatedNote = session?.notes.find(n => n.id === note.id);

    if (updatedNote?.text !== request.text) {
        throw new Error('Expected note text to be updated');
    }
});

runner.test('updateNote - fails for non-existent note', () => {
    const result = api.updateNote('non-existent-note', { text: 'New text' });

    if (result.success) {
        throw new Error('Expected updateNote to fail for non-existent note');
    }

    if (!result.error?.includes('Failed to update note')) {
        throw new Error(`Expected error to mention update failure, got "${result.error}"`);
    }
});

runner.test('deleteNote - deletes existing note', () => {
    const role = mockPlugin.addTestRole('Developer', '#3498db');
    const sessionId = mockPlugin.addTestSession(role.id);
    const note = mockPlugin.addNote(sessionId, 'Test note');

    const result = api.deleteNote(note.id);

    if (!result.success) {
        throw new Error('Expected deleteNote to succeed');
    }

    // Verify note was deleted
    const sessions = mockPlugin.getDerivedSessions();
    const session = sessions.find(s => s.id === sessionId);
    const deletedNote = session?.notes.find(n => n.id === note.id);

    if (deletedNote) {
        throw new Error('Expected note to be deleted');
    }
});

// Events Tests
runner.test('getEvents - returns all events without filters', () => {
    const role = mockPlugin.addTestRole('Developer', '#3498db');
    mockPlugin.startSession(role.id);
    mockPlugin.endSession();

    const result = api.getEvents();

    if (!result.success) {
        throw new Error('Expected getEvents to succeed');
    }

    if (!result.data) {
        throw new Error('Expected result data to be present');
    }

    if (result.data.length !== 2) {
        throw new Error(`Expected 2 events (start + end), got ${result.data.length}`);
    }

    const startEvent = result.data.find((e: any) => e.type === 'start');
    const endEvent = result.data.find((e: any) => e.type === 'end');

    if (!startEvent || !endEvent) {
        throw new Error('Expected start and end events');
    }

    if (startEvent.roleId !== role.id || endEvent.roleId !== role.id) {
        throw new Error('Expected events to have correct roleId');
    }
});

runner.test('getEvents - filters events by type', () => {
    const role = mockPlugin.addTestRole('Developer', '#3498db');
    mockPlugin.startSession(role.id);
    mockPlugin.endSession();

    const result = api.getEvents({ type: 'start' });

    if (!result.success) {
        throw new Error('Expected getEvents to succeed');
    }

    if (!result.data) {
        throw new Error('Expected result data to be present');
    }

    if (result.data.length !== 1) {
        throw new Error(`Expected 1 start event, got ${result.data.length}`);
    }

    if (result.data[0].type !== 'start') {
        throw new Error('Expected filtered event to be start type');
    }
});

// Analytics Tests
runner.test('getAnalytics - returns comprehensive analytics', () => {
    const role1 = mockPlugin.addTestRole('Developer', '#3498db');
    const role2 = mockPlugin.addTestRole('Writer', '#e74c3c');

    // Create test sessions with known durations
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    mockPlugin.addTestSession(role1.id, twoHoursAgo, oneHourAgo); // 1 hour
    mockPlugin.addTestSession(role2.id, oneHourAgo, now); // 1 hour

    const result = api.getAnalytics();

    if (!result.success) {
        throw new Error('Expected getAnalytics to succeed');
    }

    if (!result.data) {
        throw new Error('Expected result data to be present');
    }

    const data = result.data;

    if (data.totalSessions !== 2) {
        throw new Error(`Expected 2 total sessions, got ${data.totalSessions}`);
    }

    if (data.totalTime !== 7200) { // 2 hours = 7200 seconds
        throw new Error(`Expected 7200 total seconds, got ${data.totalTime}`);
    }

    if (data.roleBreakdown.length !== 2) {
        throw new Error(`Expected 2 roles in breakdown, got ${data.roleBreakdown.length}`);
    }

    // Check role breakdown
    const role1Stats = data.roleBreakdown.find((r: any) => r.roleId === role1.id);
    const role2Stats = data.roleBreakdown.find((r: any) => r.roleId === role2.id);

    if (!role1Stats || !role2Stats) {
        throw new Error('Expected stats for both roles');
    }

    if (role1Stats.sessionCount !== 1 || role2Stats.sessionCount !== 1) {
        throw new Error('Expected 1 session per role');
    }

    if (role1Stats.totalTime !== 3600 || role2Stats.totalTime !== 3600) {
        throw new Error('Expected 3600 seconds per role');
    }

    if (Math.abs(role1Stats.percentage - 50) > 0.1 || Math.abs(role2Stats.percentage - 50) > 0.1) {
        throw new Error('Expected 50% time split between roles');
    }

    if (data.dailyBreakdown.length === 0) {
        throw new Error('Expected daily breakdown data');
    }
});

runner.test('getAnalytics - handles date filters', () => {
    const role = mockPlugin.addTestRole('Developer', '#3498db');

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    // Create sessions on different days
    mockPlugin.addTestSession(role.id, twoDaysAgo, yesterday);
    mockPlugin.addTestSession(role.id, yesterday, now);

    // Filter to only include yesterday onwards
    const result = api.getAnalytics({
        startDate: yesterday.toISOString(),
        endDate: now.toISOString()
    });

    if (!result.success) {
        throw new Error('Expected getAnalytics with filters to succeed');
    }

    if (!result.data) {
        throw new Error('Expected result data to be present');
    }

    if (result.data.totalSessions !== 1) {
        throw new Error(`Expected 1 filtered session, got ${result.data.totalSessions}`);
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