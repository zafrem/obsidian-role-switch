import { App, Plugin, PluginSettingTab, Setting, Modal, Notice, TFile, Platform, ItemView, WorkspaceLeaf } from 'obsidian';

// Side panel constants
export const TASKSWITCH_VIEW_TYPE = "taskswitch-view";

// Core data models based on SRS v2
export interface Role {
	id: string;
	name: string;
	colorHex: string;
	description?: string;
	icon?: string; // Icon identifier
}

export interface Note {
	id: string;
	sessionId: string;
	text: string;
	at: string; // ISO timestamp
}

export interface Event {
	id: string;
	type: 'start' | 'switch' | 'end' | 'cancelTransition' | 'noteAdded' | 'noteEdited' | 'noteRemoved';
	roleId: string;
	at: string; // ISO timestamp
	meta?: {
		fromRoleId?: string;
		transitionSeconds?: number;
		noteId?: string;
		noteText?: string;
		sessionId?: string;
	};
}

export interface Session {
	id: string;
	roleId: string;
	startAt: string;
	endAt?: string;
	notes: Note[];
}

export interface TaskSwitchSettings {
	transitionSeconds: number;
	minSessionSeconds: number;
	showStatusBar: boolean;
	showBorder: boolean;
	borderOpacity: number;
	defaultAnalyticsRangeDays: number;
	exportTimezone: 'local' | 'utc';
}

export interface TaskSwitchState {
	activeRoleId: string | null;
	activeSessionId: string | null;
	activeStartAt: string | null;
	lockUntil: string | null;
}

export interface TaskSwitchData {
	version: number;
	roles: Role[];
	events: Event[];
	notes: Note[];
	settings: TaskSwitchSettings;
	state: TaskSwitchState;
}

// Default settings per SRS
const DEFAULT_SETTINGS: TaskSwitchSettings = {
	transitionSeconds: 30,
	minSessionSeconds: 300, // 5 minutes
	showStatusBar: true,
	showBorder: true,
	borderOpacity: 0.4,
	defaultAnalyticsRangeDays: 7,
	exportTimezone: 'local'
};

const DEFAULT_STATE: TaskSwitchState = {
	activeRoleId: null,
	activeSessionId: null,
	activeStartAt: null,
	lockUntil: null
};

// Icon System - Comprehensive SVG Icons Library
class IconLibrary {
	static readonly ICONS: { [key: string]: string } = {
		// Work & Productivity
		'laptop': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 18c1.1 0 1.99-.9 1.99-2L22 5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 5h16v11H4V5z"/></svg>',
		'code': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>',
		'design': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7h-6v13h-2v-6h-2v6H9V9H3V7h18v2z"/></svg>',
		'write': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>',
		'research': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>',
		'meeting': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63c-.34-1.02-1.28-1.65-2.34-1.65-.53 0-1.04.16-1.46.44L14 8.77c-.8.72-1.3 1.76-1.3 2.9v11.33h2V20h4z"/><circle cx="12.5" cy="11.5" r="1.5"/><path d="M10.5 11.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5z"/></svg>',
		'planning': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>',
		
		// Learning & Growth  
		'learning': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/></svg>',
		'book': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>',
		'brain': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.5 2c1.38 0 2.5 1.12 2.5 2.5S10.88 7 9.5 7 7 5.88 7 4.5 8.12 2 9.5 2zm5 0c1.38 0 2.5 1.12 2.5 2.5S15.88 7 14.5 7 12 5.88 12 4.5 13.12 2 14.5 2zM12 14c1.1 0 2-.9 2-2 0-1.1-.9-2-2-2s-2 .9-2 2c0 1.1.9 2 2 2zm0 8c1.1 0 2-.9 2-2 0-1.1-.9-2-2-2s-2 .9-2 2c0 1.1.9 2 2 2z"/></svg>',
		'experiment': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 2v3h1v2.28c-.6.35-1 .98-1 1.72 0 1.1.9 2 2 2s2-.9 2-2c0-.74-.4-1.37-1-1.72V7h1V5h1V2H9zM4 22h16l-2-6H6l-2 6z"/></svg>',
		
		// Communication & Social
		'communication': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>',
		'email': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>',
		'phone': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>',
		'team': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63c-.34-1.02-1.28-1.65-2.34-1.65-.53 0-1.04.16-1.46.44L14 8.77c-.8.72-1.3 1.76-1.3 2.9v11.33h2V20h4zM12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5z"/></svg>',
		
		// Health & Wellness
		'health': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10.5 13H8v-3h2.5V7.5h3V10H16v3h-2.5v2.5h-3V13zM12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"/></svg>',
		'fitness': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L4.14 10.57 2.71 12l1.43 1.43L6.29 11.29l8.57 8.57L11.43 23 13 21.43 14.43 23 16.57 20.86 18 22.29 19.43 20.86 22 18.29z"/></svg>',
		'meditation': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1s1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm1 13h-2v-2h2v2zm0-4h-2V7h2v4z"/></svg>',
		'break': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>',
		
		// Creative & Arts
		'art': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3c-4.97 0-9 4.03-9 9 0 4.17 2.84 7.67 6.69 8.69L12 15l2.31 5.69C18.16 19.67 21 16.17 21 12c0-4.97-4.03-9-9-9zm-1.5 5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5S10.5 8.83 10.5 8z"/></svg>',
		'music': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>',
		'photo': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>',
		'video': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4zM14 13h-3v3H9v-3H6v-2h3V8h2v3h3v2z"/></svg>',
		
		// Finance & Business
		'finance': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.42 0 2.13.54 2.39 1.4.12.4.45.7.87.7h.3c.44 0 .79-.36.72-.8C15.96 5.86 14.68 5 13 4.84V4c0-.55-.45-1-1-1s-1 .45-1 1v.84C9.33 5.16 8 6.54 8 8.75c0 2.44 1.73 3.59 4.2 4.18 2.27.59 3 1.2 3 2.15 0 1.09-1.01 1.85-2.7 1.85-1.78 0-2.44-.85-2.5-2.1-.02-.48-.4-.85-.89-.85h-.3c-.44 0-.79.36-.72.8.22 2.34 1.5 3.2 3.11 3.36V20c0 .55.45 1 1 1s1-.45 1-1v-.84c1.67-.32 3-1.7 3-3.91 0-2.44-1.73-3.59-4.2-4.18z"/></svg>',
		'business': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>',
		'marketing': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/></svg>',
		'sales': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>',
		
		// Personal & Lifestyle
		'home': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>',
		'travel': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/></svg>',
		'food': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.1 13.34l2.83-2.83L3.91 3.5c-1.56 1.56-1.56 4.09 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z"/></svg>',
		'shopping': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>',
		
		// System & Tools
		'settings': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>',
		'star': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>',
		'heart': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
		'lightning': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>',
		'target': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-5-8c0-2.76 2.24-5 5-5s5 2.24 5 5-2.24 5-5 5-5-2.24-5-5zm8 0c0-1.66-1.34-3-3-3s-3 1.34-3 3 1.34 3 3 3 3-1.34 3-3z"/></svg>',
		'rocket': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.19 6.35c-2.04 2.29-3.44 5.58-3.44 5.58L2 15.59 8.41 22l3.66-3.75s3.29-1.4 5.58-3.44C20.1 12.3 21.77 5.65 12.35.23c-6.74 4.02-3.16 6.12-3.16 6.12z"/><circle cx="10.5" cy="10.5" r="1.5"/></svg>',
		'flag': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/></svg>',
		'gear': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l1.86-1.41c.2-.15.25-.42.13-.64l-1.86-3.23c-.12-.22-.39-.3-.61-.22l-2.17.87c-.5-.38-1.03-.7-1.62-.94L15.5 2.38c-.05-.26-.27-.38-.5-.38h-3.73c-.24 0-.46.14-.5.38l-.37 2.24c-.59.24-1.13.57-1.62.94l-2.17-.87c-.22-.08-.5 0-.61.22L4.14 8.14c-.12.22-.07.49.13.64L6.14 10.5c-.04.32-.07.65-.07.97 0 .32.03.65.07.97l-1.87 1.41c-.2.15-.25.42-.13.64l1.86 3.23c.12.22.39.3.61.22l2.17-.87c.5.38 1.03.7 1.62.94l.37 2.24c.05.26.27.38.5.38h3.73c.24 0 .46-.14.5-.38l.37-2.24c.59-.24 1.13-.57 1.62-.94l2.17.87c.22.08.5 0 .61-.22l1.86-3.23c.12-.22.07-.49-.13-.64l-1.87-1.41z"/></svg>',
		'diamond': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6,2L2,8L12,22L22,8L18,2H6M6.5,4H9.5L8,7L6.5,4M10.5,4H13.5L12,7L10.5,4M14.5,4H17.5L16,7L14.5,4M8.5,9L10,12L7,12L8.5,9M11,9H13L12,12L11,9M15.5,9L17,12L14,12L15.5,9Z"/></svg>',
		'pause': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14,19H18V5H14M6,19H10V5H6V19Z" /></svg>',
		'lock': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12,1A7,7 0 0,0 5,8V10A3,3 0 0,0 2,13V21A3,3 0 0,0 5,24H19A3,3 0 0,0 22,21V13A3,3 0 0,0 19,10V8A7,7 0 0,0 12,1M12,3A5,5 0 0,1 17,8V10H7V8A5,5 0 0,1 12,3M20,13V21A1,1 0 0,1 19,22H5A1,1 0 0,1 4,21V13A1,1 0 0,1 5,12H19A1,1 0 0,1 20,13Z" /></svg>'
	};

	static getIcon(iconKey: string): string {
		return this.ICONS[iconKey as keyof typeof this.ICONS] || this.ICONS.star;
	}

	// Helper method to create icon-enhanced notices
	static createIconNotice(message: string, iconKey: string, duration: number = 4000): void {
		const icon = this.ICONS[iconKey] || '';
		
		// Create a temporary container for the notice content
		const container = document.createElement('div');
		container.style.display = 'flex';
		container.style.alignItems = 'center';
		container.style.gap = '8px';
		
		if (icon) {
			const iconEl = document.createElement('div');
			iconEl.style.width = '16px';
			iconEl.style.height = '16px';
			iconEl.style.display = 'flex';
			iconEl.style.alignItems = 'center';
			iconEl.style.justifyContent = 'center';
			// Parse SVG safely
			const parser = new DOMParser();
			const doc = parser.parseFromString(icon, 'image/svg+xml');
			const svg = doc.documentElement.cloneNode(true) as SVGElement;
			iconEl.appendChild(svg);
			container.appendChild(iconEl);
		}
		
		const textEl = document.createElement('span');
		textEl.textContent = message;
		container.appendChild(textEl);
		
		// Convert to HTML string and create notice
		const notice = new Notice('', duration);
		notice.noticeEl.empty();
		notice.noticeEl.appendChild(container);
	}

	static getAllIcons(): Array<{ key: string; name: string; svg: string }> {
		return Object.entries(this.ICONS).map(([key, svg]) => ({
			key,
			name: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
			svg
		}));
	}

	static renderIcon(iconKey: string, size: number = 24, color: string = 'currentColor'): string {
		const svg = this.getIcon(iconKey);
		return svg.replace('fill="currentColor"', `fill="${color}"`).replace('viewBox="0 0 24 24"', `viewBox="0 0 24 24" width="${size}" height="${size}"`);
	}

	static createIconElement(iconKey: string, size: number = 24, color: string = 'currentColor'): HTMLElement {
		const container = document.createElement('div');
		container.style.display = 'inline-flex';
		container.style.alignItems = 'center';
		container.style.justifyContent = 'center';
		
		const iconSvg = this.getIcon(iconKey);
		if (iconSvg) {
			// Parse SVG safely using DOMParser
			const parser = new DOMParser();
			const doc = parser.parseFromString(iconSvg, 'image/svg+xml');
			const svg = doc.documentElement.cloneNode(true) as SVGElement;
			
			// Set attributes safely
			svg.setAttribute('width', size.toString());
			svg.setAttribute('height', size.toString());
			svg.setAttribute('fill', color);
			
			container.appendChild(svg);
		} else {
			// Fallback text
			container.textContent = '⚙️';
		}
		
		return container;
	}
}

// TaskSwitch Side Panel View
export class TaskSwitchView extends ItemView {
	private plugin: TaskSwitchPlugin;

	constructor(leaf: WorkspaceLeaf, plugin: TaskSwitchPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType() {
		return TASKSWITCH_VIEW_TYPE;
	}

	getDisplayText() {
		return "TaskSwitch";
	}

	getIcon() {
		return "clock";
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		container.addClass('taskswitch-view');

		// Add custom styles for side panel
		this.addSidePanelStyles();

		// Create side panel dashboard
		this.createSidePanelDashboard(container as HTMLElement);
	}

	async onClose() {
		// Cleanup if needed
	}

	private addSidePanelStyles(): void {
		// Add custom CSS for side panel styling
		const style = document.createElement('style');
		style.textContent = `
			.taskswitch-view {
				padding: 16px;
				height: 100%;
				overflow-y: auto;
			}
			
			.taskswitch-view .side-panel-header {
				display: flex;
				align-items: center;
				gap: 8px;
				margin-bottom: 16px;
				padding-bottom: 8px;
				border-bottom: 1px solid var(--background-modifier-border);
			}
			
			.taskswitch-view .role-card-compact {
				border-radius: 8px;
				padding: 12px;
				margin-bottom: 8px;
				cursor: pointer;
				transition: all 0.2s ease;
				border: 1px solid var(--background-modifier-border);
			}
			
			.taskswitch-view .role-card-compact:hover {
				transform: translateY(-2px);
				box-shadow: 0 4px 12px rgba(0,0,0,0.15);
			}
			
			.taskswitch-view .current-status-compact {
				background: var(--background-secondary);
				border-radius: 8px;
				padding: 12px;
				margin-bottom: 16px;
				border-left: 4px solid var(--interactive-accent);
			}
			
			.taskswitch-view .side-panel-section {
				margin-bottom: 20px;
			}
			
			.taskswitch-view .side-panel-section h3 {
				margin: 0 0 12px 0;
				font-size: 14px;
				font-weight: 600;
				color: var(--text-muted);
				text-transform: uppercase;
				letter-spacing: 0.5px;
			}
		`;
		
		// Only add if not already present
		if (!document.querySelector('#taskswitch-side-panel-styles')) {
			style.id = 'taskswitch-side-panel-styles';
			document.head.appendChild(style);
		}
	}

	private createSidePanelDashboard(container: HTMLElement): void {
		// Header with plugin branding
		const header = container.createDiv({ cls: 'side-panel-header' });
		
		// TaskSwitch icon using existing icon library
		const headerIcon = header.createDiv({
			attr: {
				style: `
					width: 20px;
					height: 20px;
					display: flex;
					align-items: center;
					justify-content: center;
					color: var(--interactive-accent);
				`
			}
		});
		const iconElement = IconLibrary.createIconElement('gear', 20, 'var(--interactive-accent)');
		headerIcon.appendChild(iconElement.firstChild as Node);
		
		header.createEl('h2', { 
			text: 'TaskSwitch', 
			cls: 'header-title'
		});

		// Roles section (moved to top)
		this.createCompactRolesSection(container);

		// Quick actions section  
		this.createQuickActionsSection(container);

		// Current status section
		this.createCompactStatusSection(container);
	}

	private createCompactStatusSection(container: HTMLElement): void {
		const statusSection = container.createDiv({ cls: 'side-panel-section' });
		statusSection.createEl('h3', { text: 'Current History' });

		const statusCard = statusSection.createDiv({ cls: 'current-status-compact' });

		// Current active session
		if (this.plugin.data.state.activeRoleId) {
			const activeRole = this.plugin.data.roles.find(r => r.id === this.plugin.data.state.activeRoleId);
			if (activeRole) {
				const statusInfo = statusCard.createDiv({
					cls: 'status-info'
				});

				// Role icon/color
				const roleIndicator = statusInfo.createDiv({
					cls: 'role-indicator'
				});
				roleIndicator.style.backgroundColor = activeRole.colorHex;

				if (activeRole.icon && IconLibrary.ICONS[activeRole.icon]) {
					const iconElement = IconLibrary.createIconElement(activeRole.icon, 12, 'white');
					iconElement.style.filter = 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))';
					roleIndicator.appendChild(iconElement);
				}

				// Role info
				const roleInfo = statusInfo.createDiv({ cls: 'role-info' });
				const roleName = roleInfo.createEl('div', {
					text: activeRole.name,
					cls: 'role-name'
				});
				roleName.style.color = activeRole.colorHex;

				// Duration
				if (this.plugin.data.state.activeStartAt) {
					const startTime = new Date(this.plugin.data.state.activeStartAt);
					const duration = Math.floor((Date.now() - startTime.getTime()) / (1000 * 60));
					roleInfo.createEl('div', {
						text: `${duration}min`,
						cls: 'role-duration'
					});
				}

				// Lock status
				if (this.plugin.isSessionLocked()) {
					const remaining = this.plugin.getRemainingLockTime();
					statusCard.createDiv({
						text: `🔒 Locked (${remaining}s)`,
						cls: 'session-locked'
					});
				}
			}
		} else {
			statusCard.createDiv({
				text: '⏸️ No active session',
				cls: 'no-active-session'
			});
		}

		// Today's session history
		this.createTodayHistorySection(statusCard);
	}

	private createTodayHistorySection(container: HTMLElement): void {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		
		// Get today's sessions
		const todaySessions = this.plugin.getDerivedSessions(today, new Date());
		
		if (todaySessions.length > 0) {
			// History header
			const historyHeader = container.createDiv({
				attr: { style: 'border-top: 1px solid var(--background-modifier-border); padding-top: 8px; margin-top: 8px;' }
			});
			historyHeader.createEl('div', {
				text: "Today's History",
				attr: { style: 'font-size: 11px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px;' }
			});

			// Show last 3 sessions
			const recentSessions = todaySessions.slice(-3);
			recentSessions.forEach(session => {
				const role = this.plugin.data.roles.find(r => r.id === session.roleId);
				if (role) {
					const sessionEl = container.createDiv({
						attr: { style: 'display: flex; align-items: center; gap: 6px; margin-bottom: 4px; padding: 4px; border-radius: 4px; background: var(--background-secondary);' }
					});

					// Small role indicator
					const indicator = sessionEl.createDiv({
						attr: {
							style: `
								width: 12px;
								height: 12px;
								border-radius: 50%;
								background-color: ${role.colorHex};
								flex-shrink: 0;
							`
						}
					});

					// Session info
					const sessionInfo = sessionEl.createDiv({ attr: { style: 'flex: 1; min-width: 0;' } });
					const startTime = new Date(session.startAt).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
					// Calculate duration
					let duration = 0;
					if (session.endAt) {
						duration = Math.round((new Date(session.endAt).getTime() - new Date(session.startAt).getTime()) / (1000 * 60));
					} else if (session.id === this.plugin.data.state.activeSessionId) {
						duration = Math.round((Date.now() - new Date(session.startAt).getTime()) / (1000 * 60));
					}
					
					sessionInfo.createEl('div', {
						text: `${role.name} • ${startTime} • ${duration}min`,
						attr: { style: 'font-size: 10px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;' }
					});
				}
			});

			// Show more indicator if there are more sessions
			if (todaySessions.length > 3) {
				container.createEl('div', {
					text: `+${todaySessions.length - 3} more sessions`,
					attr: { style: 'font-size: 10px; color: var(--text-muted); font-style: italic; text-align: center; margin-top: 4px;' }
				});
			}
		}
	}

	private createQuickActionsSection(container: HTMLElement): void {
		const actionsSection = container.createDiv({ cls: 'side-panel-section' });
		actionsSection.createEl('h3', { text: 'Quick Actions' });

		const actionsContainer = actionsSection.createDiv({
			attr: { style: 'display: flex; flex-direction: column; gap: 6px;' }
		});

		// Open full dashboard button
		const dashboardBtn = actionsContainer.createEl('button', {
			text: '📊 Open Dashboard',
			attr: {
				style: `
					padding: 8px 12px;
					border: 1px solid var(--background-modifier-border);
					border-radius: 4px;
					background: var(--background-primary);
					color: var(--text-normal);
					cursor: pointer;
					font-size: 12px;
					transition: all 0.2s ease;
				`
			}
		});
		dashboardBtn.addEventListener('click', () => {
			new RoleDashboardModal(this.app, this.plugin).open();
		});

		// End session button (if active)
		if (this.plugin.data.state.activeRoleId && !this.plugin.isSessionLocked()) {
			const endBtn = actionsContainer.createEl('button', {
				text: '⏹️ End Session',
				attr: {
					style: `
						padding: 8px 12px;
						border: 1px solid var(--text-error);
						border-radius: 4px;
						background: var(--background-primary);
						color: var(--text-error);
						cursor: pointer;
						font-size: 12px;
						transition: all 0.2s ease;
					`
				}
			});
			endBtn.addEventListener('click', () => {
				this.plugin.endSession();
				this.refresh();
			});
		}
	}

	private createCompactRolesSection(container: HTMLElement): void {
		const rolesSection = container.createDiv({ cls: 'side-panel-section' });
		rolesSection.createEl('h3', { text: 'Roles' });

		if (this.plugin.data.roles.length === 0) {
			rolesSection.createDiv({
				text: 'No roles defined',
				attr: { style: 'color: var(--text-muted); font-style: italic; text-align: center; padding: 20px;' }
			});
			return;
		}

		this.plugin.data.roles.forEach(role => {
			this.createCompactRoleCard(rolesSection, role);
		});
	}

	private createCompactRoleCard(container: HTMLElement, role: Role): void {
		const isActive = this.plugin.data.state.activeRoleId === role.id;
		const isLocked = this.plugin.isSessionLocked() && isActive;

		const roleCard = container.createDiv({
			cls: 'role-card-compact',
			attr: {
				style: `
					border-color: ${isActive ? role.colorHex : 'var(--background-modifier-border)'};
					background: ${isActive ? `${role.colorHex}10` : 'var(--background-primary)'};
					opacity: ${isActive && isLocked ? '0.6' : '1'};
					cursor: ${isActive && isLocked ? 'not-allowed' : 'pointer'};
				`
			}
		});

		const roleHeader = roleCard.createDiv({
			attr: { style: 'display: flex; align-items: center; gap: 8px;' }
		});

		// Role indicator
		const roleIndicator = roleHeader.createDiv({
			attr: {
				style: `
					width: 20px;
					height: 20px;
					border-radius: 50%;
					background-color: ${role.colorHex};
					display: flex;
					align-items: center;
					justify-content: center;
					flex-shrink: 0;
				`
			}
		});

		if (role.icon && IconLibrary.ICONS[role.icon]) {
			const iconElement = IconLibrary.createIconElement(role.icon, 10, 'white');
			iconElement.style.filter = 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))';
			roleIndicator.appendChild(iconElement);
		}

		// Role info
		const roleInfo = roleHeader.createDiv({ attr: { style: 'flex: 1; min-width: 0;' } });
		roleInfo.createEl('div', {
			text: role.name,
			attr: {
				style: `
					font-weight: 500;
					font-size: 13px;
					color: ${isActive ? role.colorHex : 'var(--text-normal)'};
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
				`
			}
		});

		// Status indicator
		if (isActive) {
			roleHeader.createDiv({
				text: '●',
				attr: {
					style: `
						color: ${role.colorHex};
						font-size: 12px;
						opacity: ${isLocked ? '0.5' : '1'};
					`
				}
			});
		}

		// Click handler
		roleCard.addEventListener('click', () => {
			if (isActive && isLocked) {
				const remaining = this.plugin.getRemainingLockTime();
				new Notice(`Cannot switch yet. Wait ${remaining}s to avoid micro-switching.`);
				return;
			}

			if (isActive) {
				// Show role options
				new RoleDashboardModal(this.app, this.plugin).open();
			} else {
				// Switch to this role
				if (this.plugin.data.state.activeRoleId) {
					this.plugin.switchSession(role.id);
				} else {
					this.plugin.startSession(role.id);
				}
				this.refresh();
			}
		});
	}

	// Refresh the side panel view
	public refresh(): void {
		this.onOpen();
	}
}

export default class TaskSwitchPlugin extends Plugin {
	data: TaskSwitchData;
	statusBarItem: HTMLElement | null = null;
	borderEl: HTMLElement | null = null;

	async onload() {
		await this.loadPluginData();
		
		// Register side panel view
		this.registerView(TASKSWITCH_VIEW_TYPE, (leaf) => new TaskSwitchView(leaf, this));
		
		// Add ribbon icon for side panel
		this.addRibbonIcon('clock', 'Open TaskSwitch Panel', (evt: MouseEvent) => {
			this.activateView();
		});
		
		// Initialize status bar
		this.initializeStatusBar();
		
		// Initialize border
		this.initializeBorder();
		
		// Register commands
		this.registerCommands();
		
		// Add settings tab
		this.addSettingTab(new TaskSwitchSettingsTab(this.app, this));
		
		// Auto-resume active session if exists
		this.autoResumeSession();
	}

	async onunload() {
		this.cleanup();
	}

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(TASKSWITCH_VIEW_TYPE);

		if (leaves.length > 0) {
			// A leaf with our view already exists, use that
			leaf = leaves[0];
		} else {
			// Our view could not be found in the workspace, create a new leaf
			// in the left sidebar for it
			leaf = workspace.getLeftLeaf(false);
			if (leaf) {
				await leaf.setViewState({ type: TASKSWITCH_VIEW_TYPE, active: true });
			}
		}

		// "Reveal" the leaf in case it is in a collapsed sidebar
		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}

	// Method to refresh side panel when data changes
	private refreshSidePanel(): void {
		const leaves = this.app.workspace.getLeavesOfType(TASKSWITCH_VIEW_TYPE);
		leaves.forEach(leaf => {
			if (leaf.view instanceof TaskSwitchView) {
				leaf.view.refresh();
			}
		});
	}


	private async loadPluginData() {
		const loadedData = await this.loadData();
		
		// Initialize with defaults if no data exists
		if (!loadedData) {
			this.data = {
				version: 2,
				roles: [],
				events: [],
				notes: [],
				settings: { ...DEFAULT_SETTINGS },
				state: { ...DEFAULT_STATE }
			};
		} else {
			// Migrate data if needed (version 1 -> 2)
			this.data = this.migrateData(loadedData);
		}
		
		await this.savePluginData();
	}

	private migrateData(data: any): TaskSwitchData {
		// Handle migration from version 1 to 2 if needed
		if (!data.version || data.version < 2) {
			return {
				version: 2,
				roles: data.roles || [],
				events: data.events || [],
				notes: data.notes || [],
				settings: { ...DEFAULT_SETTINGS, ...(data.settings || {}) },
				state: { ...DEFAULT_STATE, ...(data.state || {}) }
			};
		}
		return data;
	}

	async savePluginData() {
		await this.saveData(this.data);
	}

	// Utility methods for generating UUIDs
	private generateId(): string {
		return 'xxxx-xxxx-xxxx'.replace(/[x]/g, () => 
			(Math.random() * 16 | 0).toString(16)
		);
	}

	private now(): string {
		return new Date().toISOString();
	}

	// Role management methods
	createRole(name: string, colorHex: string, description?: string, icon?: string): Role {
		// Validate unique name
		if (this.data.roles.some(role => role.name === name)) {
			throw new Error('Role name must be unique');
		}

		const role: Role = {
			id: this.generateId(),
			name: name.trim(),
			colorHex: colorHex,
			description: description?.trim(),
			...(icon && { icon })
		};

		this.data.roles.push(role);
		
		// Refresh side panel to show new role
		this.refreshSidePanel();
		
		return role;
	}

	updateRole(roleId: string, updates: Partial<Role>): Role {
		const roleIndex = this.data.roles.findIndex(r => r.id === roleId);
		if (roleIndex === -1) {
			throw new Error('Role not found');
		}

		// Check for unique name if changing name
		if (updates.name && updates.name !== this.data.roles[roleIndex].name) {
			if (this.data.roles.some(r => r.id !== roleId && r.name === updates.name)) {
				throw new Error('Role name must be unique');
			}
		}

		this.data.roles[roleIndex] = { ...this.data.roles[roleIndex], ...updates };
		
		// Refresh side panel to show updated role
		this.refreshSidePanel();
		
		return this.data.roles[roleIndex];
	}

	deleteRole(roleId: string): boolean {
		const roleIndex = this.data.roles.findIndex(r => r.id === roleId);
		if (roleIndex === -1) {
			return false;
		}

		// End active session if this role is active
		if (this.data.state.activeRoleId === roleId) {
			this.endSession();
		}

		this.data.roles.splice(roleIndex, 1);
		
		// Refresh side panel to remove deleted role
		this.refreshSidePanel();
		
		return true;
	}

	// Session lifecycle methods
	isSessionLocked(): boolean {
		if (!this.data.state.lockUntil) return false;
		return new Date() < new Date(this.data.state.lockUntil);
	}

	getRemainingLockTime(): number {
		if (!this.data.state.lockUntil) return 0;
		const remaining = new Date(this.data.state.lockUntil).getTime() - Date.now();
		return Math.max(0, Math.ceil(remaining / 1000));
	}

	canEndSession(): boolean {
		if (!this.data.state.activeStartAt) return false;
		const elapsed = Date.now() - new Date(this.data.state.activeStartAt).getTime();
		return elapsed >= this.data.settings.minSessionSeconds * 1000;
	}

	async startSession(roleId: string): Promise<void> {
		const role = this.data.roles.find(r => r.id === roleId);
		if (!role) {
			throw new Error('Role not found');
		}

		// End current session if one exists
		if (this.data.state.activeRoleId) {
			this.endSession();
		}

		const sessionId = this.generateId();
		const now = this.now();

		// Log start event
		this.logEvent({
			id: this.generateId(),
			type: 'start',
			roleId: roleId,
			at: now,
			meta: { sessionId }
		});

		// Update state
		this.data.state = {
			activeRoleId: roleId,
			activeSessionId: sessionId,
			activeStartAt: now,
			lockUntil: new Date(Date.now() + this.data.settings.minSessionSeconds * 1000).toISOString()
		};

		await this.savePluginData();
		this.updateStatusBar();
		this.updateBorder();
		this.refreshSidePanel();
		
		IconLibrary.createIconNotice(`Started session: ${role.name}`, role.icon || 'rocket');
	}

	async switchSession(toRoleId: string): Promise<void> {
		if (this.isSessionLocked()) {
			const remaining = this.getRemainingLockTime();
			IconLibrary.createIconNotice(`Cannot switch roles yet. Wait ${remaining}s to avoid micro-switching.`, 'lock');
			return;
		}

		const toRole = this.data.roles.find(r => r.id === toRoleId);
		if (!toRole) {
			throw new Error('Target role not found');
		}

		// Show transition modal
		new TransitionModal(this.app, this, toRole).open();
	}

	async confirmSwitch(toRoleId: string): Promise<void> {
		const fromRoleId = this.data.state.activeRoleId;
		
		// End current session
		if (fromRoleId) {
			this.endSession();
		}

		// Start new session
		await this.startSession(toRoleId);

		// Log switch event
		this.logEvent({
			id: this.generateId(),
			type: 'switch',
			roleId: toRoleId,
			at: this.now(),
			meta: { 
				fromRoleId: fromRoleId || undefined,
				transitionSeconds: this.data.settings.transitionSeconds,
				sessionId: this.data.state.activeSessionId || undefined
			}
		});

		await this.savePluginData();
	}

	endSession(): void {
		if (!this.data.state.activeRoleId || !this.data.state.activeStartAt) {
			return;
		}

		if (!this.canEndSession()) {
			const elapsed = Date.now() - new Date(this.data.state.activeStartAt).getTime();
			const remaining = Math.ceil((this.data.settings.minSessionSeconds * 1000 - elapsed) / 1000);
			new Notice(`Cannot end session yet. Minimum ${this.data.settings.minSessionSeconds}s session required. ${remaining}s remaining.`);
			return;
		}

		// Log end event
		this.logEvent({
			id: this.generateId(),
			type: 'end',
			roleId: this.data.state.activeRoleId,
			at: this.now(),
			meta: { sessionId: this.data.state.activeSessionId || undefined }
		});

		// Clear state
		this.data.state = { ...DEFAULT_STATE };
		
		this.updateStatusBar();
		this.updateBorder();
		this.refreshSidePanel();
		IconLibrary.createIconNotice('Session ended', 'pause');
	}

	// Event logging
	private logEvent(event: Event): void {
		this.data.events.push(event);
	}

	// Notes management
	addNote(sessionId: string, text: string): Note {
		const note: Note = {
			id: this.generateId(),
			sessionId,
			text: text.trim(),
			at: this.now()
		};

		this.data.notes.push(note);

		// Log note added event
		this.logEvent({
			id: this.generateId(),
			type: 'noteAdded',
			roleId: this.data.state.activeRoleId || '',
			at: this.now(),
			meta: { noteId: note.id, noteText: text, sessionId }
		});

		return note;
	}

	updateNote(noteId: string, text: string): Note | null {
		const noteIndex = this.data.notes.findIndex(n => n.id === noteId);
		if (noteIndex === -1) return null;

		this.data.notes[noteIndex].text = text.trim();

		// Log note edited event
		this.logEvent({
			id: this.generateId(),
			type: 'noteEdited',
			roleId: this.data.state.activeRoleId || '',
			at: this.now(),
			meta: { 
				noteId: noteId, 
				noteText: text, 
				sessionId: this.data.notes[noteIndex].sessionId 
			}
		});

		return this.data.notes[noteIndex];
	}

	deleteNote(noteId: string): boolean {
		const noteIndex = this.data.notes.findIndex(n => n.id === noteId);
		if (noteIndex === -1) return false;

		const note = this.data.notes[noteIndex];
		this.data.notes.splice(noteIndex, 1);

		// Log note removed event
		this.logEvent({
			id: this.generateId(),
			type: 'noteRemoved',
			roleId: this.data.state.activeRoleId || '',
			at: this.now(),
			meta: { noteId: noteId, sessionId: note.sessionId }
		});

		return true;
	}

	// UI methods
	private initializeStatusBar(): void {
		// Status bar works on both desktop and mobile
		if (this.data.settings.showStatusBar) {
			this.statusBarItem = this.addStatusBarItem();
			this.updateStatusBar();
		}
	}

	private updateStatusBar(): void {
		if (!this.statusBarItem) return;
		
		this.statusBarItem.empty();
		this.statusBarItem.style.display = 'flex';
		this.statusBarItem.style.alignItems = 'center';
		this.statusBarItem.style.gap = '6px';

		if (this.data.state.activeRoleId) {
			const role = this.data.roles.find(r => r.id === this.data.state.activeRoleId);
			if (role) {
				// Add role icon if available
				if (role.icon && IconLibrary.ICONS[role.icon]) {
					const iconContainer = this.statusBarItem.createDiv({
						attr: {
							style: `
								width: 16px;
								height: 16px;
								display: flex;
								align-items: center;
								justify-content: center;
								color: ${role.colorHex};
							`
						}
					});
					const iconElement = IconLibrary.createIconElement(role.icon, 12, 'white');
			iconContainer.appendChild(iconElement);
				} else {
					// Fallback to colored dot
					this.statusBarItem.createDiv({
						attr: {
							style: `
								width: 8px;
								height: 8px;
								border-radius: 50%;
								background-color: ${role.colorHex};
								box-shadow: 0 0 6px ${role.colorHex}60;
							`
						}
					});
				}
				
				// Role name with session indicator
				const textEl = this.statusBarItem.createSpan({
					text: role.name,
					attr: { style: `color: ${role.colorHex}; font-weight: 500;` }
				});

				// Session lock indicator
				if (this.isSessionLocked()) {
					this.statusBarItem.createSpan({
						text: '🔒',
						attr: { 
							title: 'Session locked to prevent micro-switching',
							style: 'font-size: 12px; opacity: 0.8;'
						}
					});
				}
			}
		} else {
			// Idle status with icon
			const idleIcon = this.statusBarItem.createDiv({
				attr: {
					style: `
						width: 16px;
						height: 16px;
						display: flex;
						align-items: center;
						justify-content: center;
						color: #666;
					`
				}
			});
			const iconElement = IconLibrary.createIconElement('pause', 16, 'var(--text-muted)');
			idleIcon.appendChild(iconElement);
			
			this.statusBarItem.createSpan({
				text: 'TaskSwitch: Idle',
				attr: { style: 'color: #666;' }
			});
		}
	}

	initializeBorder(): void {
		// Only show border on desktop - mobile doesn't support it well
		if (this.data.settings.showBorder && !Platform.isMobile) {
			this.createBorderElement();
			this.updateBorder();
		}
	}

	private createBorderElement(): void {
		if (this.borderEl) return;

		this.borderEl = document.createElement('div');
		this.borderEl.style.position = 'fixed';
		this.borderEl.style.top = '0';
		this.borderEl.style.left = '0';
		this.borderEl.style.right = '0';
		this.borderEl.style.bottom = '0';
		this.borderEl.style.pointerEvents = 'none';
		this.borderEl.style.zIndex = '1000';
		this.borderEl.style.border = '3px solid transparent';
		this.borderEl.style.opacity = this.data.settings.borderOpacity.toString();
		
		document.body.appendChild(this.borderEl);
	}

	private updateBorder(): void {
		if (!this.borderEl) return;

		if (this.data.state.activeRoleId) {
			const role = this.data.roles.find(r => r.id === this.data.state.activeRoleId);
			if (role) {
				this.borderEl.style.borderColor = role.colorHex;
			}
		} else {
			this.borderEl.style.borderColor = 'transparent';
		}
	}

	removeBorder(): void {
		if (this.borderEl) {
			this.borderEl.remove();
			this.borderEl = null;
		}
	}

	private autoResumeSession(): void {
		if (this.data.state.activeRoleId && this.data.state.activeStartAt && !this.data.state.lockUntil) {
			const role = this.data.roles.find(r => r.id === this.data.state.activeRoleId);
			if (role) {
				// Restore lock based on when session started
				const lockEnd = new Date(this.data.state.activeStartAt).getTime() + 
					this.data.settings.minSessionSeconds * 1000;
				if (Date.now() < lockEnd) {
					this.data.state.lockUntil = new Date(lockEnd).toISOString();
				}
				
				this.updateStatusBar();
				new Notice(`Resumed session: ${role.name}`);
			}
		}
	}

	private registerCommands(): void {
		// Start/Resume Role command
		this.addCommand({
			id: 'start-role',
			name: 'Start/Resume Role...',
			callback: () => {
				new RolePickerModal(this.app, this, 'start').open();
			}
		});

		// Switch Role command  
		this.addCommand({
			id: 'switch-role', 
			name: 'Switch Role...',
			callback: () => {
				if (!this.data.state.activeRoleId) {
					new Notice('No active session to switch from');
					return;
				}
				new RolePickerModal(this.app, this, 'switch').open();
			}
		});

		// End Current Role command
		this.addCommand({
			id: 'end-role',
			name: 'End Current Role',
			callback: () => {
				this.endSession();
			}
		});

		// Open Analytics command
		this.addCommand({
			id: 'open-analytics',
			name: 'Open Analytics',
			callback: () => {
				new AnalyticsModal(this.app, this).open();
			}
		});

		// Open Dashboard command
		this.addCommand({
			id: 'open-dashboard',
			name: 'Open Role Dashboard',
			callback: () => {
				new RoleDashboardModal(this.app, this).open();
			}
		});

		// Command to open side panel
		this.addCommand({
			id: 'open-taskswitch-panel',
			name: 'Open TaskSwitch Panel',
			callback: () => {
				this.activateView();
			}
		});

		// Add Note command
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

	// Analytics computation methods
	getDerivedSessions(startDate?: Date, endDate?: Date): Session[] {
		const sessions: Session[] = [];
		const events = this.data.events.slice().sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
		
		let currentSession: Partial<Session> | null = null;
		
		for (const event of events) {
			const eventTime = new Date(event.at);
			
			// Filter by date range if provided
			if (startDate && eventTime < startDate) continue;
			if (endDate && eventTime > endDate) continue;
			
			switch (event.type) {
				case 'start':
					currentSession = {
						id: event.meta?.sessionId || this.generateId(),
						roleId: event.roleId,
						startAt: event.at,
						notes: []
					};
					break;
					
				case 'switch':
					// End current session
					if (currentSession && currentSession.startAt) {
						const session: Session = {
							...currentSession as Session,
							endAt: event.at,
							notes: this.data.notes.filter(n => n.sessionId === currentSession!.id)
						};
						sessions.push(session);
					}
					
					// Start new session
					currentSession = {
						id: event.meta?.sessionId || this.generateId(),
						roleId: event.roleId,
						startAt: event.at,
						notes: []
					};
					break;
					
				case 'end':
					if (currentSession && currentSession.startAt && currentSession.roleId === event.roleId) {
						const session: Session = {
							...currentSession as Session,
							endAt: event.at,
							notes: this.data.notes.filter(n => n.sessionId === currentSession!.id)
						};
						sessions.push(session);
						currentSession = null;
					}
					break;
			}
		}
		
		// Include active session if it exists
		if (currentSession && this.data.state.activeSessionId === currentSession!.id) {
			const session: Session = {
				...currentSession as Session,
				notes: this.data.notes.filter(n => n.sessionId === currentSession!.id)
			};
			sessions.push(session);
		}
		
		return sessions;
	}
	
	getAnalyticsStats(sessions: Session[]) {
		const stats = {
			totalSessions: sessions.length,
			totalTime: 0,
			avgSessionLength: 0,
			roleBreakdown: {} as Record<string, { time: number; sessions: number; name: string; color: string }>,
			totalSwitches: this.data.events.filter(e => e.type === 'switch').length,
			totalCancels: this.data.events.filter(e => e.type === 'cancelTransition').length,
			totalNotes: this.data.notes.length
		};
		
		for (const session of sessions) {
			const role = this.data.roles.find(r => r.id === session.roleId);
			if (!role) continue;
			
			// Calculate session duration
			const startTime = new Date(session.startAt).getTime();
			const endTime = session.endAt ? new Date(session.endAt).getTime() : Date.now();
			const duration = endTime - startTime;
			
			stats.totalTime += duration;
			
			// Update role breakdown
			if (!stats.roleBreakdown[session.roleId]) {
				stats.roleBreakdown[session.roleId] = {
					time: 0,
					sessions: 0,
					name: role.name,
					color: role.colorHex
				};
			}
			
			stats.roleBreakdown[session.roleId].time += duration;
			stats.roleBreakdown[session.roleId].sessions++;
		}
		
		stats.avgSessionLength = stats.totalSessions > 0 ? stats.totalTime / stats.totalSessions : 0;
		
		return stats;
	}

	exportToCSV(sessions: Session[], stats: any): string {
		const lines: string[] = [];
		
		// CSV Header
		lines.push('Type,Role,Start Time,End Time,Duration (minutes),Notes Count,Notes');
		
		// Session data
		sessions.forEach(session => {
			const role = this.data.roles.find(r => r.id === session.roleId);
			const startTime = new Date(session.startAt).toLocaleString();
			const endTime = session.endAt ? new Date(session.endAt).toLocaleString() : 'Active';
			const duration = session.endAt ? 
				Math.round((new Date(session.endAt).getTime() - new Date(session.startAt).getTime()) / (1000 * 60)) : 
				Math.round((Date.now() - new Date(session.startAt).getTime()) / (1000 * 60));
			const notesText = session.notes.map(n => n.text.replace(/"/g, '""')).join(' | ');
			
			lines.push(`Session,"${role?.name || 'Unknown'}","${startTime}","${endTime}",${duration},${session.notes.length},"${notesText}"`);
		});
		
		// Summary data
		lines.push('');
		lines.push('Summary Statistics');
		lines.push(`Total Sessions,${stats.totalSessions}`);
		lines.push(`Total Time (hours),${(stats.totalTime / (1000 * 60 * 60)).toFixed(2)}`);
		lines.push(`Average Session (minutes),${(stats.avgSessionLength / (1000 * 60)).toFixed(1)}`);
		lines.push(`Total Switches,${stats.totalSwitches}`);
		lines.push(`Total Cancels,${stats.totalCancels}`);
		lines.push(`Total Notes,${stats.totalNotes}`);
		
		return lines.join('\n');
	}

	exportToJSON(sessions: Session[], stats: any): string {
		const exportData = {
			exportedAt: new Date().toISOString(),
			summary: stats,
			sessions: sessions.map(session => ({
				...session,
				roleName: this.data.roles.find(r => r.id === session.roleId)?.name || 'Unknown',
				durationMs: session.endAt ? 
					new Date(session.endAt).getTime() - new Date(session.startAt).getTime() :
					Date.now() - new Date(session.startAt).getTime()
			})),
			roles: this.data.roles
		};
		
		return JSON.stringify(exportData, null, 2);
	}

	private cleanup(): void {
		this.removeBorder();
	}
}

// Transition Modal
class TransitionModal extends Modal {
	private plugin: TaskSwitchPlugin;
	private targetRole: Role;
	private countdownInterval: number | null = null;
	private remainingSeconds: number;

	constructor(app: App, plugin: TaskSwitchPlugin, targetRole: Role) {
		super(app);
		this.plugin = plugin;
		this.targetRole = targetRole;
		this.remainingSeconds = plugin.data.settings.transitionSeconds;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		
		// Make modal mobile-friendly
		if (Platform.isMobile) {
			contentEl.style.padding = '20px';
			contentEl.style.maxWidth = '90vw';
		}
		
		contentEl.createEl('div', { 
			text: `Switching to: ${this.targetRole.name}`,
			attr: { style: `color: ${this.targetRole.colorHex}; font-size: ${Platform.isMobile ? '20px' : '24px'}; font-weight: bold; text-align: center; margin-bottom: 20px;` }
		});

		const countdownEl = contentEl.createEl('div', { 
			text: `${this.remainingSeconds}s`,
			attr: { style: `font-size: ${Platform.isMobile ? '36px' : '48px'}; text-align: center; margin: 20px 0;` }
		});

		const buttonContainer = contentEl.createDiv({ 
			attr: { 
				style: `text-align: center; margin-top: 30px;` 
			} 
		});
		
		const cancelBtn = buttonContainer.createEl('button', { 
			text: 'Cancel',
			attr: { style: Platform.isMobile ? 'padding: 12px; font-size: 16px;' : '' }
		});
		
		// Start countdown
		this.countdownInterval = window.setInterval(() => {
			this.remainingSeconds--;
			countdownEl.setText(`${this.remainingSeconds}s`);
			
			if (this.remainingSeconds <= 0) {
				// Automatically switch when countdown reaches 0
				this.plugin.confirmSwitch(this.targetRole.id);
				if (this.countdownInterval) {
					clearInterval(this.countdownInterval);
				}
				this.close();
			}
		}, 1000);

		// Event handlers
		cancelBtn.addEventListener('click', () => {
			// Log cancel transition event
			this.plugin.data.events.push({
				id: this.plugin['generateId'](),
				type: 'cancelTransition',
				roleId: this.targetRole.id,
				at: new Date().toISOString(),
				meta: { 
					fromRoleId: this.plugin.data.state.activeRoleId || undefined,
					transitionSeconds: this.plugin.data.settings.transitionSeconds 
				}
			});
			this.close();
		});
	}

	onClose() {
		if (this.countdownInterval) {
			clearInterval(this.countdownInterval);
		}
		const { contentEl } = this;
		contentEl.empty();
	}
}

// Role Picker Modal
class RolePickerModal extends Modal {
	private plugin: TaskSwitchPlugin;
	private mode: 'start' | 'switch';

	constructor(app: App, plugin: TaskSwitchPlugin, mode: 'start' | 'switch') {
		super(app);
		this.plugin = plugin;
		this.mode = mode;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		// Mobile responsive styling
		if (Platform.isMobile) {
			contentEl.style.padding = '15px';
			contentEl.style.maxHeight = '80vh';
			contentEl.style.overflowY = 'auto';
		}

		const title = this.mode === 'start' ? 'Start Role' : 'Switch Role';
		contentEl.createEl('h2', { text: title });

		if (this.plugin.data.roles.length === 0) {
			contentEl.createEl('p', { text: 'No roles defined. Go to Settings to create roles first.' });
			return;
		}

		const roleList = contentEl.createDiv({ cls: 'role-picker-list' });
		
		this.plugin.data.roles.forEach(role => {
			// Skip current role if switching
			if (this.mode === 'switch' && role.id === this.plugin.data.state.activeRoleId) {
				return;
			}

			const roleItem = roleList.createDiv({ 
				cls: 'role-picker-item',
				attr: { 
					style: `display: flex; align-items: center; padding: ${Platform.isMobile ? '15px' : '10px'}; border: 1px solid #ccc; margin: 5px 0; cursor: pointer; border-radius: 5px; min-height: ${Platform.isMobile ? '60px' : 'auto'};` 
				}
			});

			// Color dot
			const colorDot = roleItem.createDiv({ 
				attr: { 
					style: `width: 20px; height: 20px; border-radius: 50%; background-color: ${role.colorHex}; margin-right: 10px;` 
				}
			});

			// Role name and description
			const roleInfo = roleItem.createDiv();
			roleInfo.createEl('strong', { text: role.name });
			if (role.description) {
				roleInfo.createEl('div', { text: role.description, attr: { style: 'font-size: 0.9em; color: #666;' } });
			}

			roleItem.addEventListener('click', () => {
				if (this.mode === 'start') {
					this.plugin.startSession(role.id);
				} else {
					this.plugin.switchSession(role.id);
				}
				this.close();
			});

			// Hover effect
			roleItem.addEventListener('mouseenter', () => {
				roleItem.style.backgroundColor = '#f0f0f0';
			});
			roleItem.addEventListener('mouseleave', () => {
				roleItem.style.backgroundColor = '';
			});
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

// Settings Tab
class TaskSwitchSettingsTab extends PluginSettingTab {
	plugin: TaskSwitchPlugin;

	constructor(app: App, plugin: TaskSwitchPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'TaskSwitch Settings' });

		// Roles Management Section - MOVED TO TOP
		containerEl.createEl('h3', { text: 'Role Management' });
		
		const rolesContainer = containerEl.createDiv({ cls: 'roles-container' });
		this.displayRoles(rolesContainer);

		// Add new role button
		new Setting(containerEl)
			.setName('Add New Role')
			.setDesc('Create a new role for task switching')
			.addButton(button => button
				.setButtonText('Add Role')
				.onClick(() => {
					new RoleEditModal(this.app, this.plugin, null, () => {
						this.displayRoles(rolesContainer);
					}).open();
				}));

		// Session Settings Section
		containerEl.createEl('h3', { text: 'Session Settings', attr: { style: 'margin-top: 30px;' } });

		// Transition duration setting
		new Setting(containerEl)
			.setName('Transition Duration')
			.setDesc('Minimum seconds before role switch is allowed (30-600s)')
			.addSlider(slider => slider
				.setLimits(30, 600, 10)
				.setValue(this.plugin.data.settings.transitionSeconds)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.data.settings.transitionSeconds = value;
					await this.plugin.savePluginData();
				}));

		// Minimum session duration setting
		new Setting(containerEl)
			.setName('Minimum Session Duration')
			.setDesc('Minimum seconds per session to prevent micro-switching (300-3600s)')
			.addSlider(slider => slider
				.setLimits(300, 3600, 60)
				.setValue(this.plugin.data.settings.minSessionSeconds)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.data.settings.minSessionSeconds = value;
					await this.plugin.savePluginData();
				}));

		// Display Settings Section
		containerEl.createEl('h3', { text: 'Display Settings', attr: { style: 'margin-top: 30px;' } });

		// Show status bar toggle
		new Setting(containerEl)
			.setName('Show Status Bar')
			.setDesc('Display current role in status bar')
			.addToggle(toggle => toggle
				.setValue(this.plugin.data.settings.showStatusBar)
				.onChange(async (value) => {
					this.plugin.data.settings.showStatusBar = value;
					await this.plugin.savePluginData();
					// TODO: Re-initialize status bar
				}));

		// Show border toggle (desktop only)
		if (!Platform.isMobile) {
			new Setting(containerEl)
				.setName('Show Border')
				.setDesc('Display colored border around workspace when active')
				.addToggle(toggle => toggle
					.setValue(this.plugin.data.settings.showBorder)
					.onChange(async (value) => {
						this.plugin.data.settings.showBorder = value;
						if (value) {
							this.plugin.initializeBorder();
						} else {
							this.plugin.removeBorder();
						}
						await this.plugin.savePluginData();
					}));

			// Border opacity
			new Setting(containerEl)
				.setName('Border Opacity')
				.setDesc('Opacity of the workspace border (0.1-1.0)')
				.addSlider(slider => slider
					.setLimits(0.1, 1.0, 0.1)
					.setValue(this.plugin.data.settings.borderOpacity)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.data.settings.borderOpacity = value;
						if (this.plugin.borderEl) {
							this.plugin.borderEl.style.opacity = value.toString();
						}
						await this.plugin.savePluginData();
					}));
		} else {
			// Mobile info
			containerEl.createEl('p', { 
				text: 'Note: Workspace border is disabled on mobile for better performance.', 
				attr: { style: 'color: #666; font-size: 0.9em; margin: 10px 0;' }
			});
		}
	}

	private displayRoles(container: HTMLElement): void {
		container.empty();

		if (this.plugin.data.roles.length === 0) {
			container.createEl('p', { text: 'No roles defined yet.' });
			return;
		}

		this.plugin.data.roles.forEach(role => {
			const roleSetting = new Setting(container)
				.setName(role.name)
				.setDesc(role.description || 'No description');

			// Color indicator with icon
			const colorEl = document.createElement('div');
			colorEl.style.width = '20px';
			colorEl.style.height = '20px';
			colorEl.style.borderRadius = '50%';
			colorEl.style.backgroundColor = role.colorHex;
			colorEl.style.display = 'inline-flex';
			colorEl.style.alignItems = 'center';
			colorEl.style.justifyContent = 'center';
			colorEl.style.marginRight = '10px';
			
			// Add icon if available
			if (role.icon && IconLibrary.ICONS[role.icon]) {
				const iconEl = document.createElement('div');
				iconEl.style.width = '12px';
				iconEl.style.height = '12px';
				iconEl.style.color = 'white';
				iconEl.style.filter = 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))';
				const iconElement = IconLibrary.createIconElement(role.icon, 12, 'white');
				iconEl.appendChild(iconElement);
				colorEl.appendChild(iconEl);
			}
			
			roleSetting.nameEl.prepend(colorEl);

			// Edit button
			roleSetting.addButton(button => button
				.setButtonText('Edit')
				.onClick(() => {
					new RoleEditModal(this.app, this.plugin, role, () => {
						this.displayRoles(container);
					}).open();
				}));

			// Delete button
			roleSetting.addButton(button => button
				.setButtonText('Delete')
				.setWarning()
				.onClick(() => {
					if (confirm(`Are you sure you want to delete role "${role.name}"?`)) {
						this.plugin.deleteRole(role.id);
						this.plugin.savePluginData();
						this.displayRoles(container);
					}
				}));
		});
	}
}

// Role Edit Modal
class RoleEditModal extends Modal {
	private plugin: TaskSwitchPlugin;
	private role: Role | null;
	private onSave: () => void;
	private nameInput: HTMLInputElement;
	private colorInput: HTMLInputElement;
	private descInput: HTMLTextAreaElement;
	private selectedIcon: string | null;

	constructor(app: App, plugin: TaskSwitchPlugin, role: Role | null, onSave: () => void) {
		super(app);
		this.plugin = plugin;
		this.role = role;
		this.onSave = onSave;
		this.selectedIcon = role?.icon || null;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		const title = this.role ? 'Edit Role' : 'Create Role';
		contentEl.createEl('h2', { text: title });

		// Name input
		const nameContainer = contentEl.createDiv();
		nameContainer.createEl('label', { text: 'Name:' });
		this.nameInput = nameContainer.createEl('input', { 
			type: 'text', 
			value: this.role?.name || '',
			attr: { style: 'width: 100%; margin-top: 5px; padding: 5px;' }
		});

		// Color input
		const colorContainer = contentEl.createDiv({ attr: { style: 'margin-top: 10px;' } });
		colorContainer.createEl('label', { text: 'Color:' });
		this.colorInput = colorContainer.createEl('input', { 
			type: 'color', 
			value: this.role?.colorHex || '#3B82F6',
			attr: { style: 'margin-top: 5px; margin-left: 10px;' }
		});

		// Description input
		const descContainer = contentEl.createDiv({ attr: { style: 'margin-top: 10px;' } });
		descContainer.createEl('label', { text: 'Description (optional):' });
		this.descInput = descContainer.createEl('textarea', { 
			value: this.role?.description || '',
			attr: { 
				style: 'width: 100%; margin-top: 5px; padding: 5px; height: 60px;',
				placeholder: 'Brief description of this role...'
			}
		});

		// Icon picker
		this.createIconPicker(contentEl);

		// Buttons
		const buttonContainer = contentEl.createDiv({ attr: { style: 'margin-top: 20px; text-align: right;' } });
		
		const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });
		cancelBtn.style.marginRight = '10px';
		cancelBtn.addEventListener('click', () => this.close());

		const saveBtn = buttonContainer.createEl('button', { text: this.role ? 'Update' : 'Create' });
		saveBtn.addEventListener('click', () => this.save());

		// Focus name input
		this.nameInput.focus();
	}

	private createIconPicker(contentEl: HTMLElement): void {
		const iconContainer = contentEl.createDiv({ attr: { style: 'margin-top: 15px;' } });
		iconContainer.createEl('label', { text: 'Icon (optional):' });

		// Current selection display
		const currentSelection = iconContainer.createDiv({ 
			attr: { 
				style: 'margin-top: 8px; padding: 10px; border: 2px dashed #ddd; border-radius: 8px; display: flex; align-items: center; gap: 10px; min-height: 40px;' 
			} 
		});

		this.updateCurrentIconDisplay(currentSelection);

		// Icon grid
		const iconGrid = iconContainer.createDiv({ 
			attr: { 
				style: `
					margin-top: 10px; 
					display: grid; 
					grid-template-columns: repeat(auto-fill, minmax(40px, 1fr)); 
					gap: 8px; 
					max-height: 200px; 
					overflow-y: auto; 
					border: 1px solid #ddd; 
					border-radius: 8px; 
					padding: 12px;
					background: #f8f9fa;
				` 
			} 
		});

		// Add "no icon" option
		const noIconBtn = iconGrid.createDiv({
			attr: {
				title: 'No icon',
				style: `
					width: 36px;
					height: 36px;
					border: 2px solid ${this.selectedIcon === null ? '#007acc' : '#ddd'};
					border-radius: 6px;
					display: flex;
					align-items: center;
					justify-content: center;
					cursor: pointer;
					background: ${this.selectedIcon === null ? '#007acc20' : '#fff'};
					transition: all 0.2s ease;
				`
			}
		});
		noIconBtn.textContent = '∅';
		noIconBtn.addEventListener('click', () => {
			this.selectedIcon = null;
			this.updateIconGrid(iconGrid);
			this.updateCurrentIconDisplay(currentSelection);
		});

		// Add all available icons
		Object.entries(IconLibrary.ICONS).forEach(([iconKey, iconSvg]) => {
			const isSelected = this.selectedIcon === iconKey;
			
			const iconBtn = iconGrid.createDiv({
				attr: {
					title: iconKey.charAt(0).toUpperCase() + iconKey.slice(1),
					style: `
						width: 36px;
						height: 36px;
						border: 2px solid ${isSelected ? '#007acc' : '#ddd'};
						border-radius: 6px;
						display: flex;
						align-items: center;
						justify-content: center;
						cursor: pointer;
						background: ${isSelected ? '#007acc20' : '#fff'};
						transition: all 0.2s ease;
					`
				}
			});

			const iconEl = iconBtn.createDiv({
				attr: {
					style: `
						width: 20px;
						height: 20px;
						color: ${isSelected ? '#007acc' : '#666'};
					`
				}
			});
			const iconElement = IconLibrary.createIconElement(this.selectedIcon || 'gear', 20, 'var(--interactive-accent)');
			iconEl.appendChild(iconElement);

			iconBtn.addEventListener('click', () => {
				this.selectedIcon = iconKey;
				this.updateIconGrid(iconGrid);
				this.updateCurrentIconDisplay(currentSelection);
			});

			iconBtn.addEventListener('mouseenter', () => {
				if (!isSelected) {
					iconBtn.style.borderColor = '#007acc';
					iconBtn.style.background = '#007acc10';
				}
			});

			iconBtn.addEventListener('mouseleave', () => {
				if (!isSelected) {
					iconBtn.style.borderColor = '#ddd';
					iconBtn.style.background = '#fff';
				}
			});
		});
	}

	private updateCurrentIconDisplay(container: HTMLElement): void {
		container.empty();

		if (this.selectedIcon && IconLibrary.ICONS[this.selectedIcon]) {
			// Show selected icon
			const iconDisplay = container.createDiv({
				attr: {
					style: `
						width: 32px;
						height: 32px;
						display: flex;
						align-items: center;
						justify-content: center;
						background: #007acc20;
						border-radius: 6px;
						color: #007acc;
					`
				}
			});
			const iconElement = IconLibrary.createIconElement(this.selectedIcon || 'gear', 20, 'var(--interactive-accent)');
			iconDisplay.appendChild(iconElement);

			container.createSpan({
				text: (this.selectedIcon || 'gear').charAt(0).toUpperCase() + (this.selectedIcon || 'gear').slice(1),
				attr: { style: 'font-weight: 500; color: #007acc;' }
			});
		} else {
			// Show "no icon selected" state
			container.createDiv({
				attr: {
					style: `
						width: 32px;
						height: 32px;
						display: flex;
						align-items: center;
						justify-content: center;
						background: #f0f0f0;
						border-radius: 6px;
						color: #999;
					`
				}
			}).textContent = '∅';

			container.createSpan({
				text: 'No icon selected',
				attr: { style: 'color: #666; font-style: italic;' }
			});
		}
	}

	private updateIconGrid(iconGrid: HTMLElement): void {
		// Update all icon buttons' selection states
		const iconButtons = iconGrid.children;
		for (let i = 0; i < iconButtons.length; i++) {
			const btn = iconButtons[i] as HTMLElement;
			const iconKey = i === 0 ? null : Object.keys(IconLibrary.ICONS)[i - 1]; // First button is "no icon"
			const isSelected = this.selectedIcon === iconKey;
			
			btn.style.borderColor = isSelected ? '#007acc' : '#ddd';
			btn.style.background = isSelected ? '#007acc20' : '#fff';
			
			// Update icon color if it has an icon
			const iconEl = btn.querySelector('div[style*="width: 20px"]') as HTMLElement;
			if (iconEl) {
				iconEl.style.color = isSelected ? '#007acc' : '#666';
			}
		}
	}

	private save(): void {
		const name = this.nameInput.value.trim();
		const color = this.colorInput.value;
		const description = this.descInput.value.trim();

		if (!name) {
			new Notice('Role name is required');
			return;
		}

		try {
			if (this.role) {
				// Update existing role
				this.plugin.updateRole(this.role.id, { name, colorHex: color, description, icon: this.selectedIcon || undefined });
			} else {
				// Create new role
				this.plugin.createRole(name, color, description, this.selectedIcon || undefined);
			}

			this.plugin.savePluginData();
			this.onSave();
			this.close();
			new Notice(`Role ${this.role ? 'updated' : 'created'}: ${name}`);
		} catch (error) {
			new Notice(error.message);
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

// Analytics Modal
class AnalyticsModal extends Modal {
	private plugin: TaskSwitchPlugin;
	private startDateInput: HTMLInputElement;
	private endDateInput: HTMLInputElement;

	constructor(app: App, plugin: TaskSwitchPlugin) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		// Mobile responsive styling
		if (Platform.isMobile) {
			contentEl.style.padding = '15px';
			contentEl.style.maxHeight = '90vh';
			contentEl.style.overflowY = 'auto';
		}

		contentEl.createEl('h2', { text: 'TaskSwitch Analytics' });

		// Date range filters - stack on mobile
		const filterContainer = contentEl.createDiv({ 
			attr: { 
				style: `margin-bottom: 20px; display: ${Platform.isMobile ? 'block' : 'flex'}; gap: 10px; align-items: center;` 
			} 
		});
		
		if (Platform.isMobile) {
			// Stacked layout for mobile
			const fromDiv = filterContainer.createDiv({ attr: { style: 'margin-bottom: 10px;' } });
			fromDiv.createEl('label', { text: 'From: ', attr: { style: 'display: block; margin-bottom: 5px;' } });
			this.startDateInput = fromDiv.createEl('input', { 
				type: 'date',
				value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
				attr: { style: 'width: 100%;' }
			});

			const toDiv = filterContainer.createDiv({ attr: { style: 'margin-bottom: 10px;' } });
			toDiv.createEl('label', { text: 'To: ', attr: { style: 'display: block; margin-bottom: 5px;' } });
			this.endDateInput = toDiv.createEl('input', { 
				type: 'date',
				value: new Date().toISOString().split('T')[0],
				attr: { style: 'width: 100%;' }
			});
		} else {
			// Inline layout for desktop
			filterContainer.createEl('label', { text: 'From:' });
			this.startDateInput = filterContainer.createEl('input', { 
				type: 'date',
				value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
			});

			filterContainer.createEl('label', { text: 'To:' });
			this.endDateInput = filterContainer.createEl('input', { 
				type: 'date',
				value: new Date().toISOString().split('T')[0]
			});
		}

		const updateBtn = filterContainer.createEl('button', { text: 'Update' });
		updateBtn.addEventListener('click', () => this.updateAnalytics());

		// Analytics content container
		const analyticsContainer = contentEl.createDiv({ cls: 'analytics-container' });
		
		// Export buttons - responsive layout
		const exportContainer = contentEl.createDiv({ 
			attr: { 
				style: `margin-top: 20px; text-align: ${Platform.isMobile ? 'center' : 'right'};` 
			} 
		});
		
		const csvBtn = exportContainer.createEl('button', { 
			text: 'Export CSV',
			attr: { style: `margin-right: 10px; ${Platform.isMobile ? 'display: block; width: 100%; margin-bottom: 10px;' : ''}` }
		});
		csvBtn.addEventListener('click', () => this.exportData('csv'));

		const jsonBtn = exportContainer.createEl('button', { 
			text: 'Export JSON',
			attr: { style: Platform.isMobile ? 'display: block; width: 100%;' : '' }
		});
		jsonBtn.addEventListener('click', () => this.exportData('json'));

		// Initial load
		this.updateAnalytics();
	}

	private updateAnalytics(): void {
		const startDate = this.startDateInput.value ? new Date(this.startDateInput.value) : undefined;
		const endDate = this.endDateInput.value ? new Date(this.endDateInput.value) : undefined;

		const sessions = this.plugin.getDerivedSessions(startDate, endDate);
		const stats = this.plugin.getAnalyticsStats(sessions);

		const container = this.contentEl.querySelector('.analytics-container') as HTMLElement;
		container.empty();

		// Summary cards - responsive grid
		const summaryContainer = container.createDiv({ 
			attr: { 
				style: `display: grid; grid-template-columns: repeat(auto-fit, minmax(${Platform.isMobile ? '120px' : '150px'}, 1fr)); gap: 10px; margin-bottom: 20px;` 
			} 
		});

		this.createSummaryCard(summaryContainer, 'Total Sessions', stats.totalSessions.toString());
		this.createSummaryCard(summaryContainer, 'Total Time', `${(stats.totalTime / (1000 * 60 * 60)).toFixed(1)}h`);
		this.createSummaryCard(summaryContainer, 'Avg Session', `${(stats.avgSessionLength / (1000 * 60)).toFixed(0)}m`);
		this.createSummaryCard(summaryContainer, 'Switches', stats.totalSwitches.toString());
		this.createSummaryCard(summaryContainer, 'Cancels', stats.totalCancels.toString());
		this.createSummaryCard(summaryContainer, 'Notes', stats.totalNotes.toString());

		// Role breakdown
		if (Object.keys(stats.roleBreakdown).length > 0) {
			container.createEl('h3', { text: 'Time by Role' });
			const roleContainer = container.createDiv({ cls: 'role-breakdown' });

			Object.entries(stats.roleBreakdown).forEach(([roleId, data]) => {
				const percentage = stats.totalTime > 0 ? (data.time / stats.totalTime * 100).toFixed(1) : '0';
				
				const roleItem = roleContainer.createDiv({ attr: { style: 'display: flex; align-items: center; margin: 5px 0; padding: 10px; border-radius: 5px; background: #f5f5f5;' } });
				
				// Color dot
				roleItem.createDiv({ attr: { style: `width: 16px; height: 16px; border-radius: 50%; background-color: ${data.color}; margin-right: 10px;` } });
				
				// Role info
				const roleInfo = roleItem.createDiv({ attr: { style: 'flex: 1;' } });
				roleInfo.createEl('strong', { text: data.name });
				roleInfo.createEl('div', { text: `${(data.time / (1000 * 60 * 60)).toFixed(1)}h (${percentage}%) • ${data.sessions} sessions` });
			});
		}

		// Recent sessions
		container.createEl('h3', { text: 'Recent Sessions' });
		const sessionContainer = container.createDiv({ cls: 'session-list' });

		const recentSessions = sessions.slice(-10).reverse(); // Last 10 sessions
		recentSessions.forEach(session => {
			const role = this.plugin.data.roles.find(r => r.id === session.roleId);
			const duration = session.endAt ? 
				Math.round((new Date(session.endAt).getTime() - new Date(session.startAt).getTime()) / (1000 * 60)) :
				Math.round((Date.now() - new Date(session.startAt).getTime()) / (1000 * 60));

			const sessionItem = sessionContainer.createDiv({ attr: { style: 'display: flex; align-items: center; padding: 8px; margin: 3px 0; border-radius: 3px; background: #f9f9f9;' } });
			
			// Color dot
			sessionItem.createDiv({ attr: { style: `width: 12px; height: 12px; border-radius: 50%; background-color: ${role?.colorHex || '#666'}; margin-right: 8px;` } });
			
			// Session info
			const sessionInfo = sessionItem.createDiv({ attr: { style: 'flex: 1; font-size: 0.9em;' } });
			sessionInfo.createEl('span', { text: `${role?.name || 'Unknown'} • ${duration}m` });
			if (session.notes.length > 0) {
				sessionInfo.createEl('span', { text: ` • ${session.notes.length} notes`, attr: { style: 'color: #666;' } });
			}
			sessionInfo.createEl('div', { text: new Date(session.startAt).toLocaleString(), attr: { style: 'font-size: 0.8em; color: #999;' } });
		});

		if (recentSessions.length === 0) {
			sessionContainer.createEl('p', { text: 'No sessions found in the selected date range.' });
		}
	}

	private createSummaryCard(container: HTMLElement, title: string, value: string): void {
		const card = container.createDiv({ attr: { style: 'padding: 15px; border-radius: 5px; background: #f0f0f0; text-align: center;' } });
		card.createEl('div', { text: value, attr: { style: 'font-size: 24px; font-weight: bold; margin-bottom: 5px;' } });
		card.createEl('div', { text: title, attr: { style: 'font-size: 12px; color: #666;' } });
	}

	private exportData(format: 'csv' | 'json'): void {
		const startDate = this.startDateInput.value ? new Date(this.startDateInput.value) : undefined;
		const endDate = this.endDateInput.value ? new Date(this.endDateInput.value) : undefined;

		const sessions = this.plugin.getDerivedSessions(startDate, endDate);
		const stats = this.plugin.getAnalyticsStats(sessions);

		let content: string;
		let filename: string;

		if (format === 'csv') {
			content = this.plugin.exportToCSV(sessions, stats);
			filename = `taskswitch-export-${new Date().toISOString().split('T')[0]}.csv`;
		} else {
			content = this.plugin.exportToJSON(sessions, stats);
			filename = `taskswitch-export-${new Date().toISOString().split('T')[0]}.json`;
		}

		// Create download link
		const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);

		new Notice(`Exported ${sessions.length} sessions to ${filename}`);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

// Note Edit Modal
class NoteEditModal extends Modal {
	private plugin: TaskSwitchPlugin;
	private sessionId: string;
	private note: Note | null;
	private textArea: HTMLTextAreaElement;

	constructor(app: App, plugin: TaskSwitchPlugin, sessionId: string, note: Note | null) {
		super(app);
		this.plugin = plugin;
		this.sessionId = sessionId;
		this.note = note;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		const title = this.note ? 'Edit Note' : 'Add Note';
		contentEl.createEl('h2', { text: title });

		// Text area
		this.textArea = contentEl.createEl('textarea', {
			value: this.note?.text || '',
			attr: {
				style: 'width: 100%; height: 150px; margin: 10px 0; padding: 10px; border-radius: 5px; border: 1px solid #ccc;',
				placeholder: 'Enter your note for this session...'
			}
		});

		// Buttons
		const buttonContainer = contentEl.createDiv({ attr: { style: 'text-align: right; margin-top: 15px;' } });
		
		const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });
		cancelBtn.style.marginRight = '10px';
		cancelBtn.addEventListener('click', () => this.close());

		const saveBtn = buttonContainer.createEl('button', { text: this.note ? 'Update' : 'Add' });
		saveBtn.addEventListener('click', () => this.save());

		// Delete button for existing notes
		if (this.note) {
			const deleteBtn = buttonContainer.createEl('button', { text: 'Delete' });
			deleteBtn.style.marginRight = '10px';
			deleteBtn.style.backgroundColor = '#e74c3c';
			deleteBtn.style.color = 'white';
			deleteBtn.addEventListener('click', () => this.delete());
		}

		this.textArea.focus();
	}

	private save(): void {
		const text = this.textArea.value.trim();
		if (!text) {
			new Notice('Note text cannot be empty');
			return;
		}

		try {
			if (this.note) {
				this.plugin.updateNote(this.note.id, text);
				new Notice('Note updated');
			} else {
				this.plugin.addNote(this.sessionId, text);
				new Notice('Note added');
			}

			this.plugin.savePluginData();
			this.close();
		} catch (error) {
			new Notice('Error saving note');
		}
	}

	private delete(): void {
		if (!this.note) return;

		if (confirm('Are you sure you want to delete this note?')) {
			this.plugin.deleteNote(this.note.id);
			this.plugin.savePluginData();
			new Notice('Note deleted');
			this.close();
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

// Role Dashboard Modal
class RoleDashboardModal extends Modal {
	private plugin: TaskSwitchPlugin;
	private timerInterval: number | null = null;
	private durationEl: HTMLElement | null = null;

	constructor(app: App, plugin: TaskSwitchPlugin) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		// Mobile responsive styling
		if (Platform.isMobile) {
			contentEl.style.padding = "15px";
			contentEl.style.maxHeight = "90vh";
			contentEl.style.overflowY = "auto";
		}

		contentEl.createEl("h2", { text: "Role Dashboard" });

		// Roles grid section
		this.createRolesGridSection(contentEl);

		// Quick actions section
		this.createQuickActionsSection(contentEl);

		// Analytics section
		this.createAnalyticsSection(contentEl);

		// Current history section (at bottom)
		this.createCurrentStatusSection(contentEl);

		// Start real-time timer if there's an active session
		this.startRealtimeTimer();
	}

	private createAnalyticsSection(contentEl: HTMLElement): void {
		const section = contentEl.createDiv({ 
			attr: { 
				style: `
					margin: 20px 0;
					padding: 16px;
					border: 1px solid var(--background-modifier-border);
					border-radius: 8px;
					background: var(--background-secondary);
				` 
			} 
		});

		section.createEl("h3", { 
			text: "📊 Analytics", 
			attr: { style: "margin: 0 0 12px 0; font-size: 16px;" } 
		});

		// Get analytics data
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		
		const todaySessions = this.plugin.getDerivedSessions(today, new Date());
		const totalTodayMinutes = todaySessions.reduce((sum, s) => {
			if (s.endAt) {
				return sum + (new Date(s.endAt).getTime() - new Date(s.startAt).getTime()) / (1000 * 60);
			} else if (s.id === this.plugin.data.state.activeSessionId) {
				return sum + (Date.now() - new Date(s.startAt).getTime()) / (1000 * 60);
			}
			return sum;
		}, 0);
		const switchCount = todaySessions.length;

		// Week analytics
		const weekStart = new Date(today);
		weekStart.setDate(today.getDate() - today.getDay());
		const weekSessions = this.plugin.getDerivedSessions(weekStart, new Date());
		const totalWeekMinutes = weekSessions.reduce((sum, s) => {
			if (s.endAt) {
				return sum + (new Date(s.endAt).getTime() - new Date(s.startAt).getTime()) / (1000 * 60);
			} else if (s.id === this.plugin.data.state.activeSessionId) {
				return sum + (Date.now() - new Date(s.startAt).getTime()) / (1000 * 60);
			}
			return sum;
		}, 0);
		const avgDailyMinutes = totalWeekMinutes / 7;

		// Month analytics
		const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
		const monthSessions = this.plugin.getDerivedSessions(monthStart, new Date());
		const totalMonthMinutes = monthSessions.reduce((sum, s) => {
			if (s.endAt) {
				return sum + (new Date(s.endAt).getTime() - new Date(s.startAt).getTime()) / (1000 * 60);
			} else if (s.id === this.plugin.data.state.activeSessionId) {
				return sum + (Date.now() - new Date(s.startAt).getTime()) / (1000 * 60);
			}
			return sum;
		}, 0);
		const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
		const avgMonthlyDailyMinutes = totalMonthMinutes / daysInMonth;

		// Analytics grid
		const grid = section.createDiv({ 
			attr: { 
				style: `
					display: grid; 
					grid-template-columns: 1fr 1fr; 
					gap: 12px;
					${Platform.isMobile ? 'grid-template-columns: 1fr;' : ''}
				` 
			} 
		});

		// Today's stats
		const todayCard = grid.createDiv({ 
			attr: { 
				style: `
					padding: 12px;
					border-radius: 6px;
					background: var(--background-primary);
					border: 1px solid var(--background-modifier-border);
				` 
			} 
		});
		todayCard.createEl("h4", { 
			text: "Today", 
			attr: { style: "margin: 0 0 8px 0; font-size: 14px; color: var(--text-accent);" } 
		});
		todayCard.createEl("div", { 
			text: `${Math.round(totalTodayMinutes)}min total`, 
			attr: { style: "font-size: 13px; margin-bottom: 4px;" } 
		});
		todayCard.createEl("div", { 
			text: `${switchCount} switches`, 
			attr: { style: "font-size: 13px; color: var(--text-muted);" } 
		});

		// Averages card
		const avgCard = grid.createDiv({ 
			attr: { 
				style: `
					padding: 12px;
					border-radius: 6px;
					background: var(--background-primary);
					border: 1px solid var(--background-modifier-border);
				` 
			} 
		});
		avgCard.createEl("h4", { 
			text: "Averages", 
			attr: { style: "margin: 0 0 8px 0; font-size: 14px; color: var(--text-accent);" } 
		});
		avgCard.createEl("div", { 
			text: `${Math.round(avgDailyMinutes)}min/day (week)`, 
			attr: { style: "font-size: 13px; margin-bottom: 4px;" } 
		});
		avgCard.createEl("div", { 
			text: `${Math.round(avgMonthlyDailyMinutes)}min/day (month)`, 
			attr: { style: "font-size: 13px; color: var(--text-muted);" } 
		});

		// Week and month totals
		const totalsCard = grid.createDiv({ 
			attr: { 
				style: `
					padding: 12px;
					border-radius: 6px;
					background: var(--background-primary);
					border: 1px solid var(--background-modifier-border);
					${Platform.isMobile ? '' : 'grid-column: span 2;'}
				` 
			} 
		});
		totalsCard.createEl("h4", { 
			text: "Totals", 
			attr: { style: "margin: 0 0 8px 0; font-size: 14px; color: var(--text-accent);" } 
		});
		
		const totalsGrid = totalsCard.createDiv({ 
			attr: { 
				style: `
					display: grid; 
					grid-template-columns: 1fr 1fr; 
					gap: 8px;
				` 
			} 
		});
		
		totalsGrid.createEl("div", { 
			text: `Week: ${Math.round(totalWeekMinutes)}min`, 
			attr: { style: "font-size: 13px;" } 
		});
		totalsGrid.createEl("div", { 
			text: `Month: ${Math.round(totalMonthMinutes)}min`, 
			attr: { style: "font-size: 13px;" } 
		});
	}


	private startRealtimeTimer(): void {
		// Clear any existing timer
		if (this.timerInterval) {
			clearInterval(this.timerInterval);
		}

		// Update timer every second if there's an active session
		if (this.plugin.data.state.activeRoleId && this.plugin.data.state.activeStartAt) {
			this.timerInterval = window.setInterval(() => {
				this.updateDurationDisplay();
			}, 1000);
		}
	}

	private updateDurationDisplay(): void {
		if (!this.durationEl || !this.plugin.data.state.activeStartAt) return;

		const startTime = new Date(this.plugin.data.state.activeStartAt);
		const now = Date.now();
		const totalSeconds = Math.floor((now - startTime.getTime()) / 1000);
		
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = totalSeconds % 60;

		let durationText = '';
		if (hours > 0) {
			durationText = `${hours}h ${minutes}m ${seconds}s`;
		} else if (minutes > 0) {
			durationText = `${minutes}m ${seconds}s`;
		} else {
			durationText = `${seconds}s`;
		}

		this.durationEl.setText(`Duration: ${durationText}`);
	}

	private createCurrentStatusSection(container: HTMLElement): void {
		const statusSection = container.createDiv({ 
			attr: { 
				style: "background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #007acc;" 
			} 
		});

		statusSection.createEl("h3", { text: "Current History", attr: { style: "margin-top: 0; color: #007acc;" } });

		if (this.plugin.data.state.activeRoleId) {
			const activeRole = this.plugin.data.roles.find(r => r.id === this.plugin.data.state.activeRoleId);
			if (activeRole) {
				const activeInfo = statusSection.createDiv({ 
					attr: { style: "display: flex; align-items: center; margin-bottom: 10px;" } 
				});
				
				// Active role color dot with icon
				const activeRoleDot = activeInfo.createDiv({ 
					attr: { 
						style: `
							width: 24px; 
							height: 24px; 
							border-radius: 50%; 
							background-color: ${activeRole.colorHex}; 
							margin-right: 12px; 
							box-shadow: 0 2px 4px rgba(0,0,0,0.1);
							display: flex;
							align-items: center;
							justify-content: center;
						` 
					} 
				});

				// Add icon if available
				if (activeRole.icon && IconLibrary.ICONS[activeRole.icon]) {
					const statusIconEl = activeRoleDot.createDiv({ 
						attr: { 
							style: `
								width: 12px; 
								height: 12px; 
								color: white;
								filter: drop-shadow(0 1px 1px rgba(0,0,0,0.3));
							` 
						} 
					});
					const iconElement = IconLibrary.createIconElement(activeRole.icon, 12, 'white');
					statusIconEl.appendChild(iconElement);
				}
				
				// Role name and duration
				const roleInfo = activeInfo.createDiv();
				roleInfo.createEl("strong", { 
					text: `Active: ${activeRole.name}`, 
					attr: { style: "font-size: 18px; color: #333;" } 
				});
				
				// Create real-time session duration
				if (this.plugin.data.state.activeStartAt) {
					this.durationEl = roleInfo.createEl("div", { 
						text: "Duration: 0s", 
						attr: { style: "color: #666; margin-top: 4px;" } 
					});
					// Initial update
					this.updateDurationDisplay();
				}

				// Lock status
				if (this.plugin.isSessionLocked()) {
					const remaining = this.plugin.getRemainingLockTime();
					statusSection.createDiv({ 
						text: `🔒 Session locked for ${remaining}s (prevents micro-switching)`,
						attr: { style: "color: #e74c3c; font-weight: 500; margin-top: 10px;" }
					});
				} else {
					statusSection.createDiv({ 
						text: "✅ Ready to switch roles",
						attr: { style: "color: #27ae60; font-weight: 500; margin-top: 10px;" }
					});
				}
			}
		} else {
			statusSection.createDiv({ 
				text: "⏸️ No active session - Click a role below to start tracking",
				attr: { style: "color: #666; font-style: italic; font-size: 16px;" }
			});
		}
	}

	private createRolesGridSection(container: HTMLElement): void {
		const rolesSection = container.createDiv({ attr: { style: "margin-bottom: 20px;" } });
		rolesSection.createEl("h3", { text: "Select Role", attr: { style: "margin-bottom: 15px;" } });

		if (this.plugin.data.roles.length === 0) {
			rolesSection.createDiv({ 
				text: "No roles defined yet. Use the settings to create your first role.",
				attr: { style: "text-align: center; padding: 40px; color: #666; background: #f8f9fa; border-radius: 8px;" }
			});
			return;
		}

		// Create responsive grid
		const rolesGrid = rolesSection.createDiv({ 
			attr: { 
				style: `display: grid; grid-template-columns: repeat(auto-fill, minmax(${Platform.isMobile ? "280px" : "320px"}, 1fr)); gap: 15px;` 
			} 
		});

		this.plugin.data.roles.forEach(role => {
			this.createRoleCard(rolesGrid, role);
		});
	}

	private createRoleCard(container: HTMLElement, role: Role): void {
		const isActive = this.plugin.data.state.activeRoleId === role.id;
		const isLocked = this.plugin.isSessionLocked() && isActive;

		const roleCard = container.createDiv({ 
			cls: "role-dashboard-card",
			attr: { 
				style: `
					border: 2px solid ${isActive ? role.colorHex : "#ddd"};
					border-radius: 12px;
					padding: 20px;
					cursor: ${isActive && isLocked ? "not-allowed" : "pointer"};
					transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
					background: ${isActive ? `linear-gradient(135deg, ${role.colorHex}20, ${role.colorHex}10)` : "linear-gradient(135deg, #fff, #f8f9fa)"};
					position: relative;
					box-shadow: ${isActive ? `0 8px 25px ${role.colorHex}25, 0 4px 12px ${role.colorHex}20` : "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.05)"};
					opacity: ${isActive && isLocked ? "0.7" : "1"};
					overflow: hidden;
					transform: translateZ(0);
					backdrop-filter: blur(10px);
				` 
			}
		});

		// Add subtle background pattern for active cards
		if (isActive) {
			const pattern = roleCard.createDiv({
				attr: {
					style: `
						position: absolute;
						top: -50%;
						right: -50%;
						width: 200%;
						height: 200%;
						background: radial-gradient(circle, ${role.colorHex}08 0%, transparent 70%);
						pointer-events: none;
						z-index: 0;
					`
				}
			});
		}

		// Active indicator badge with pulsing animation
		if (isActive) {
			const badge = roleCard.createDiv({
				attr: {
					style: `
						position: absolute;
						top: 12px;
						right: 15px;
						width: 12px;
						height: 12px;
						border-radius: 50%;
						background: ${role.colorHex};
						box-shadow: 0 0 10px ${role.colorHex}60, 0 0 20px ${role.colorHex}40;
						z-index: 10;
					`
				}
			});

			// Add pulsing animation
			if (!isLocked) {
				badge.addClass('pulse-glow');
			}
		}

		// Role header with color and name
		const roleHeader = roleCard.createDiv({ attr: { style: "display: flex; align-items: center; margin-bottom: 12px; position: relative; z-index: 5;" } });
		
		// Icon and color circle container
		const iconContainer = roleHeader.createDiv({ 
			attr: { 
				style: `
					position: relative;
					width: 40px; 
					height: 40px; 
					margin-right: 15px;
				` 
			} 
		});

		// Large color circle
		const colorCircle = iconContainer.createDiv({ 
			attr: { 
				style: `
					width: 40px; 
					height: 40px; 
					border-radius: 50%; 
					background-color: ${role.colorHex}; 
					box-shadow: 0 2px 6px rgba(0,0,0,0.2);
					display: flex;
					align-items: center;
					justify-content: center;
				` 
			} 
		});

		// Role icon if available
		if (role.icon && IconLibrary.ICONS[role.icon]) {
			const iconEl = colorCircle.createDiv({ 
				attr: { 
					style: `
						width: 20px; 
						height: 20px; 
						color: white;
						filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
					` 
				} 
			});
			const iconElement = IconLibrary.createIconElement(role.icon, 20, 'white');
			iconEl.appendChild(iconElement);
		}

		// Role name and description
		const roleText = roleHeader.createDiv({ attr: { style: "flex: 1;" } });
		roleText.createEl("h4", { 
			text: role.name, 
			attr: { 
				style: `margin: 0; font-size: 18px; color: ${isActive ? role.colorHex : "#333"}; font-weight: 600;` 
			} 
		});

		if (role.description) {
			roleText.createDiv({ 
				text: role.description, 
				attr: { style: "color: #666; font-size: 14px; margin-top: 4px;" } 
			});
		}

		// Status and action section
		const actionSection = roleCard.createDiv({ attr: { style: "margin-top: 15px; position: relative; z-index: 5;" } });

		if (isActive) {
			if (isLocked) {
				const remaining = this.plugin.getRemainingLockTime();
				actionSection.createDiv({ 
					text: `🔒 Locked (${remaining}s remaining)`,
					attr: { style: "color: #e74c3c; font-size: 14px; text-align: center; font-weight: 500;" }
				});
			} else {
				actionSection.createDiv({ 
					text: "✅ Currently Active - Click to continue or end session",
					attr: { style: "color: #27ae60; font-size: 14px; text-align: center; font-weight: 500;" }
				});
			}
		} else {
			actionSection.createDiv({ 
				text: this.plugin.data.state.activeRoleId ? "👆 Click to switch to this role" : "🚀 Click to start this role",
				attr: { style: "color: #007acc; font-size: 14px; text-align: center; font-weight: 500;" }
			});
		}

		// Click handler for role selection
		roleCard.addEventListener("click", () => this.handleRoleClick(role));

		// Enhanced hover effects (desktop only)
		if (!Platform.isMobile) {
			roleCard.addEventListener("mouseenter", () => {
				if (!isActive || !isLocked) {
					roleCard.style.transform = "translateY(-4px) scale(1.02)";
					roleCard.style.boxShadow = `0 12px 30px ${role.colorHex}35, 0 8px 16px ${role.colorHex}25`;
					roleCard.style.borderColor = role.colorHex;
					
					// Enhance icon glow on hover
					const iconEl = roleCard.querySelector('[style*="width: 20px"]') as HTMLElement;
					if (iconEl && role.icon) {
						iconEl.style.filter = `drop-shadow(0 2px 4px rgba(0,0,0,0.3)) drop-shadow(0 0 8px ${role.colorHex}60)`;
					}
				}
			});

			roleCard.addEventListener("mouseleave", () => {
				roleCard.style.transform = "translateY(0) scale(1)";
				roleCard.style.boxShadow = isActive ? `0 8px 25px ${role.colorHex}25, 0 4px 12px ${role.colorHex}20` : "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.05)";
				roleCard.style.borderColor = isActive ? role.colorHex : "#ddd";
				
				// Reset icon glow
				const iconEl = roleCard.querySelector('[style*="width: 20px"]') as HTMLElement;
				if (iconEl && role.icon) {
					iconEl.style.filter = "drop-shadow(0 1px 2px rgba(0,0,0,0.3))";
				}
			});
		}
	}

	private handleRoleClick(role: Role): void {
		const isActive = this.plugin.data.state.activeRoleId === role.id;
		const isLocked = this.plugin.isSessionLocked();

		if (isActive) {
			if (isLocked) {
				const remaining = this.plugin.getRemainingLockTime();
				new Notice(`Cannot switch yet. Wait ${remaining}s to avoid micro-switching.`);
				return;
			}
			
			// Show options for active role
			this.showActiveRoleOptions(role);
		} else {
			// Handle role switch/start
			if (this.plugin.data.state.activeRoleId) {
				if (isLocked) {
					const remaining = this.plugin.getRemainingLockTime();
					new Notice(`Cannot switch yet. Wait ${remaining}s to avoid micro-switching.`);
					return;
				}
				// Switch to new role
				this.plugin.switchSession(role.id);
			} else {
				// Start new session
				this.plugin.startSession(role.id);
			}
			this.close();
		}
	}

	private showActiveRoleOptions(role: Role): void {
		// Create a quick action popup for the active role
		const popup = this.contentEl.createDiv({
			attr: {
				style: `
					position: fixed;
					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%);
					background: white;
					border: 2px solid ${role.colorHex};
					border-radius: 12px;
					padding: 20px;
					box-shadow: 0 8px 24px rgba(0,0,0,0.3);
					z-index: 1000;
					min-width: 250px;
				`
			}
		});

		popup.createEl("h3", { 
			text: `${role.name} Options`, 
			attr: { style: `color: ${role.colorHex}; margin-top: 0;` }
		});

		// Continue working button
		const continueBtn = popup.createEl("button", { 
			text: "✅ Continue Working",
			attr: { style: "width: 100%; margin-bottom: 10px; padding: 10px; font-size: 16px;" }
		});
		continueBtn.addEventListener("click", () => {
			popup.remove();
			this.close();
		});

		// Add note button
		const noteBtn = popup.createEl("button", { 
			text: "📝 Add Note",
			attr: { style: "width: 100%; margin-bottom: 10px; padding: 10px; font-size: 16px;" }
		});
		noteBtn.addEventListener("click", () => {
			popup.remove();
			this.close();
			if (this.plugin.data.state.activeSessionId) {
				new NoteEditModal(this.app, this.plugin, this.plugin.data.state.activeSessionId, null).open();
			}
		});

		// End session button
		const endBtn = popup.createEl("button", { 
			text: "⏹️ End Session",
			attr: { style: "width: 100%; margin-bottom: 10px; padding: 10px; font-size: 16px; background: #e74c3c; color: white;" }
		});
		endBtn.addEventListener("click", () => {
			popup.remove();
			this.plugin.endSession();
			this.close();
		});

		// Cancel button
		const cancelBtn = popup.createEl("button", { 
			text: "Cancel",
			attr: { style: "width: 100%; padding: 10px; font-size: 16px;" }
		});
		cancelBtn.addEventListener("click", () => {
			popup.remove();
		});

		// Close popup when clicking outside
		const overlay = document.createElement("div");
		overlay.style.position = "fixed";
		overlay.style.top = "0";
		overlay.style.left = "0";
		overlay.style.width = "100%";
		overlay.style.height = "100%";
		overlay.style.background = "rgba(0,0,0,0.3)";
		overlay.style.zIndex = "999";
		overlay.addEventListener("click", () => {
			overlay.remove();
			popup.remove();
		});
		document.body.appendChild(overlay);
	}

	private createQuickActionsSection(container: HTMLElement): void {
		const actionsSection = container.createDiv({ 
			attr: { style: "border-top: 1px solid #eee; padding-top: 20px;" } 
		});
		
		actionsSection.createEl("h3", { text: "Quick Actions" });

		const buttonContainer = actionsSection.createDiv({ 
			attr: { 
				style: `display: ${Platform.isMobile ? "block" : "flex"}; gap: 10px; justify-content: center;` 
			} 
		});

		// Analytics button
		const analyticsBtn = buttonContainer.createEl("button", { 
			text: "📊 View Analytics",
			attr: { 
				style: `padding: 12px 20px; font-size: 16px; ${Platform.isMobile ? "width: 100%; margin-bottom: 10px;" : ""}` 
			}
		});
		analyticsBtn.addEventListener("click", () => {
			this.close();
			new AnalyticsModal(this.app, this.plugin).open();
		});

		// Settings button
		const settingsBtn = buttonContainer.createEl("button", { 
			text: "⚙️ Settings",
			attr: { 
				style: `padding: 12px 20px; font-size: 16px; ${Platform.isMobile ? "width: 100%;" : ""}` 
			}
		});
		settingsBtn.addEventListener("click", () => {
			this.close();
			// Open settings - access through app.setting
			(this.app as any).setting.open();
			(this.app as any).setting.openTabById("taskswitch");
		});
	}

	private createHistorySection(container: HTMLElement): void {
		const historySection = container.createDiv({ 
			attr: { 
				style: "background: #f8f9fa; border-radius: 8px; padding: 20px; margin-top: 20px; border-left: 4px solid #28a745;" 
			} 
		});

		historySection.createEl("h3", { text: "Today's History", attr: { style: "margin-top: 0; color: #28a745;" } });

		const todayEvents = this.getTodayEvents();
		
		if (todayEvents.length === 0) {
			historySection.createDiv({ 
				text: "No activity recorded today",
				attr: { style: "color: #666; font-style: italic; text-align: center; padding: 20px;" }
			});
			return;
		}

		const historyContainer = historySection.createDiv({ 
			attr: { 
				style: "max-height: 200px; overflow-y: auto; margin-top: 10px;" 
			} 
		});

		todayEvents.forEach((event, index) => {
			const eventEl = historyContainer.createDiv({ 
				attr: { 
					style: `
						display: flex; 
						align-items: center; 
						gap: 10px; 
						padding: 8px 12px; 
						margin-bottom: 6px; 
						background: white; 
						border-radius: 6px; 
						border-left: 3px solid ${this.getEventColor(event.type)};
					` 
				} 
			});

			// Event time
			const timeEl = eventEl.createDiv({ 
				text: new Date(event.at).toLocaleTimeString('en-US', { 
					hour: '2-digit', 
					minute: '2-digit',
					hour12: false 
				}),
				attr: { 
					style: "font-size: 12px; color: #666; min-width: 50px; font-family: monospace;" 
				} 
			});

			// Event icon and description
			const contentEl = eventEl.createDiv({ attr: { style: "flex: 1;" } });
			const role = this.plugin.data.roles.find(r => r.id === event.roleId);
			const roleName = role ? role.name : 'Unknown Role';

			let eventText = '';
			let eventIcon = '';
			
			switch (event.type) {
				case 'start':
					eventText = `Started "${roleName}"`;
					eventIcon = '▶️';
					break;
				case 'switch':
					eventText = `Switched to "${roleName}"`;
					eventIcon = '🔄';
					break;
				case 'end':
					eventText = `Ended "${roleName}"`;
					eventIcon = '⏹️';
					break;
				case 'noteAdded':
					eventText = `Added note to "${roleName}"`;
					eventIcon = '📝';
					break;
				default:
					eventText = `"${roleName}" - ${event.type}`;
					eventIcon = '•';
			}

			contentEl.createSpan({ 
				text: `${eventIcon} ${eventText}`,
				attr: { style: "font-size: 13px;" }
			});
		});
	}

	private getTodayEvents(): Event[] {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		return this.plugin.data.events
			.filter(event => {
				const eventDate = new Date(event.at);
				return eventDate >= today && eventDate < tomorrow;
			})
			.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()) // Most recent first
			.slice(0, 20); // Limit to 20 events
	}

	private getEventColor(eventType: string): string {
		switch (eventType) {
			case 'start':
				return '#28a745'; // Green
			case 'switch':
				return '#007bff'; // Blue
			case 'end':
				return '#dc3545'; // Red
			case 'noteAdded':
				return '#ffc107'; // Yellow/Orange
			default:
				return '#6c757d'; // Gray
		}
	}

	onClose() {
		// Clear timer when modal closes
		if (this.timerInterval) {
			clearInterval(this.timerInterval);
			this.timerInterval = null;
		}
		
		const { contentEl } = this;
		contentEl.empty();
	}
}
