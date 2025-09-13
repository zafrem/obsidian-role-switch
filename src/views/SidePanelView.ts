// Side Panel View Component

import { ItemView, WorkspaceLeaf, Notice } from 'obsidian';
import { TASKSWITCH_VIEW_TYPE, Role } from '../types';
import { IconLibrary } from '../icons';
import { Utils } from '../utils';
import { RoleDashboardModal } from './Modals';
import type TaskSwitchPlugin from '../../main';

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
		console.log('TaskSwitchView: onOpen called');
		console.log('TaskSwitchView: containerEl:', this.containerEl);
		console.log('TaskSwitchView: containerEl children:', this.containerEl.children.length);
		
		const container = this.containerEl.children[1];
		console.log('TaskSwitchView: container element:', container);
		
		if (!container) {
			console.error('TaskSwitchView: No container element found!');
			return;
		}
		
		container.empty();
		container.addClass('taskswitch-view');
		console.log('TaskSwitchView: Container prepared, adding styles...');

		// Add custom styles for side panel
		this.addSidePanelStyles();
		console.log('TaskSwitchView: Styles added, creating dashboard...');

		// Create side panel dashboard
		try {
			this.createSidePanelDashboard(container as HTMLElement);
			console.log('TaskSwitchView: Dashboard created successfully');
		} catch (error) {
			console.error('TaskSwitchView: Error creating dashboard:', error);
			// Fallback: create a simple test display
			this.createFallbackDashboard(container as HTMLElement);
		}
	}

	async onClose() {
		// Cleanup if needed
	}

	private addSidePanelStyles(): void {
		// Check if styles already added
		if (document.getElementById('taskswitch-side-panel-styles')) {
			return;
		}

		// Add custom CSS for side panel styling
		const style = document.createElement('style');
		style.id = 'taskswitch-side-panel-styles';
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
			}
			
			.taskswitch-view .header-icon {
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
		console.log('TaskSwitchView: createSidePanelDashboard called');
		console.log('TaskSwitchView: Container for dashboard:', container);
		
		// Header with plugin branding
		console.log('TaskSwitchView: Creating header...');
		const header = container.createDiv({ cls: 'side-panel-header' });
		console.log('TaskSwitchView: Header created:', header);
		
		// TaskSwitch icon using existing icon library
		const headerIcon = header.createDiv({ cls: 'header-icon' });
		try {
			const iconElement = IconLibrary.createIconElement('gear', 20, 'var(--interactive-accent)');
			console.log('TaskSwitchView: Icon element created:', iconElement);
			if (iconElement.firstChild) {
				headerIcon.appendChild(iconElement.firstChild as Node);
				console.log('TaskSwitchView: Icon added to header');
			} else {
				console.warn('TaskSwitchView: Icon element has no firstChild');
			}
		} catch (error) {
			console.error('TaskSwitchView: Error creating header icon:', error);
		}
		
		const headerTitle = header.createEl('h2', { 
			text: 'TaskSwitch', 
			cls: 'header-title'
		});
		console.log('TaskSwitchView: Header title created:', headerTitle);

		// Roles section (moved to top)
		console.log('TaskSwitchView: Creating roles section...');
		try {
			this.createCompactRolesSection(container);
			console.log('TaskSwitchView: Roles section created');
		} catch (error) {
			console.error('TaskSwitchView: Error creating roles section:', error);
		}

		// Quick actions section  
		console.log('TaskSwitchView: Creating quick actions section...');
		try {
			this.createQuickActionsSection(container);
			console.log('TaskSwitchView: Quick actions section created');
		} catch (error) {
			console.error('TaskSwitchView: Error creating quick actions section:', error);
		}

		// Current status section
		console.log('TaskSwitchView: Creating status section...');
		try {
			this.createCompactStatusSection(container);
			console.log('TaskSwitchView: Status section created');
		} catch (error) {
			console.error('TaskSwitchView: Error creating status section:', error);
		}
		
		console.log('TaskSwitchView: Dashboard creation completed');
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
			console.log('TaskSwitchView: Dashboard button clicked');
			try {
				new RoleDashboardModal(this.app, this.plugin).open();
			} catch (error) {
				console.error('TaskSwitchView: Error opening dashboard:', error);
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
		this.onOpen();
	}

	private createFallbackDashboard(container: HTMLElement): void {
		console.log('TaskSwitchView: Creating fallback dashboard');
		
		// Simple fallback content
		container.createEl('h2', { 
			text: 'TaskSwitch Panel', 
			attr: { style: 'color: var(--text-accent); margin: 20px 0;' }
		});
		
		container.createEl('p', { 
			text: 'Dashboard is loading...', 
			attr: { style: 'color: var(--text-muted); margin: 10px 0;' }
		});
		
		// Show plugin data info
		const infoDiv = container.createDiv({ 
			attr: { style: 'margin: 20px 0; padding: 10px; border: 1px solid var(--background-modifier-border); border-radius: 4px;' }
		});
		
		infoDiv.createEl('p', { text: `Roles count: ${this.plugin.data.roles.length}` });
		infoDiv.createEl('p', { text: `Active role: ${this.plugin.data.state.activeRoleId || 'None'}` });
		infoDiv.createEl('p', { text: `Events count: ${this.plugin.data.events.length}` });
		
		// Test button
		const testBtn = container.createEl('button', { 
			text: 'Test Dashboard',
			attr: { style: 'padding: 8px 16px; margin: 10px 0; background: #007acc; color: white; border: none; border-radius: 4px; cursor: pointer;' }
		});
		testBtn.addEventListener('click', () => {
			console.log('TaskSwitchView: Test button clicked');
			new Notice('Dashboard is working!');
		});
		
		console.log('TaskSwitchView: Fallback dashboard created');
	}
}
