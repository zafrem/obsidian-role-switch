// Test setup and utilities for RoleSwitch API tests

import { Role, Session, Note, RoleSwitchData, RoleSwitchSettings, DEFAULT_SETTINGS, RoleSwitchEvent } from '../src/types';

// Mock Plugin class for testing
export class MockPlugin {
    data: RoleSwitchData;
    private idCounter = 1;

    constructor() {
        this.data = {
            roles: [],
            events: [],
            state: {
                activeRoleId: null,
                activeSessionId: null,
                activeStartAt: null,
                inTransition: false,
                lockUntil: null
            },
            settings: { ...DEFAULT_SETTINGS },
            apiKeys: [],
            syncEndpoints: []
        };
    }

    // Mock plugin methods
    createRole(name: string, colorHex: string, description?: string, icon?: string): Role {
        const role: Role = {
            id: `role-${this.idCounter++}`,
            name,
            colorHex,
            description,
            icon
        };
        this.data.roles.push(role);
        return role;
    }

    updateRole(roleId: string, updates: Partial<Omit<Role, 'id'>>): void {
        const role = this.data.roles.find(r => r.id === roleId);
        if (!role) {
            throw new Error('Role not found');
        }
        Object.assign(role, updates);
    }

    deleteRole(roleId: string): void {
        if (this.data.state.activeRoleId === roleId) {
            this.endSession();
        }
        this.data.roles = this.data.roles.filter(r => r.id !== roleId);
    }

    startSession(roleId: string): void {
        const role = this.data.roles.find(r => r.id === roleId);
        if (!role) {
            throw new Error('Role not found');
        }

        if (this.data.state.activeRoleId) {
            this.endSession();
        }

        const sessionId = `session-${this.idCounter++}`;
        const now = new Date().toISOString();

        this.data.state = {
            activeRoleId: roleId,
            activeSessionId: sessionId,
            activeStartAt: now,
            inTransition: false,
            lockUntil: new Date(Date.now() + this.data.settings.minSessionSeconds * 1000).toISOString()
        };

        this.data.events.push({
            id: `event-${this.idCounter++}`,
            type: 'start',
            roleId,
            at: now,
            meta: { sessionId }
        });
    }

    confirmSwitch(roleId: string): void {
        const role = this.data.roles.find(r => r.id === roleId);
        if (!role) {
            throw new Error('Role not found');
        }

        const now = new Date().toISOString();
        const sessionId = `session-${this.idCounter++}`;

        this.data.events.push({
            id: `event-${this.idCounter++}`,
            type: 'switch',
            roleId,
            at: now,
            meta: {
                sessionId,
                fromRoleId: this.data.state.activeRoleId || undefined
            }
        });

        this.data.state = {
            activeRoleId: roleId,
            activeSessionId: sessionId,
            activeStartAt: now,
            inTransition: false,
            lockUntil: new Date(Date.now() + this.data.settings.minSessionSeconds * 1000).toISOString()
        };
    }

    endSession(): void {
        if (!this.data.state.activeRoleId) {
            throw new Error('No active session');
        }

        const now = new Date().toISOString();

        this.data.events.push({
            id: `event-${this.idCounter++}`,
            type: 'end',
            roleId: this.data.state.activeRoleId,
            at: now,
            meta: {
                sessionId: this.data.state.activeSessionId || undefined,
                duration: this.data.state.activeStartAt ?
                    (Date.now() - new Date(this.data.state.activeStartAt).getTime()) / 1000 : undefined
            }
        });

        this.data.state = {
            activeRoleId: null,
            activeSessionId: null,
            activeStartAt: null,
            inTransition: false,
            lockUntil: null
        };
    }

    isSessionLocked(): boolean {
        if (!this.data.state.lockUntil) return false;
        return new Date() < new Date(this.data.state.lockUntil);
    }

    getRemainingLockTime(): number {
        if (!this.data.state.lockUntil) return 0;
        const remaining = Math.max(0, new Date(this.data.state.lockUntil).getTime() - Date.now());
        return Math.ceil(remaining / 1000);
    }

    getDerivedSessions(startDate?: Date, endDate?: Date): Session[] {
        const sessions: Session[] = [];
        const sessionMap = new Map<string, Session>();

        // Process events to derive sessions
        for (const event of this.data.events) {
            if (event.type === 'start' || event.type === 'switch') {
                const sessionId = event.meta?.sessionId;
                if (sessionId) {
                    sessionMap.set(sessionId, {
                        id: sessionId,
                        roleId: event.roleId,
                        startAt: event.at,
                        notes: []
                    });
                }
            } else if (event.type === 'end') {
                const sessionId = event.meta?.sessionId;
                if (sessionId && sessionMap.has(sessionId)) {
                    const session = sessionMap.get(sessionId)!;
                    session.endAt = event.at;
                    sessions.push(session);
                    sessionMap.delete(sessionId);
                }
            }
        }

        // Add any ongoing sessions
        sessionMap.forEach(session => sessions.push(session));

        // Apply date filters
        let filteredSessions = sessions;
        if (startDate) {
            filteredSessions = filteredSessions.filter(s => new Date(s.startAt) >= startDate);
        }
        if (endDate) {
            filteredSessions = filteredSessions.filter(s => new Date(s.startAt) <= endDate);
        }

        return filteredSessions.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
    }

    addNote(sessionId: string, text: string): Note {
        const note: Note = {
            id: `note-${this.idCounter++}`,
            text,
            createdAt: new Date().toISOString()
        };

        // Find session and add note
        const sessions = this.getDerivedSessions();
        const session = sessions.find(s => s.id === sessionId);
        if (session) {
            session.notes.push(note);
        } else {
            throw new Error('Session not found');
        }

        return note;
    }

    updateNote(noteId: string, text: string): void {
        const sessions = this.getDerivedSessions();
        for (const session of sessions) {
            const note = session.notes.find(n => n.id === noteId);
            if (note) {
                note.text = text;
                return;
            }
        }
        throw new Error('Note not found');
    }

    deleteNote(noteId: string): void {
        const sessions = this.getDerivedSessions();
        for (const session of sessions) {
            const noteIndex = session.notes.findIndex(n => n.id === noteId);
            if (noteIndex !== -1) {
                session.notes.splice(noteIndex, 1);
                return;
            }
        }
        throw new Error('Note not found');
    }

    // Helper methods for testing
    reset(): void {
        this.data = {
            roles: [],
            events: [],
            state: {
                activeRoleId: null,
                activeSessionId: null,
                activeStartAt: null,
                inTransition: false,
                lockUntil: null
            },
            settings: { ...DEFAULT_SETTINGS },
            apiKeys: [],
            syncEndpoints: []
        };
        this.idCounter = 1;
    }

    setSessionLocked(locked: boolean): void {
        if (locked) {
            this.data.state.lockUntil = new Date(Date.now() + 300000).toISOString(); // 5 minutes
        } else {
            this.data.state.lockUntil = null;
        }
    }

    addTestRole(name: string = 'Test Role', colorHex: string = '#3498db'): Role {
        return this.createRole(name, colorHex, `Description for ${name}`, 'test-icon');
    }

    addTestSession(roleId: string, startTime?: Date, endTime?: Date): string {
        const sessionId = `session-${this.idCounter++}`;
        const startAt = startTime ? startTime.toISOString() : new Date().toISOString();

        // Add start event
        this.data.events.push({
            id: `event-${this.idCounter++}`,
            type: 'start',
            roleId,
            at: startAt,
            meta: { sessionId }
        });

        // Add end event if specified
        if (endTime) {
            this.data.events.push({
                id: `event-${this.idCounter++}`,
                type: 'end',
                roleId,
                at: endTime.toISOString(),
                meta: {
                    sessionId,
                    duration: (endTime.getTime() - (startTime || new Date()).getTime()) / 1000
                }
            });
        }

        return sessionId;
    }
}

// Test utilities
export class TestUtils {
    static createTestRole(overrides: Partial<Role> = {}): Role {
        return {
            id: 'test-role-1',
            name: 'Test Role',
            colorHex: '#3498db',
            description: 'Test role description',
            icon: 'test-icon',
            ...overrides
        };
    }

    static createTestSession(overrides: Partial<Session> = {}): Session {
        return {
            id: 'test-session-1',
            roleId: 'test-role-1',
            startAt: new Date().toISOString(),
            notes: [],
            ...overrides
        };
    }

    static createTestNote(overrides: Partial<Note> = {}): Note {
        return {
            id: 'test-note-1',
            text: 'Test note text',
            createdAt: new Date().toISOString(),
            ...overrides
        };
    }

    static createTestEvent(overrides: Partial<RoleSwitchEvent> = {}): RoleSwitchEvent {
        return {
            id: 'test-event-1',
            type: 'start',
            roleId: 'test-role-1',
            at: new Date().toISOString(),
            ...overrides
        };
    }

    static async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static expectError(fn: () => any, expectedMessage?: string): void {
        let error: Error | null = null;
        try {
            fn();
        } catch (e) {
            error = e as Error;
        }

        if (!error) {
            throw new Error('Expected function to throw an error, but it did not');
        }

        if (expectedMessage && !error.message.includes(expectedMessage)) {
            throw new Error(`Expected error message to contain "${expectedMessage}", but got "${error.message}"`);
        }
    }

    static async expectAsyncError(fn: () => Promise<any>, expectedMessage?: string): Promise<void> {
        let error: Error | null = null;
        try {
            await fn();
        } catch (e) {
            error = e as Error;
        }

        if (!error) {
            throw new Error('Expected async function to throw an error, but it did not');
        }

        if (expectedMessage && !error.message.includes(expectedMessage)) {
            throw new Error(`Expected error message to contain "${expectedMessage}", but got "${error.message}"`);
        }
    }

    static assertDeepEqual(actual: any, expected: any, path: string = 'root'): void {
        if (actual === expected) return;

        if (actual === null || expected === null || actual === undefined || expected === undefined) {
            throw new Error(`Expected ${path} to be ${expected}, but got ${actual}`);
        }

        if (typeof actual !== typeof expected) {
            throw new Error(`Expected ${path} to be of type ${typeof expected}, but got ${typeof actual}`);
        }

        if (Array.isArray(actual) !== Array.isArray(expected)) {
            throw new Error(`Expected ${path} array status mismatch`);
        }

        if (Array.isArray(actual)) {
            if (actual.length !== expected.length) {
                throw new Error(`Expected ${path} array length to be ${expected.length}, but got ${actual.length}`);
            }
            for (let i = 0; i < actual.length; i++) {
                this.assertDeepEqual(actual[i], expected[i], `${path}[${i}]`);
            }
            return;
        }

        if (typeof actual === 'object') {
            const actualKeys = Object.keys(actual).sort();
            const expectedKeys = Object.keys(expected).sort();

            if (actualKeys.length !== expectedKeys.length) {
                throw new Error(`Expected ${path} to have ${expectedKeys.length} keys, but got ${actualKeys.length}`);
            }

            for (const key of expectedKeys) {
                if (!actualKeys.includes(key)) {
                    throw new Error(`Expected ${path} to have key "${key}"`);
                }
                this.assertDeepEqual(actual[key], expected[key], `${path}.${key}`);
            }
            return;
        }

        throw new Error(`Expected ${path} to be ${expected}, but got ${actual}`);
    }
}

// Simple test runner
export class TestRunner {
    private tests: Array<{ name: string; fn: () => void | Promise<void> }> = [];
    private beforeEachFn?: () => void | Promise<void>;
    private afterEachFn?: () => void | Promise<void>;

    test(name: string, fn: () => void | Promise<void>): void {
        this.tests.push({ name, fn });
    }

    beforeEach(fn: () => void | Promise<void>): void {
        this.beforeEachFn = fn;
    }

    afterEach(fn: () => void | Promise<void>): void {
        this.afterEachFn = fn;
    }

    async run(): Promise<{ passed: number; failed: number; errors: Array<{ test: string; error: string }> }> {
        let passed = 0;
        let failed = 0;
        const errors: Array<{ test: string; error: string }> = [];

        console.log(`Running ${this.tests.length} tests...\n`);

        for (const test of this.tests) {
            try {
                if (this.beforeEachFn) {
                    await this.beforeEachFn();
                }

                await test.fn();

                if (this.afterEachFn) {
                    await this.afterEachFn();
                }

                console.log(`✅ ${test.name}`);
                passed++;
            } catch (error) {
                console.log(`❌ ${test.name}`);
                console.log(`   Error: ${error}`);
                errors.push({ test: test.name, error: String(error) });
                failed++;
            }
        }

        console.log(`\nResults: ${passed} passed, ${failed} failed`);

        if (errors.length > 0) {
            console.log('\nFailures:');
            errors.forEach(({ test, error }) => {
                console.log(`  ${test}: ${error}`);
            });
        }

        return { passed, failed, errors };
    }
}