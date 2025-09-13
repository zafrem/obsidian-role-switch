// TaskSwitch Plugin - Main Entry Point

import { Plugin, Notice, TFile } from 'obsidian';
import { 
	TaskSwitchData, 
	TaskSwitchSettings, 
	DEFAULT_SETTINGS, 
	TASKSWITCH_VIEW_TYPE,
	Role,
	Note,
	Session,
	TaskSwitchEvent
} from './src/types';
import { Utils } from './src/utils';
import { TaskSwitchView } from './src/views/SidePanelView';
import { TransitionModal, RolePickerModal, NoteEditModal, RoleDashboardModal } from './src/views/Modals';
import { TaskSwitchSettingsTab } from './src/settings/Settings';

export default class TaskSwitchPlugin extends Plugin {
	data: TaskSwitchData;
	statusBarItem: HTMLElement | null = null;
	borderEl: HTMLElement | null = null;

	async onload() {
		console.log('TaskSwitchPlugin: onload called');
		await this.loadPluginData();
		console.log('TaskSwitchPlugin: Plugin data loaded');
		
		// Register side panel view
		console.log('TaskSwitchPlugin: Registering view type:', TASKSWITCH_VIEW_TYPE);
		this.registerView(TASKSWITCH_VIEW_TYPE, (leaf) => {
			console.log('TaskSwitchPlugin: Creating TaskSwitchView for leaf:', leaf);
			return new TaskSwitchView(leaf, this);
		});
		console.log('TaskSwitchPlugin: View registered successfully');
		
		// Add ribbon icon for side panel
		console.log('TaskSwitchPlugin: Adding ribbon icon...');
		this.addRibbonIcon('clock', 'TaskSwitch Panel', () => {
			console.log('TaskSwitchPlugin: Ribbon icon clicked, activating view...');
			this.activateView();
		});
		console.log('TaskSwitchPlugin: Ribbon icon added');

		// Register commands
		this.registerCommands();

		// Add settings tab
		this.addSettingTab(new TaskSwitchSettingsTab(this.app, this));

		// Initialize UI elements
		this.updateStatusBar();
		this.updateWorkspaceBorder();

		// Auto-save data periodically
		this.registerInterval(window.setInterval(() => {
			this.savePluginData();
		}, 60000)); // Save every minute
	}

	onunload() {
		this.removeStatusBar();
		this.removeWorkspaceBorder();
	}

	// ====================
	// DATA MANAGEMENT
	// ====================

	async loadPluginData() {
		const defaultData: TaskSwitchData = {
			roles: [],
			events: [],
			state: {
				activeRoleId: null,
				activeSessionId: null,
				activeStartAt: null,
				inTransition: false,
				lockUntil: null
			},
			settings: { ...DEFAULT_SETTINGS }
		};

		this.data = Object.assign(defaultData, await this.loadData());
	}

	async savePluginData() {
		await this.saveData(this.data);
	}

	// ====================
	// ROLE MANAGEMENT
	// ====================

	createRole(name: string, colorHex: string, description?: string, icon?: string): Role {
		console.log('TaskSwitchPlugin.createRole called with:', { name, colorHex, description, icon });
		
		const role: Role = {
			id: Utils.generateId(),
			name,
			colorHex,
			description,
			icon
		};

		console.log('TaskSwitchPlugin.createRole: Created role object:', role);
		
		this.data.roles.push(role);
		console.log('TaskSwitchPlugin.createRole: Added to roles array, total roles:', this.data.roles.length);
		
		this.savePluginData();
		console.log('TaskSwitchPlugin.createRole: Saved plugin data');
		
		this.refreshSidePanel();
		console.log('TaskSwitchPlugin.createRole: Refreshed side panel');
		
		return role;
	}

	updateRole(roleId: string, updates: Partial<Omit<Role, 'id'>>): void {
		const role = this.data.roles.find(r => r.id === roleId);
		if (!role) {
			throw new Error('Role not found');
		}

		Object.assign(role, updates);
		this.savePluginData();
		this.refreshSidePanel();
		this.updateStatusBar();
		this.updateWorkspaceBorder();
	}

	deleteRole(roleId: string): void {
		// End session if deleting active role
		if (this.data.state.activeRoleId === roleId) {
			this.endSession();
		}

		this.data.roles = this.data.roles.filter(r => r.id !== roleId);
		this.savePluginData();
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

		this.savePluginData();
		this.updateStatusBar();
		this.updateWorkspaceBorder();
		this.refreshSidePanel();

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

		this.savePluginData();
		this.updateStatusBar();
		this.updateWorkspaceBorder();
		this.refreshSidePanel();

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

		this.savePluginData();
		this.updateStatusBar();
		this.updateWorkspaceBorder();
		this.refreshSidePanel();

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

		this.savePluginData();
		return note;
	}

	updateNote(noteId: string, text: string): void {
		const sessions = this.getDerivedSessions();
		for (const session of sessions) {
			const note = session.notes.find(n => n.id === noteId);
			if (note) {
				note.text = text;
				this.savePluginData();
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
				this.savePluginData();
				return;
			}
		}
		throw new Error('Note not found');
	}

	// ====================
	// UI MANAGEMENT
	// ====================

	async activateView() {
		console.log('TaskSwitchPlugin: activateView called');
		const { workspace } = this.app;
		
		console.log('TaskSwitchPlugin: Looking for existing leaf...');
		let leaf = workspace.getLeavesOfType(TASKSWITCH_VIEW_TYPE)[0];
		console.log('TaskSwitchPlugin: Existing leaf found:', !!leaf);
		
		if (!leaf) {
			console.log('TaskSwitchPlugin: No existing leaf, creating new one...');
			const leftLeaf = workspace.getLeftLeaf(false);
			console.log('TaskSwitchPlugin: Left leaf available:', !!leftLeaf);
			
			if (leftLeaf) {
				leaf = leftLeaf;
				console.log('TaskSwitchPlugin: Setting view state to', TASKSWITCH_VIEW_TYPE);
				await leaf.setViewState({ type: TASKSWITCH_VIEW_TYPE, active: true });
				console.log('TaskSwitchPlugin: View state set successfully');
			} else {
				console.error('TaskSwitchPlugin: No left leaf available!');
			}
		}
		
		if (leaf) {
			console.log('TaskSwitchPlugin: Revealing leaf...');
			workspace.revealLeaf(leaf);
			console.log('TaskSwitchPlugin: Leaf revealed successfully');
		} else {
			console.error('TaskSwitchPlugin: No leaf available to reveal!');
		}
	}

	refreshSidePanel(): void {
		const leaves = this.app.workspace.getLeavesOfType(TASKSWITCH_VIEW_TYPE);
		leaves.forEach(leaf => {
			if (leaf.view instanceof TaskSwitchView) {
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
		}

		if (this.data.state.activeRoleId) {
			const role = this.data.roles.find(r => r.id === this.data.state.activeRoleId);
			if (role) {
				this.statusBarItem.setText(`🎯 ${role.name}`);
				this.statusBarItem.style.color = role.colorHex;
			}
		} else {
			this.statusBarItem.setText('⏸️ No active role');
			this.statusBarItem.style.color = 'var(--text-muted)';
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
		this.borderEl.style.position = 'fixed';
		this.borderEl.style.top = '0';
		this.borderEl.style.left = '0';
		this.borderEl.style.right = '0';
		this.borderEl.style.bottom = '0';
		this.borderEl.style.border = `3px solid ${role.colorHex}`;
		this.borderEl.style.pointerEvents = 'none';
		this.borderEl.style.zIndex = '9999';
		this.borderEl.style.opacity = this.data.settings.borderOpacity.toString();

		document.body.appendChild(this.borderEl);
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
			id: 'open-taskswitch-panel',
			name: 'Open TaskSwitch Panel',
			callback: () => {
				this.activateView();
			}
		});

		// Open dashboard
		this.addCommand({
			id: 'open-role-dashboard',
			name: 'Open Role Dashboard',
			callback: () => {
				new RoleDashboardModal(this.app, this).open();
			}
		});

		// Start/Resume role
		this.addCommand({
			id: 'start-role',
			name: 'Start/Resume Role',
			callback: () => {
				new RolePickerModal(this.app, this, 'start').open();
			}
		});

		// Switch role
		this.addCommand({
			id: 'switch-role',
			name: 'Switch Role',
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
			id: 'end-current-role',
			name: 'End Current Role',
			callback: () => {
				this.endSession();
			}
		});

		// Add note command
		this.addCommand({
			id: 'add-note',
			name: 'Add Note to Current Session',
			callback: () => {
				if (!this.data.state.activeSessionId) {
					new Notice('No active session to add note to');
					return;
				}
				new NoteEditModal(this.app, this, this.data.state.activeSessionId, null).open();
			}
		});
	}
}