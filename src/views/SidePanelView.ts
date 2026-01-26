// Side Panel View Component

import { ItemView, WorkspaceLeaf, Notice } from 'obsidian';
import { ROLESWITCH_VIEW_TYPE, Role } from '../types';
import { IconLibrary } from '../icons';
import { Utils } from '../utils';
import { RoleDashboardModal } from './Modals';
import type RoleSwitchPlugin from '../../main';

export class RoleSwitchView extends ItemView {
	private plugin: RoleSwitchPlugin;
	private timerInterval: number | null = null;
	private durationElement: HTMLElement | null = null;
	private lockElement: HTMLElement | null = null;
	private roleLockElements: Map<string, HTMLElement> = new Map();
	private endSessionButton: HTMLButtonElement | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: RoleSwitchPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType() {
		return ROLESWITCH_VIEW_TYPE;
	}

	getDisplayText() {
		return "Role-switch";
	}

	getIcon() {
		return "clock";
	}

	async onOpen() {
		const container = this.containerEl.children[1];

		if (!container) {
			return await Promise.resolve();
		}

		// Type check: ensure container is HTMLElement
		if (!(container instanceof HTMLElement)) {
			return await Promise.resolve();
		}

		container.empty();
		container.addClass('role-switch-view');

		// Create side panel dashboard
		try {
			this.createSidePanelDashboard(container);
		} catch {
			// Fallback: create a simple test display
			this.createFallbackDashboard(container);
		}
		return await Promise.resolve();
	}

	async onClose() {
		// Cleanup timer when view closes
		this.stopRealtimeTimer();
		return await Promise.resolve();
	}

	private createSidePanelDashboard(container: HTMLElement): void {
		// Header with plugin branding
		const header = container.createDiv({ cls: 'rs-side-panel-header' });

		// RoleSwitch logo or icon
		const headerIcon = header.createDiv({ cls: 'rs-header-icon' });

		// Use inline SVG logo
		const logoElement = IconLibrary.createLogoElement(24);
		logoElement.addClass('rs-header-logo');
		headerIcon.appendChild(logoElement);

		header.createEl('h2', {
			text: 'Role-switch',
			cls: 'rs-header-title'
		});

		// Roles section (moved to top)
		try {
			this.createCompactRolesSection(container);
		} catch {
			// Failed to create roles section
		}

		// Quick actions section
		try {
			this.createQuickActionsSection(container);
		} catch {
			// Failed to create quick actions section
		}

		// Current status section
		try {
			this.createCompactStatusSection(container);
		} catch {
			// Failed to create status section
		}
	}

	private createCompactStatusSection(container: HTMLElement): void {
		const statusSection = container.createDiv({ cls: 'rs-side-panel-section' });
		statusSection.createEl('h3', { text: 'Current history' });

		const statusCard = statusSection.createDiv({ cls: 'rs-current-status-compact' });

		// Current active session
		if (this.plugin.data.state.activeRoleId) {
			const activeRole = this.plugin.data.roles.find(r => r.id === this.plugin.data.state.activeRoleId);
			if (activeRole) {
				const statusInfo = statusCard.createDiv({
					cls: 'rs-status-info'
				});

				// Role icon/color
				const roleIndicator = statusInfo.createDiv({
					cls: 'rs-role-indicator rs-role-color-bg'
				});
				roleIndicator.setCssProps({ '--role-color': activeRole.colorHex });

				if (activeRole.icon && IconLibrary.ICONS[activeRole.icon]) {
					const iconElement = IconLibrary.createIconElement(activeRole.icon, 12, 'white');
					iconElement.addClass('rs-icon-filter-shadow');
					roleIndicator.appendChild(iconElement);
				}

				// Role info
				const roleInfo = statusInfo.createDiv({ cls: 'rs-role-info' });
				const roleName = roleInfo.createEl('div', {
					text: activeRole.name,
					cls: 'rs-role-name rs-role-color-text'
				});
				roleName.setCssProps({ '--role-color': activeRole.colorHex });

				// Duration with real-time updates
				if (this.plugin.data.state.activeStartAt) {
					const startTime = new Date(this.plugin.data.state.activeStartAt);
					const totalSeconds = Math.floor((Date.now() - startTime.getTime()) / 1000);
					const hours = Math.floor(totalSeconds / 3600);
					const minutes = Math.floor((totalSeconds % 3600) / 60);
					const seconds = totalSeconds % 60;

					// Format initial duration display consistently
					let initialText: string;
					if (hours > 0) {
						initialText = `${hours}h ${minutes}m ${seconds}s`;
					} else if (minutes > 0) {
						initialText = `${minutes}m ${seconds}s`;
					} else {
						initialText = `${seconds}s`;
					}

					this.durationElement = roleInfo.createEl('div', {
						text: initialText,
						cls: 'rs-role-duration'
					});

					// Start real-time timer
					this.startRealtimeTimer();
				} else {
					// Clear duration element reference if no active session
					this.durationElement = null;
				}

				// Lock status
				if (this.plugin.isSessionLocked()) {
					const remaining = this.plugin.getRemainingLockTime();
					this.lockElement = statusCard.createDiv({
						text: `🔒 Locked (${remaining}s)`,
						cls: 'rs-session-locked'
					});
				} else {
					this.lockElement = null;
				}
			}
		} else {
			// Stop any running timer when no active session
			this.stopRealtimeTimer();
			this.durationElement = null;

			statusCard.createDiv({
				text: '⏸️ No active session',
				cls: 'rs-no-active-session'
			});
		}

		// Today's session history
		this.createTodayHistorySection(statusCard);
	}

	private createTodayHistorySection(container: HTMLElement): void {
		const today = Utils.getStartOfDay();

		// Get today's sessions
		const todaySessions = this.plugin.getDerivedSessions(today, new Date());

		if (todaySessions.length > 0) {
			// History header
			const historyHeader = container.createDiv({ cls: 'rs-history-divider' });
			historyHeader.createEl('div', {
				text: "Today's history",
				cls: 'rs-history-header'
			});

			// Show last 3 sessions
			const recentSessions = todaySessions.slice(-3);
			recentSessions.forEach(session => {
				const role = this.plugin.data.roles.find(r => r.id === session.roleId);
				if (role) {
					const sessionEl = container.createDiv({ cls: 'rs-history-session' });

					// Small role indicator
					const indicator = sessionEl.createDiv({ cls: 'rs-role-indicator rs-role-color-bg' });
					indicator.setCssProps({ '--role-color': role.colorHex });

					// Session info
					const sessionInfo = sessionEl.createDiv({ cls: 'rs-session-info' });
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
						cls: 'rs-session-details'
					});
				}
			});

			// Show more indicator if there are more sessions
			if (todaySessions.length > 3) {
				container.createEl('div', {
					text: `+${todaySessions.length - 3} more sessions`,
					cls: 'rs-more-sessions'
				});
			}
		}
	}

	private createQuickActionsSection(container: HTMLElement): void {
		const actionsSection = container.createDiv({ cls: 'rs-side-panel-section' });
		actionsSection.createEl('h3', { text: 'Quick actions' });

		const actionsContainer = actionsSection.createDiv({ cls: 'rs-quick-actions-container' });

		// Dashboard button
		const dashboardBtn = actionsContainer.createEl('button', {
			text: 'Dashboard',
			cls: 'rs-quick-action-btn'
		});
		dashboardBtn.addEventListener('click', () => {
			try {
				new RoleDashboardModal(this.app, this.plugin).open();
			} catch (error) {
				new Notice(`Dashboard error: ${error instanceof Error ? error.message : 'Unknown error'}`);
			}
		});

		// End session button (if active) - always visible but disabled when locked
		if (this.plugin.data.state.activeRoleId) {
			const isLocked = this.plugin.isSessionLocked();
			this.endSessionButton = actionsContainer.createEl('button', {
				text: 'End session ⏹️',
				cls: 'rs-quick-action-btn rs-end-session'
			});

			if (isLocked) {
				this.endSessionButton.disabled = true;
				this.endSessionButton.addClass('rs-locked');
				const remaining = this.plugin.getRemainingLockTime();
				this.endSessionButton.title = `Session locked for ${remaining} more seconds`;
			}

			this.endSessionButton.addEventListener('click', () => {
				if (!this.plugin.isSessionLocked()) {
					this.plugin.endSession();
					this.refresh();
				}
			});
		} else {
			this.endSessionButton = null;
		}
	}

	private createCompactRolesSection(container: HTMLElement): void {
		const rolesSection = container.createDiv({ cls: 'rs-side-panel-section' });
		rolesSection.createEl('h3', { text: 'Roles' });

		const rolesGrid = rolesSection.createDiv({ cls: 'rs-compact-roles-grid' });

		// Clear the lock elements map before recreating role cards
		this.roleLockElements.clear();

		this.plugin.data.roles.forEach(role => {
			this.createCompactRoleCard(rolesGrid, role);
		});
	}

	private createCompactRoleCard(container: HTMLElement, role: Role): void {
		const isActive = this.plugin.data.state.activeRoleId === role.id;
		const isLocked = isActive && this.plugin.isSessionLocked();

		const roleCard = container.createDiv({
			cls: `rs-compact-role-card ${isActive ? 'rs-active rs-role-color-border' : ''} ${isLocked ? 'rs-locked' : ''}`
		});

		if (isActive) {
			roleCard.setCssProps({ '--role-color': role.colorHex });
		}

		const roleHeader = roleCard.createDiv({ cls: 'rs-compact-role-header' });

		// Role icon/color circle
		const roleIndicator = roleHeader.createDiv({ cls: 'rs-compact-role-icon rs-role-color-bg' });
		roleIndicator.setCssProps({ '--role-color': role.colorHex });

		if (role.icon && IconLibrary.ICONS[role.icon]) {
			const iconElement = IconLibrary.createIconElement(role.icon, 10, 'white');
			iconElement.addClass('rs-icon-filter-shadow');
			roleIndicator.appendChild(iconElement);
		}

		// Role info
		const roleInfo = roleHeader.createDiv({ cls: 'rs-role-info' });
		roleInfo.createEl('div', {
			text: role.name,
			cls: 'rs-compact-role-name'
		});

		// Lock status
		if (isLocked) {
			const remaining = this.plugin.getRemainingLockTime();
			const lockStatusEl = roleCard.createDiv({
				text: `🔒 ${remaining}s`,
				cls: 'rs-lock-status'
			});
			// Store reference to this lock element for real-time updates
			this.roleLockElements.set(role.id, lockStatusEl);
		}

		// Click handler
		roleCard.addEventListener('click', (event) => {
			if (isLocked) {
				return; // Can't switch when locked
			}

			// Add visual click effect
			roleCard.addClass('rs-clicked');
			window.setTimeout(() => roleCard.removeClass('rs-clicked'), 200);

			if (isActive) {
				// Open dashboard when clicking active role
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
		// Stop any existing timer before refreshing
		this.stopRealtimeTimer();
		void this.onOpen();
	}

	private createFallbackDashboard(container: HTMLElement): void {
		// Simple fallback content
		container.createEl('h2', {
			text: 'Role-switch panel',
			cls: 'rs-fallback-dashboard-title'
		});

		container.createEl('p', {
			text: 'Dashboard is loading...',
			cls: 'rs-fallback-dashboard-loading'
		});

		// Show plugin data info
		const infoDiv = container.createDiv({
			cls: 'rs-fallback-info-container'
		});

		infoDiv.createEl('p', { text: `Roles count: ${this.plugin.data.roles.length}` });
		infoDiv.createEl('p', { text: `Active role: ${this.plugin.data.state.activeRoleId || 'None'}` });
		infoDiv.createEl('p', { text: `Events count: ${this.plugin.data.events.length}` });

		// Test button
		const testBtn = container.createEl('button', {
			text: 'Test dashboard',
			cls: 'rs-fallback-test-button'
		});
		testBtn.addEventListener('click', () => {
			new Notice('Dashboard is working!');
		});
	}

	private startRealtimeTimer(): void {
		// Clear any existing timer
		this.stopRealtimeTimer();

		// Only start timer if there's an active session and duration element
		if (!this.plugin.data.state.activeStartAt || !this.durationElement) {
			return;
		}

		// Update timer every second - use plugin's registerInterval for proper lifecycle management
		this.timerInterval = this.plugin.registerInterval(window.setInterval(() => {
			this.updateDurationDisplay();
			this.updateLockDisplay();
		}, 1000));
	}

	private stopRealtimeTimer(): void {
		if (this.timerInterval !== null) {
			window.clearInterval(this.timerInterval);
			this.timerInterval = null;
		}
	}

	private updateDurationDisplay(): void {
		// Check if we still have an active session and duration element
		if (!this.plugin.data.state.activeStartAt || !this.durationElement) {
			this.stopRealtimeTimer();
			return;
		}

		const startTime = new Date(this.plugin.data.state.activeStartAt);
		const totalSeconds = Math.floor((Date.now() - startTime.getTime()) / 1000);
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = totalSeconds % 60;

		// Display format based on duration
		let displayText: string;
		if (hours > 0) {
			displayText = `${hours}h ${minutes}m ${seconds}s`;
		} else if (minutes > 0) {
			displayText = `${minutes}m ${seconds}s`;
		} else {
			displayText = `${seconds}s`;
		}

		this.durationElement.textContent = displayText;
	}

	private updateLockDisplay(): void {
		const isLocked = this.plugin.isSessionLocked();

		// Update lock display in Current History section
		if (this.lockElement) {
			if (isLocked) {
				const remaining = this.plugin.getRemainingLockTime();
				this.lockElement.textContent = `🔒 Locked (${remaining}s)`;
			} else {
				// Session is no longer locked, remove the element
				this.lockElement.remove();
				this.lockElement = null;
			}
		}

		// Update lock displays in role cards
		if (this.plugin.data.state.activeRoleId) {
			const activeRoleId = this.plugin.data.state.activeRoleId;
			const lockEl = this.roleLockElements.get(activeRoleId);

			if (lockEl) {
				if (isLocked) {
					const remaining = this.plugin.getRemainingLockTime();
					lockEl.textContent = `🔒 ${remaining}s`;
				} else {
					// Session is no longer locked, remove the element
					lockEl.remove();
					this.roleLockElements.delete(activeRoleId);
				}
			}
		}

		// Update end session button state
		if (this.endSessionButton) {
			if (isLocked) {
				this.endSessionButton.disabled = true;
				this.endSessionButton.addClass('rs-locked');
				const remaining = this.plugin.getRemainingLockTime();
				this.endSessionButton.title = `Session locked for ${remaining} more seconds`;
			} else {
				// Session is no longer locked, enable the button
				this.endSessionButton.disabled = false;
				this.endSessionButton.removeClass('rs-locked');
				this.endSessionButton.title = '';
			}
		}
	}
}
