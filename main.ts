// RoleSwitch Plugin - Main Entry Point

import { Plugin, Notice } from 'obsidian';
import {
	RoleSwitchData,
	DEFAULT_SETTINGS,
	ROLESWITCH_VIEW_TYPE,
	Role,
	Note,
	Session
} from './src/types';
import { Utils } from './src/utils';
import { RoleSwitchView } from './src/views/SidePanelView';
import { TransitionModal, RolePickerModal, NoteEditModal, RoleDashboardModal } from './src/views/Modals';
import { RoleSwitchSettingsTab } from './src/settings/Settings';
import { RoleSwitchApi } from './src/api/ApiInterface';
import { RoleSwitchHttpServer } from './src/api/HttpServer';
import { AuthService } from './src/api/AuthService';
import { SyncService } from './src/api/SyncService';

export default class RoleSwitchPlugin extends Plugin {
	data!: RoleSwitchData;
	statusBarItem: HTMLElement | null = null;
	borderEl: HTMLElement | null = null;
	api!: RoleSwitchApi;
	httpServer!: RoleSwitchHttpServer;
	auth!: AuthService;
	sync!: SyncService;
	reminderInterval: number | null = null;

	async onload() {
		await this.loadPluginData();

		// Register side panel view
		this.registerView(ROLESWITCH_VIEW_TYPE, (leaf) => {
			return new RoleSwitchView(leaf, this);
		});

		// Add ribbon icon for side panel
		this.addRibbonIcon('clock', 'Role-switch panel', () => {
			void this.activateView();
		});

		// Register commands
		this.registerCommands();

		// Add settings tab
		this.addSettingTab(new RoleSwitchSettingsTab(this.app, this));

		// Initialize UI elements
		this.updateStatusBar();
		this.updateWorkspaceBorder();

		// Initialize services
		this.auth = new AuthService(this);
		this.api = new RoleSwitchApi(this, this.data.settings.apiPort || 3030);
		this.httpServer = new RoleSwitchHttpServer(this.api, this.auth);
		this.sync = new SyncService(this, this.auth);

		// Generate device ID if not exists
		if (!this.data.settings.deviceId) {
			this.data.settings.deviceId = this.generateDeviceId();
			void this.savePluginData();
		}

		// Start API server if enabled in settings
		if (this.data.settings.enableApi) {
			try {
				this.api.startServer();
			} catch {
				// API server failed to start
			}
		}

		// Start sync service if enabled
		if (this.data.settings.enableSync) {
			this.sync.startAutoSync();
		}

		// Auto-save data periodically
		this.registerInterval(window.setInterval(() => {
			void this.savePluginData();
		}, 60000)); // Save every minute

		// Save data when app is backgrounded (important for mobile)
		this.registerDomEvent(document, 'visibilitychange', () => {
			if (document.hidden) {
				// App is being backgrounded, save data immediately
				void this.savePluginData();
			}
		});

		// Save data before page unload (mobile safety)
		this.registerDomEvent(window, 'beforeunload', () => {
			void this.savePluginData();
		});
	}

	onunload() {
		// Save data before unloading (important for mobile)
		void this.savePluginData();

		this.removeStatusBar();
		this.removeWorkspaceBorder();
		this.stopReminderInterval();

		// Stop sync service
		if (this.sync) {
			this.sync.stopAutoSync();
		}

		// Stop API server
		if (this.api) {
			try {
				this.api.stopServer();
			} catch {
				// API server failed to stop
			}
		}
	}

	// ====================
	// DATA MANAGEMENT
	// ====================

	async loadPluginData() {
		const defaultData: RoleSwitchData = {
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

		this.data = Object.assign({}, defaultData, await this.loadData());
	}

	async savePluginData() {
		try {
			await this.saveData(this.data);
		} catch {
			new Notice('Role-switch: failed to save data.');
		}
	}

	// ====================
	// ROLE MANAGEMENT
	// ====================

	// Get role by ID, returns deleted role placeholder if not found
	getRoleById(roleId: string): Role {
		const role = this.data.roles.find(r => r.id === roleId);
		if (role) {
			return role;
		}
		// Return placeholder for deleted roles
		return {
			id: roleId,
			name: '(Deleted Role)',
			colorHex: '#888888',
			description: 'This role has been deleted'
		};
	}

	createRole(name: string, colorHex: string, description?: string, icon?: string): Role {
		const role: Role = {
			id: Utils.generateId(),
			name,
			colorHex,
			description,
			icon
		};

		this.data.roles.push(role);
		void this.savePluginData();
		this.refreshSidePanel();

		return role;
	}

	updateRole(roleId: string, updates: Partial<Omit<Role, 'id'>>): void {
		const role = this.data.roles.find(r => r.id === roleId);
		if (!role) {
			throw new Error('Role not found');
		}

		Object.assign(role, updates);
		void this.savePluginData();
		this.refreshSidePanel();
		this.updateStatusBar();
		this.updateWorkspaceBorder();
	}

	deleteRole(roleId: string): void {
		// End session if deleting active role
		if (this.data.state.activeRoleId === roleId) {
			this.endSession();
		}

		// Remove role from roles array
		// NOTE: Historical events/sessions are preserved for data integrity
		// Deleted roles will appear as "Deleted Role" in historical views
		this.data.roles = this.data.roles.filter(r => r.id !== roleId);
		void this.savePluginData();
		this.refreshSidePanel();
	}

	// ====================
	// SESSION MANAGEMENT
	// ====================

	startSession(roleId: string): void {
		const role = this.data.roles.find(r => r.id === roleId);
		if (!role) {
			new Notice('Role not found');
			return;
		}

		// End current session if exists
		if (this.data.state.activeRoleId) {
			this.endSession();
		}

		const sessionId = Utils.generateId();
		const now = new Date().toISOString();

		// Update state
		this.data.state = {
			activeRoleId: roleId,
			activeSessionId: sessionId,
			activeStartAt: now,
			inTransition: false,
			lockUntil: new Date(Date.now() + this.data.settings.minSessionSeconds * 1000).toISOString()
		};

		// Log event
		this.data.events.push({
			id: Utils.generateId(),
			type: 'start',
			roleId,
			at: now,
			meta: { sessionId }
		});

		void this.savePluginData();
		this.updateStatusBar();
		this.updateWorkspaceBorder();
		this.refreshSidePanel();
		this.updateReminderInterval();

		new Notice(`Started ${role.name} session`);
	}

	switchSession(roleId: string): void {
		const role = this.data.roles.find(r => r.id === roleId);
		if (!role) {
			new Notice('Role not found');
			return;
		}

		if (this.data.state.activeRoleId === roleId) {
			new Notice('Already in this role');
			return;
		}

		if (this.isSessionLocked()) {
			const remaining = this.getRemainingLockTime();
			new Notice(`Session locked for ${remaining} more seconds`);
			return;
		}

		// Show transition modal
		new TransitionModal(this.app, this, role).open();
	}

	confirmSwitch(roleId: string): void {
		const role = this.data.roles.find(r => r.id === roleId);
		if (!role) return;

		const now = new Date().toISOString();
		const sessionId = Utils.generateId();

		// Log switch event
		this.data.events.push({
			id: Utils.generateId(),
			type: 'switch',
			roleId,
			at: now,
			meta: {
				sessionId,
				fromRoleId: this.data.state.activeRoleId || undefined
			}
		});

		// Update state
		this.data.state = {
			activeRoleId: roleId,
			activeSessionId: sessionId,
			activeStartAt: now,
			inTransition: false,
			lockUntil: new Date(Date.now() + this.data.settings.minSessionSeconds * 1000).toISOString()
		};

		void this.savePluginData();
		this.updateStatusBar();
		this.updateWorkspaceBorder();
		this.refreshSidePanel();
		this.updateReminderInterval();

		new Notice(`Switched to ${role.name}`);
	}

	endSession(): void {
		if (!this.data.state.activeRoleId) {
			new Notice('No active session');
			return;
		}

		const role = this.data.roles.find(r => r.id === this.data.state.activeRoleId);
		const now = new Date().toISOString();

		// Log end event
		this.data.events.push({
			id: Utils.generateId(),
			type: 'end',
			roleId: this.data.state.activeRoleId,
			at: now,
			meta: {
				sessionId: this.data.state.activeSessionId || undefined,
				duration: this.data.state.activeStartAt ?
					(Date.now() - new Date(this.data.state.activeStartAt).getTime()) / 1000 : undefined
			}
		});

		// Clear state
		this.data.state = {
			activeRoleId: null,
			activeSessionId: null,
			activeStartAt: null,
			inTransition: false,
			lockUntil: null
		};

		void this.savePluginData();
		this.updateStatusBar();
		this.updateWorkspaceBorder();
		this.refreshSidePanel();
		this.stopReminderInterval();

		new Notice(`Ended ${role?.name || 'session'}`);
	}

	// ====================
	// SESSION UTILITIES
	// ====================

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
		return Utils.deriveSessionsFromEvents(this.data.events, startDate, endDate);
	}

	// ====================
	// NOTES MANAGEMENT
	// ====================

	addNote(sessionId: string, text: string): Note {
		const note: Note = {
			id: Utils.generateId(),
			text,
			createdAt: new Date().toISOString()
		};

		// Find session and add note
		const sessions = this.getDerivedSessions();
		const session = sessions.find(s => s.id === sessionId);
		if (session) {
			session.notes.push(note);
		}

		void this.savePluginData();
		return note;
	}

	updateNote(noteId: string, text: string): void {
		const sessions = this.getDerivedSessions();
		for (const session of sessions) {
			const note = session.notes.find(n => n.id === noteId);
			if (note) {
				note.text = text;
				void this.savePluginData();
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
				void this.savePluginData();
				return;
			}
		}
		throw new Error('Note not found');
	}

	// ====================
	// UI MANAGEMENT
	// ====================

	async activateView() {
		const { workspace } = this.app;

		let leaf = workspace.getLeavesOfType(ROLESWITCH_VIEW_TYPE)[0];

		if (!leaf) {
			const leftLeaf = workspace.getLeftLeaf(false);

			if (leftLeaf) {
				leaf = leftLeaf;
				await leaf.setViewState({ type: ROLESWITCH_VIEW_TYPE, active: true });
			} else {
				return;
			}
		}

		if (leaf) {
			await workspace.revealLeaf(leaf);
		}
	}

	refreshSidePanel(): void {
		const leaves = this.app.workspace.getLeavesOfType(ROLESWITCH_VIEW_TYPE);
		leaves.forEach(leaf => {
			if (leaf.view instanceof RoleSwitchView) {
				leaf.view.refresh();
			}
		});
	}

	updateStatusBar(): void {
		if (!this.data.settings.showStatusBar) {
			this.removeStatusBar();
			return;
		}

		if (!this.statusBarItem) {
			this.statusBarItem = this.addStatusBarItem();
			this.statusBarItem.addClass('status-bar-item');
		}

		if (this.data.state.activeRoleId) {
			const role = this.data.roles.find(r => r.id === this.data.state.activeRoleId);
			if (role) {
				this.statusBarItem.setText(`🎯 ${role.name}`);
				this.statusBarItem.addClass('role-active');
				this.statusBarItem.setCssProps({ '--role-color': role.colorHex });
			}
		} else {
			this.statusBarItem.setText('⏸️ no active role');
			this.statusBarItem.addClass('role-inactive');
		}
	}

	removeStatusBar(): void {
		if (this.statusBarItem) {
			this.statusBarItem.remove();
			this.statusBarItem = null;
		}
	}

	updateWorkspaceBorder(): void {
		this.removeWorkspaceBorder();

		if (!this.data.settings.showWorkspaceBorder || !this.data.state.activeRoleId) {
			return;
		}

		const role = this.data.roles.find(r => r.id === this.data.state.activeRoleId);
		if (!role) return;

		this.borderEl = document.createElement('div');
		this.borderEl.addClass('workspace-border');
		this.borderEl.setCssProps({
			'--role-color': role.colorHex,
			'--border-opacity': this.data.settings.borderOpacity.toString()
		});
		this.borderEl.setAttribute('data-role-switch-border', 'true');

		// Append to app container instead of body for better compatibility
		const appContainer = document.querySelector('.app-container') || document.body;
		appContainer.appendChild(this.borderEl);
	}

	removeWorkspaceBorder(): void {
		if (this.borderEl) {
			this.borderEl.remove();
			this.borderEl = null;
		}
	}

	// ====================
	// COMMANDS
	// ====================

	private registerCommands(): void {
		// Open side panel
		this.addCommand({
			id: 'open-panel',
			name: 'Open panel',
			callback: () => {
				void this.activateView();
			}
		});

		// Open dashboard
		this.addCommand({
			id: 'open-dashboard',
			name: 'Open dashboard',
			callback: () => {
				new RoleDashboardModal(this.app, this).open();
			}
		});

		// Start/Resume role
		this.addCommand({
			id: 'start-session',
			name: 'Start session',
			callback: () => {
				new RolePickerModal(this.app, this, 'start').open();
			}
		});

		// Switch role
		this.addCommand({
			id: 'switch-session',
			name: 'Switch session',
			callback: () => {
				if (!this.data.state.activeRoleId) {
					new Notice('No active session to switch from');
					return;
				}
				new RolePickerModal(this.app, this, 'switch').open();
			}
		});

		// End current role
		this.addCommand({
			id: 'end-session',
			name: 'End current session',
			callback: () => {
				this.endSession();
			}
		});

		// Add note command
		this.addCommand({
			id: 'add-note',
			name: 'Add note to current session',
			callback: () => {
				if (!this.data.state.activeSessionId) {
					new Notice('No active session to add note to');
					return;
				}
				new NoteEditModal(this.app, this, this.data.state.activeSessionId, null).open();
			}
		});

		// API commands
		this.addCommand({
			id: 'start-api-server',
			name: 'Start API server',
			callback: () => {
				if (!this.api) {
					new Notice('API not initialized');
					return;
				}
				try {
					this.api.startServer();
					new Notice('API server started successfully');
				} catch (error) {
					new Notice(`Failed to start API server: ${error}`);
				}
			}
		});

		this.addCommand({
			id: 'stop-api-server',
			name: 'Stop API server',
			callback: () => {
				if (!this.api) {
					new Notice('API not initialized');
					return;
				}
				try {
					this.api.stopServer();
					new Notice('API server stopped successfully');
				} catch (error) {
					new Notice(`Failed to stop API server: ${error}`);
				}
			}
		});
	}

	// ====================
	// API METHODS
	// ====================

	getApiStatus() {
		return this.api ? this.api.getStatus() : null;
	}

	startApiServer() {
		if (this.api) {
			this.api.startServer();
		}
	}

	stopApiServer() {
		if (this.api) {
			this.api.stopServer();
		}
	}

	handleApiRequest(method: string, url: string, headers: Record<string, string>, body?: unknown) {
		if (!this.httpServer) {
			return {
				statusCode: 503,
				headers: { 'Content-Type': 'application/json' },
				body: { success: false, error: 'API server not initialized' }
			};
		}

		return this.httpServer.handleRequest({
			method,
			url,
			headers,
			body
		});
	}

	// ====================
	// UTILITY METHODS
	// ====================

	private generateDeviceId(): string {
		return Math.random().toString(36).substring(2, 15) +
			Math.random().toString(36).substring(2, 15);
	}

	// ====================
	// PERIODIC REMINDER
	// ====================

	updateReminderInterval(): void {
		this.stopReminderInterval();

		if (this.data.settings.showPeriodicReminder && this.data.state.activeRoleId) {
			this.startReminderInterval();
		}
	}

	private startReminderInterval(): void {
		if (!this.data.settings.showPeriodicReminder || !this.data.state.activeRoleId) {
			return;
		}

		const intervalMs = this.data.settings.reminderIntervalMinutes * 60 * 1000;

		// Show first reminder immediately
		this.showRoleReminder();

		// Then repeat at the interval - use registerInterval for proper Obsidian lifecycle management
		this.reminderInterval = this.registerInterval(window.setInterval(() => {
			this.showRoleReminder();
		}, intervalMs));
	}

	private stopReminderInterval(): void {
		if (this.reminderInterval !== null) {
			window.clearInterval(this.reminderInterval);
			this.reminderInterval = null;
		}
	}

	private showRoleReminder(): void {
		if (!this.data.state.activeRoleId) {
			return;
		}

		const role = this.data.roles.find(r => r.id === this.data.state.activeRoleId);
		if (!role) {
			return;
		}

		// Create a styled notice with the role color
		const fragment = document.createDocumentFragment();
		const span = document.createElement('span');
		span.addClass('role-color-bold');
		span.setCssProps({ '--role-color': role.colorHex });
		span.textContent = `You are now playing the role of '${role.name}'. Don't forget, you are playing the role of '${role.name}'.`;
		fragment.appendChild(span);

		new Notice(fragment, 8000);
	}
}