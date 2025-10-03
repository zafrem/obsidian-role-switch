// Type definitions and interfaces for RoleSwitch plugin

export interface Role {
	id: string;
	name: string;
	colorHex: string;
	description?: string;
	icon?: string;
}

export interface Note {
	id: string;
	text: string;
	createdAt: string;
}

export interface Session {
	id: string;
	roleId: string;
	startAt: string;
	endAt?: string;
	notes: Note[];
}

export interface ApiKey {
	id: string;
	name: string;
	key: string;
	secret: string;
	createdAt: string;
	lastUsed?: string;
	permissions: ApiPermission[];
	isActive: boolean;
}

export interface SyncEndpoint {
	id: string;
	name: string;
	url: string;
	apiKey: string;
	isActive: boolean;
	lastSync?: string;
	syncDirection: 'push' | 'pull' | 'bidirectional';
}

export type ApiPermission = 'read' | 'write' | 'admin';

export interface RoleSwitchSettings {
	transitionSeconds: number;
	minSessionSeconds: number;
	showStatusBar: boolean;
	showWorkspaceBorder: boolean;
	borderOpacity: number;
	enableApi: boolean;
	apiPort: number;
	enableAuthentication: boolean;
	enableSync: boolean;
	syncInterval: number; // minutes
	deviceId: string;
	deviceName: string;
	showPeriodicReminder: boolean;
	reminderIntervalMinutes: number;
}

export interface RoleSwitchState {
	activeRoleId: string | null;
	activeSessionId: string | null;
	activeStartAt: string | null;
	inTransition: boolean;
	lockUntil: string | null;
}

export interface RoleSwitchEvent {
	id: string;
	type: 'start' | 'end' | 'switch' | 'cancelTransition';
	roleId: string;
	at: string;
	meta?: {
		sessionId?: string;
		fromRoleId?: string;
		toRoleId?: string;
		transitionSeconds?: number;
		duration?: number;
		reason?: string;
	};
}

export interface RoleSwitchData {
	roles: Role[];
	events: RoleSwitchEvent[];
	state: RoleSwitchState;
	settings: RoleSwitchSettings;
	apiKeys: ApiKey[];
	syncEndpoints: SyncEndpoint[];
}

export const DEFAULT_SETTINGS: RoleSwitchSettings = {
	transitionSeconds: 30,
	minSessionSeconds: 300,
	showStatusBar: true,
	showWorkspaceBorder: true,
	borderOpacity: 0.3,
	enableApi: false,
	apiPort: 3030,
	enableAuthentication: true,
	enableSync: false,
	syncInterval: 5,
	deviceId: '',
	deviceName: 'Obsidian Device',
	showPeriodicReminder: false,
	reminderIntervalMinutes: 1
};

export const ROLESWITCH_VIEW_TYPE = 'role-switch-view';

// Interface for Obsidian's color picker component
export interface ColorPickerComponent {
	inputEl?: HTMLInputElement;
	input?: HTMLInputElement;
	getValue(): string;
	setValue(value: string): this;
}

// Interface for the RoleEditModal to handle color component properly
export interface RoleEditModalInterface {
	colorComponent?: ColorPickerComponent;
}