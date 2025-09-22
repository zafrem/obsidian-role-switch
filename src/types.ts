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

export interface RoleSwitchSettings {
	transitionSeconds: number;
	minSessionSeconds: number;
	showStatusBar: boolean;
	showWorkspaceBorder: boolean;
	borderOpacity: number;
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
}

export const DEFAULT_SETTINGS: RoleSwitchSettings = {
	transitionSeconds: 30,
	minSessionSeconds: 300,
	showStatusBar: true,
	showWorkspaceBorder: true,
	borderOpacity: 0.3
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