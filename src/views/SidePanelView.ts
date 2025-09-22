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

	constructor(leaf: WorkspaceLeaf, plugin: RoleSwitchPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType() {
		return ROLESWITCH_VIEW_TYPE;
	}

	getDisplayText() {
		return "RoleSwitch";
	}

	getIcon() {
		return "clock";
	}

	async onOpen() {
		const container = this.containerEl.children[1];

		if (!container) {
			console.error('RoleSwitchView: No container element found!');
			return;
		}

		container.empty();
		container.addClass('role-switch-view');

		// Add custom styles for side panel
		this.addSidePanelStyles();

		// Create side panel dashboard
		try {
			this.createSidePanelDashboard(container as HTMLElement);
		} catch (error) {
			console.error('RoleSwitchView: Error creating dashboard:', error);
			// Fallback: create a simple test display
			this.createFallbackDashboard(container as HTMLElement);
		}
	}

	async onClose() {
		// Cleanup timer when view closes
		this.stopRealtimeTimer();
	}

	private addSidePanelStyles(): void {
		// Check if styles already added
		if (document.getElementById('role-switch-side-panel-styles')) {
			return;
		}

		// Add custom CSS for side panel styling
		const style = document.createElement('style');
		style.id = 'role-switch-side-panel-styles';
		style.textContent = `
			.role-switch-view {
				padding: 16px;
				height: 100%;
				overflow-y: auto;
			}
			
			.role-switch-view .side-panel-header {
				display: flex;
				align-items: center;
				gap: 8px;
				margin-bottom: 16px;
			}
			
			.role-switch-view .header-icon {
				width: 20px;
				height: 20px;
				display: flex;
				align-items: center;
				justify-content: center;
				color: var(--interactive-accent);
			}
		`;
		document.head.appendChild(style);
	}

	private createSidePanelDashboard(container: HTMLElement): void {
		// Header with plugin branding
		const header = container.createDiv({ cls: 'side-panel-header' });

		// RoleSwitch icon using existing icon library
		const headerIcon = header.createDiv({ cls: 'header-icon' });
		try {
			const iconElement = IconLibrary.createIconElement('gear', 20, 'var(--interactive-accent)');
			if (iconElement.firstChild) {
				headerIcon.appendChild(iconElement.firstChild as Node);
			}
		} catch (error) {
			console.error('RoleSwitchView: Error creating header icon:', error);
		}

		const headerTitle = header.createEl('h2', {
			text: 'RoleSwitch',
			cls: 'header-title'
		});

		// Roles section (moved to top)
		try {
			this.createCompactRolesSection(container);
		} catch (error) {
			console.error('RoleSwitchView: Error creating roles section:', error);
		}

		// Quick actions section
		try {
			this.createQuickActionsSection(container);
		} catch (error) {
			console.error('RoleSwitchView: Error creating quick actions section:', error);
		}

		// Current status section
		try {
			this.createCompactStatusSection(container);
		} catch (error) {
			console.error('RoleSwitchView: Error creating status section:', error);
		}
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
						cls: 'role-duration'
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
					statusCard.createDiv({
						text: `🔒 Locked (${remaining}s)`,
						cls: 'session-locked'
					});
				}
			}
		} else {
			// Stop any running timer when no active session
			this.stopRealtimeTimer();
			this.durationElement = null;

			statusCard.createDiv({
				text: '⏸️ No active session',
				cls: 'no-active-session'
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
			const historyHeader = container.createDiv({ cls: 'history-divider' });
			historyHeader.createEl('div', {
				text: "Today's History",
				cls: 'history-header'
			});

			// Show last 3 sessions
			const recentSessions = todaySessions.slice(-3);
			recentSessions.forEach(session => {
				const role = this.plugin.data.roles.find(r => r.id === session.roleId);
				if (role) {
					const sessionEl = container.createDiv({ cls: 'history-session' });

					// Small role indicator
					const indicator = sessionEl.createDiv({ cls: 'role-indicator' });
					indicator.style.backgroundColor = role.colorHex;

					// Session info
					const sessionInfo = sessionEl.createDiv({ cls: 'session-info' });
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
						cls: 'session-details'
					});
				}
			});

			// Show more indicator if there are more sessions
			if (todaySessions.length > 3) {
				container.createEl('div', {
					text: `+${todaySessions.length - 3} more sessions`,
					cls: 'more-sessions'
				});
			}
		}
	}

	private createQuickActionsSection(container: HTMLElement): void {
		const actionsSection = container.createDiv({ cls: 'side-panel-section' });
		actionsSection.createEl('h3', { text: 'Quick Actions' });

		const actionsContainer = actionsSection.createDiv({ cls: 'quick-actions-container' });

		// Dashboard button
		const dashboardBtn = actionsContainer.createEl('button', {
			text: 'Dashboard',
			cls: 'quick-action-btn'
		});
		dashboardBtn.addEventListener('click', () => {
			try {
				new RoleDashboardModal(this.app, this.plugin).open();
			} catch (error) {
				console.error('RoleSwitchView: Error opening dashboard:', error);
				new Notice('Dashboard not available. Please check console for details.');
			}
		});

		// End session button (if active)
		if (this.plugin.data.state.activeRoleId && !this.plugin.isSessionLocked()) {
			const endBtn = actionsContainer.createEl('button', {
				text: '⏹️ End Session',
				cls: 'quick-action-btn end-session'
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

		const rolesGrid = rolesSection.createDiv({ cls: 'compact-roles-grid' });

		this.plugin.data.roles.forEach(role => {
			this.createCompactRoleCard(rolesGrid, role);
		});
	}

	private createCompactRoleCard(container: HTMLElement, role: Role): void {
		const isActive = this.plugin.data.state.activeRoleId === role.id;
		const isLocked = isActive && this.plugin.isSessionLocked();

		const roleCard = container.createDiv({
			cls: `compact-role-card ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`
		});

		if (isActive) {
			roleCard.style.borderColor = role.colorHex;
		}

		const roleHeader = roleCard.createDiv({ cls: 'compact-role-header' });
		
		// Role icon/color circle
		const roleIndicator = roleHeader.createDiv({ cls: 'compact-role-icon' });
		roleIndicator.style.backgroundColor = role.colorHex;

		if (role.icon && IconLibrary.ICONS[role.icon]) {
			const iconElement = IconLibrary.createIconElement(role.icon, 10, 'white');
			iconElement.style.filter = 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))';
			roleIndicator.appendChild(iconElement);
		}

		// Role info
		const roleInfo = roleHeader.createDiv({ cls: 'role-info' });
		roleInfo.createEl('div', {
			text: role.name,
			cls: 'compact-role-name'
		});

		// Lock status
		if (isLocked) {
			const remaining = this.plugin.getRemainingLockTime();
			roleCard.createDiv({
				text: `🔒 ${remaining}s`,
				cls: 'lock-status'
			});
		}

		// Click handler
		roleCard.addEventListener('click', () => {
			if (isLocked) {
				return; // Can't switch when locked
			}

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
		this.onOpen();
	}

	private createFallbackDashboard(container: HTMLElement): void {
		// Simple fallback content
		container.createEl('h2', {
			text: 'RoleSwitch Panel',
			cls: 'fallback-dashboard-title'
		});

		container.createEl('p', {
			text: 'Dashboard is loading...',
			cls: 'fallback-dashboard-loading'
		});

		// Show plugin data info
		const infoDiv = container.createDiv({
			cls: 'fallback-info-container'
		});

		infoDiv.createEl('p', { text: `Roles count: ${this.plugin.data.roles.length}` });
		infoDiv.createEl('p', { text: `Active role: ${this.plugin.data.state.activeRoleId || 'None'}` });
		infoDiv.createEl('p', { text: `Events count: ${this.plugin.data.events.length}` });

		// Test button
		const testBtn = container.createEl('button', {
			text: 'Test Dashboard',
			cls: 'fallback-test-button'
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

		// Update timer every second
		this.timerInterval = window.setInterval(() => {
			this.updateDurationDisplay();
		}, 1000);
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
}
