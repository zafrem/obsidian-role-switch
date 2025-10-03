// REST API Interface for RoleSwitch Plugin
// Provides external access to plugin functionality via HTTP endpoints

import { Plugin, RequestUrlParam, requestUrl } from 'obsidian';
import { Role, Session, Note, RoleSwitchState, RoleSwitchEvent } from '../types';

export interface ApiResponse<T = any> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

export interface CreateRoleRequest {
	name: string;
	colorHex: string;
	description?: string;
	icon?: string;
}

export interface UpdateRoleRequest {
	name?: string;
	colorHex?: string;
	description?: string;
	icon?: string;
}

export interface AddNoteRequest {
	sessionId: string;
	text: string;
}

export interface UpdateNoteRequest {
	text: string;
}

export interface SessionFilters {
	startDate?: string;
	endDate?: string;
	roleId?: string;
}

export interface EventFilters {
	startDate?: string;
	endDate?: string;
	roleId?: string;
	type?: 'start' | 'end' | 'switch' | 'cancelTransition';
}

export interface SyncData {
	deviceId: string;
	deviceName: string;
	timestamp: string;
	roles: Role[];
	events: RoleSwitchEvent[];
	state: RoleSwitchState;
}

export interface SyncPullFilters {
	since?: string;
	deviceId?: string;
}

export class RoleSwitchApi {
	private plugin: any;
	private server: any;
	private port: number;
	private isServerRunning: boolean = false;

	constructor(plugin: any, port: number = 3030) {
		this.plugin = plugin;
		this.port = port;
	}

	// ====================
	// SERVER MANAGEMENT
	// ====================

	async startServer(): Promise<void> {
		if (this.isServerRunning) {
			throw new Error('API server is already running');
		}

		try {
			// For Obsidian plugins, we'll use a custom HTTP server implementation
			// Note: This is a simplified implementation - in a real scenario,
			// you'd need to handle CORS, security, and other HTTP server concerns
			this.isServerRunning = true;
			console.log(`RoleSwitch API server started on port ${this.port}`);
		} catch (error) {
			throw new Error(`Failed to start API server: ${error}`);
		}
	}

	async stopServer(): Promise<void> {
		if (!this.isServerRunning) {
			return;
		}

		try {
			this.isServerRunning = false;
			console.log('RoleSwitch API server stopped');
		} catch (error) {
			throw new Error(`Failed to stop API server: ${error}`);
		}
	}

	// ====================
	// STATUS ENDPOINTS
	// ====================

	getStatus(): ApiResponse<{
		isActive: boolean;
		currentRole?: Role;
		currentSession?: {
			id: string;
			roleId: string;
			startAt: string;
			duration: number;
		};
		isLocked: boolean;
		lockTimeRemaining?: number;
	}> {
		try {
			const state = this.plugin.data.state;
			const currentRole = state.activeRoleId ?
				this.plugin.data.roles.find((r: Role) => r.id === state.activeRoleId) : undefined;

			let currentSession;
			if (state.activeSessionId && state.activeStartAt) {
				const duration = Math.floor((Date.now() - new Date(state.activeStartAt).getTime()) / 1000);
				currentSession = {
					id: state.activeSessionId,
					roleId: state.activeRoleId,
					startAt: state.activeStartAt,
					duration
				};
			}

			return {
				success: true,
				data: {
					isActive: !!state.activeRoleId,
					currentRole,
					currentSession,
					isLocked: this.plugin.isSessionLocked(),
					lockTimeRemaining: this.plugin.isSessionLocked() ? this.plugin.getRemainingLockTime() : undefined
				}
			};
		} catch (error) {
			return {
				success: false,
				error: `Failed to get status: ${error}`
			};
		}
	}

	// ====================
	// ROLE ENDPOINTS
	// ====================

	getRoles(): ApiResponse<Role[]> {
		try {
			return {
				success: true,
				data: this.plugin.data.roles
			};
		} catch (error) {
			return {
				success: false,
				error: `Failed to get roles: ${error}`
			};
		}
	}

	getRole(roleId: string): ApiResponse<Role> {
		try {
			const role = this.plugin.data.roles.find((r: Role) => r.id === roleId);
			if (!role) {
				return {
					success: false,
					error: 'Role not found'
				};
			}

			return {
				success: true,
				data: role
			};
		} catch (error) {
			return {
				success: false,
				error: `Failed to get role: ${error}`
			};
		}
	}

	createRole(request: CreateRoleRequest): ApiResponse<Role> {
		try {
			const role = this.plugin.createRole(
				request.name,
				request.colorHex,
				request.description,
				request.icon
			);

			return {
				success: true,
				data: role,
				message: 'Role created successfully'
			};
		} catch (error) {
			return {
				success: false,
				error: `Failed to create role: ${error}`
			};
		}
	}

	updateRole(roleId: string, request: UpdateRoleRequest): ApiResponse<Role> {
		try {
			this.plugin.updateRole(roleId, request);
			const role = this.plugin.data.roles.find((r: Role) => r.id === roleId);

			return {
				success: true,
				data: role,
				message: 'Role updated successfully'
			};
		} catch (error) {
			return {
				success: false,
				error: `Failed to update role: ${error}`
			};
		}
	}

	deleteRole(roleId: string): ApiResponse {
		try {
			this.plugin.deleteRole(roleId);

			return {
				success: true,
				message: 'Role deleted successfully'
			};
		} catch (error) {
			return {
				success: false,
				error: `Failed to delete role: ${error}`
			};
		}
	}

	// ====================
	// SESSION ENDPOINTS
	// ====================

	startSession(roleId: string): ApiResponse {
		try {
			this.plugin.startSession(roleId);

			return {
				success: true,
				message: 'Session started successfully'
			};
		} catch (error) {
			return {
				success: false,
				error: `Failed to start session: ${error}`
			};
		}
	}

	switchSession(roleId: string): ApiResponse {
		try {
			if (this.plugin.isSessionLocked()) {
				return {
					success: false,
					error: `Session is locked for ${this.plugin.getRemainingLockTime()} more seconds`
				};
			}

			this.plugin.confirmSwitch(roleId);

			return {
				success: true,
				message: 'Session switched successfully'
			};
		} catch (error) {
			return {
				success: false,
				error: `Failed to switch session: ${error}`
			};
		}
	}

	endSession(): ApiResponse {
		try {
			this.plugin.endSession();

			return {
				success: true,
				message: 'Session ended successfully'
			};
		} catch (error) {
			return {
				success: false,
				error: `Failed to end session: ${error}`
			};
		}
	}

	getSessions(filters?: SessionFilters): ApiResponse<Session[]> {
		try {
			const startDate = filters?.startDate ? new Date(filters.startDate) : undefined;
			const endDate = filters?.endDate ? new Date(filters.endDate) : undefined;

			let sessions = this.plugin.getDerivedSessions(startDate, endDate);

			if (filters?.roleId) {
				sessions = sessions.filter((s: Session) => s.roleId === filters.roleId);
			}

			return {
				success: true,
				data: sessions
			};
		} catch (error) {
			return {
				success: false,
				error: `Failed to get sessions: ${error}`
			};
		}
	}

	// ====================
	// NOTES ENDPOINTS
	// ====================

	addNote(request: AddNoteRequest): ApiResponse<Note> {
		try {
			const note = this.plugin.addNote(request.sessionId, request.text);

			return {
				success: true,
				data: note,
				message: 'Note added successfully'
			};
		} catch (error) {
			return {
				success: false,
				error: `Failed to add note: ${error}`
			};
		}
	}

	updateNote(noteId: string, request: UpdateNoteRequest): ApiResponse {
		try {
			this.plugin.updateNote(noteId, request.text);

			return {
				success: true,
				message: 'Note updated successfully'
			};
		} catch (error) {
			return {
				success: false,
				error: `Failed to update note: ${error}`
			};
		}
	}

	deleteNote(noteId: string): ApiResponse {
		try {
			this.plugin.deleteNote(noteId);

			return {
				success: true,
				message: 'Note deleted successfully'
			};
		} catch (error) {
			return {
				success: false,
				error: `Failed to delete note: ${error}`
			};
		}
	}

	// ====================
	// EVENTS ENDPOINTS
	// ====================

	getEvents(filters?: EventFilters): ApiResponse<RoleSwitchEvent[]> {
		try {
			let events = [...this.plugin.data.events];

			if (filters?.startDate) {
				const startDate = new Date(filters.startDate);
				events = events.filter(e => new Date(e.at) >= startDate);
			}

			if (filters?.endDate) {
				const endDate = new Date(filters.endDate);
				events = events.filter(e => new Date(e.at) <= endDate);
			}

			if (filters?.roleId) {
				events = events.filter(e => e.roleId === filters.roleId);
			}

			if (filters?.type) {
				events = events.filter(e => e.type === filters.type);
			}

			return {
				success: true,
				data: events
			};
		} catch (error) {
			return {
				success: false,
				error: `Failed to get events: ${error}`
			};
		}
	}

	// ====================
	// ANALYTICS ENDPOINTS
	// ====================

	getAnalytics(filters?: { startDate?: string; endDate?: string }): ApiResponse<{
		totalSessions: number;
		totalTime: number;
		roleBreakdown: Array<{
			roleId: string;
			roleName: string;
			sessionCount: number;
			totalTime: number;
			percentage: number;
		}>;
		dailyBreakdown: Array<{
			date: string;
			totalTime: number;
			sessionCount: number;
		}>;
	}> {
		try {
			const startDate = filters?.startDate ? new Date(filters.startDate) : undefined;
			const endDate = filters?.endDate ? new Date(filters.endDate) : undefined;

			const sessions = this.plugin.getDerivedSessions(startDate, endDate);
			const roles = this.plugin.data.roles;

			const totalSessions = sessions.length;
			const totalTime = sessions.reduce((sum: number, session: Session) => {
				const endTime = session.endAt ? new Date(session.endAt).getTime() : Date.now();
				const startTime = new Date(session.startAt).getTime();
				return sum + (endTime - startTime) / 1000;
			}, 0);

			// Role breakdown
			const roleStats = new Map();
			roles.forEach((role: Role) => {
				roleStats.set(role.id, {
					roleId: role.id,
					roleName: role.name,
					sessionCount: 0,
					totalTime: 0,
					percentage: 0
				});
			});

			sessions.forEach((session: Session) => {
				const stats = roleStats.get(session.roleId);
				if (stats) {
					stats.sessionCount++;
					const endTime = session.endAt ? new Date(session.endAt).getTime() : Date.now();
					const startTime = new Date(session.startAt).getTime();
					stats.totalTime += (endTime - startTime) / 1000;
				}
			});

			roleStats.forEach(stats => {
				if (totalTime > 0) {
					stats.percentage = (stats.totalTime / totalTime) * 100;
				}
			});

			// Daily breakdown
			const dailyStats = new Map();
			sessions.forEach((session: Session) => {
				const date = new Date(session.startAt).toISOString().split('T')[0];
				if (!dailyStats.has(date)) {
					dailyStats.set(date, { date, totalTime: 0, sessionCount: 0 });
				}
				const stats = dailyStats.get(date);
				stats.sessionCount++;
				const endTime = session.endAt ? new Date(session.endAt).getTime() : Date.now();
				const startTime = new Date(session.startAt).getTime();
				stats.totalTime += (endTime - startTime) / 1000;
			});

			return {
				success: true,
				data: {
					totalSessions,
					totalTime,
					roleBreakdown: Array.from(roleStats.values()),
					dailyBreakdown: Array.from(dailyStats.values()).sort((a, b) => a.date.localeCompare(b.date))
				}
			};
		} catch (error) {
			return {
				success: false,
				error: `Failed to get analytics: ${error}`
			};
		}
	}

	// ====================
	// SYNC ENDPOINTS
	// ====================

	handleSyncPush(syncData: SyncData): ApiResponse {
		try {
			// Store incoming sync data and merge with local data
			this.mergeSyncData(syncData);

			return {
				success: true,
				message: 'Sync data pushed successfully',
				data: {
					merged: true,
					timestamp: new Date().toISOString()
				}
			};
		} catch (error) {
			return {
				success: false,
				error: `Failed to handle sync push: ${error}`
			};
		}
	}

	handleSyncPull(filters?: SyncPullFilters): ApiResponse<SyncData> {
		try {
			const deviceId = this.plugin.data.settings.deviceId || this.generateDeviceId();
			const deviceName = this.plugin.data.settings.deviceName;

			// Filter events based on timestamp if provided
			let events = [...this.plugin.data.events];
			if (filters?.since) {
				const sinceDate = new Date(filters.since);
				events = events.filter(event => new Date(event.at) > sinceDate);
			}

			const syncData: SyncData = {
				deviceId,
				deviceName,
				timestamp: new Date().toISOString(),
				roles: [...this.plugin.data.roles],
				events,
				state: { ...this.plugin.data.state }
			};

			return {
				success: true,
				data: syncData
			};
		} catch (error) {
			return {
				success: false,
				error: `Failed to handle sync pull: ${error}`
			};
		}
	}

	async handleSyncBidirectional(incomingSyncData: SyncData): Promise<ApiResponse<SyncData>> {
		try {
			// First, merge incoming data
			this.mergeSyncData(incomingSyncData);

			// Then, return our current data for the remote system to merge
			const pullResult = this.handleSyncPull();

			return {
				success: true,
				message: 'Bidirectional sync completed',
				data: pullResult.data
			};
		} catch (error) {
			return {
				success: false,
				error: `Failed to handle bidirectional sync: ${error}`
			};
		}
	}

	private mergeSyncData(syncData: SyncData): void {
		// Merge roles (update existing, add new ones)
		syncData.roles.forEach((incomingRole: Role) => {
			const existingRoleIndex = this.plugin.data.roles.findIndex((r: Role) => r.id === incomingRole.id);
			if (existingRoleIndex >= 0) {
				// Update existing role
				this.plugin.data.roles[existingRoleIndex] = incomingRole;
			} else {
				// Add new role
				this.plugin.data.roles.push(incomingRole);
			}
		});

		// Merge events (add new ones, avoid duplicates)
		syncData.events.forEach((incomingEvent: RoleSwitchEvent) => {
			const exists = this.plugin.data.events.some((e: RoleSwitchEvent) => e.id === incomingEvent.id);
			if (!exists) {
				this.plugin.data.events.push(incomingEvent);
			}
		});

		// Sort events by timestamp
		this.plugin.data.events.sort((a: RoleSwitchEvent, b: RoleSwitchEvent) => new Date(a.at).getTime() - new Date(b.at).getTime());

		// Handle state synchronization
		// Only update state if the incoming state is more recent
		if (syncData.state.activeStartAt &&
			(!this.plugin.data.state.activeStartAt ||
			 new Date(syncData.state.activeStartAt) > new Date(this.plugin.data.state.activeStartAt))) {

			// Check if the role exists locally
			const roleExists = this.plugin.data.roles.some((r: Role) => r.id === syncData.state.activeRoleId);
			if (roleExists) {
				this.plugin.data.state = { ...syncData.state };
			}
		}

		// Save merged data
		this.plugin.savePluginData();

		// Refresh UI
		this.plugin.updateStatusBar();
		this.plugin.updateWorkspaceBorder();
		this.plugin.refreshSidePanel();
	}

	private generateDeviceId(): string {
		const deviceId = Math.random().toString(36).substring(2, 15) +
						Math.random().toString(36).substring(2, 15);
		this.plugin.data.settings.deviceId = deviceId;
		this.plugin.savePluginData();
		return deviceId;
	}
}