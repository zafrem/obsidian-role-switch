// Modal Components for RoleSwitch Plugin

import { App, Modal, Notice, Platform } from 'obsidian';
import { Role, Note } from '../types';
import { IconLibrary } from '../icons';
import { Utils } from '../utils';
import type RoleSwitchPlugin from '../../main';

// Type guard to check if adapter has basePath property (desktop only)
// Using 'unknown' to avoid referencing DataAdapter which is desktop-only
function hasBasePath(adapter: unknown): adapter is { basePath: string } {
	return typeof adapter === 'object' && adapter !== null && 'basePath' in adapter && typeof (adapter as Record<string, unknown>).basePath === 'string';
}

export class TransitionModal extends Modal {
	private plugin: RoleSwitchPlugin;
	private targetRole: Role;
	private countdownInterval: number | null = null;
	private remainingSeconds: number;

	private static readonly TRANSITION_MESSAGES = [
		"Studies show that it takes an average of 20-25 minutes to re-enter a state of deep flow when switching to a completely different task.",
		"If you intentionally create a 'switch buffer,' your brain will recognize that 'you're in a different mode,' making it easier to shift your mindset.",
		"Taking a moment to pause between roles helps you mentally close the previous task and prepare for the next one with full attention.",
		"This transition time allows your mind to let go of the previous context and embrace the new role without carrying over distractions.",
		"Brief pauses between different types of work reduce cognitive load and help maintain higher quality focus in each role."
	];

	constructor(app: App, plugin: RoleSwitchPlugin, targetRole: Role) {
		super(app);
		this.plugin = plugin;
		this.targetRole = targetRole;
		this.remainingSeconds = plugin.data.settings.transitionSeconds;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('transition-modal');

		// Make modal mobile-friendly
		if (Platform.isMobile) {
			contentEl.addClass('mobile');
		}

		const titleEl = contentEl.createEl('div', {
			text: `Switching to: ${this.targetRole.name}`,
			cls: 'transition-title role-color-text'
		});
		titleEl.setCssProps({ '--role-color': this.targetRole.colorHex });

		const countdownEl = contentEl.createEl('div', {
			text: `${this.remainingSeconds}s`,
			cls: 'transition-countdown'
		});

		// Add random transition message
		const randomMessage = TransitionModal.TRANSITION_MESSAGES[
			Math.floor(Math.random() * TransitionModal.TRANSITION_MESSAGES.length)
		];
		contentEl.createEl('div', {
			text: randomMessage,
			cls: 'transition-message'
		});

		const buttonContainer = contentEl.createDiv({ cls: 'transition-buttons' });
		
		const cancelBtn = buttonContainer.createEl('button', { 
			text: 'Cancel'
		});
		if (Platform.isMobile) {
			cancelBtn.addClass('mobile');
		}
		
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
				id: Utils.generateId(),
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

export class RolePickerModal extends Modal {
	private plugin: RoleSwitchPlugin;
	private mode: 'start' | 'switch';

	constructor(app: App, plugin: RoleSwitchPlugin, mode: 'start' | 'switch' = 'start') {
		super(app);
		this.plugin = plugin;
		this.mode = mode;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		// Mobile responsive styling
		if (Platform.isMobile) {
			contentEl.addClass('role-picker-modal');
		}

		const title = this.mode === 'start' ? 'Start Role' : 'Switch Role';
		contentEl.createEl('h2', { text: title });

		if (this.plugin.data.roles.length === 0) {
			contentEl.createDiv({
				text: 'No roles created yet. Create roles in settings first.',
				cls: 'modal-no-content'
			});
			return;
		}

		const rolesGrid = contentEl.createDiv({
			cls: `role-picker-grid ${Platform.isMobile ? 'mobile' : ''}`
		});

		this.plugin.data.roles.forEach(role => {
			this.createRoleCard(rolesGrid, role);
		});
	}

	private createRoleCard(container: HTMLElement, role: Role): void {
		const isActive = this.plugin.data.state.activeRoleId === role.id;

		const card = container.createDiv({
			cls: `role-card-picker ${isActive ? 'active role-color-border' : ''}`
		});

		if (isActive) {
			card.setCssProps({ '--role-color': role.colorHex });
		}

		// Hover effect
		card.addEventListener('mouseenter', () => {
			if (!isActive) {
				card.addClass('role-color-border');
				card.setCssProps({ '--role-color': role.colorHex });
			}
		});

		card.addEventListener('mouseleave', () => {
			if (!isActive) {
				card.removeClass('role-color-border');
			}
		});

		// Role icon/color
		const iconContainer = card.createDiv({
			cls: 'role-icon-picker role-color-bg'
		});
		iconContainer.setCssProps({ '--role-color': role.colorHex });

		if (role.icon && IconLibrary.ICONS[role.icon]) {
			const iconElement = IconLibrary.createIconElement(role.icon, 20, 'white');
			iconContainer.appendChild(iconElement);
		}

		// Role name
		const nameEl = card.createEl('h3', {
			text: role.name,
			cls: `role-name-picker ${isActive ? 'active role-color-text' : ''}`
		});

		if (isActive) {
			nameEl.setCssProps({ '--role-color': role.colorHex });
		}

		// Role description
		if (role.description) {
			card.createDiv({
				text: role.description,
				cls: 'role-description-picker'
			});
		}

		// Status indicator
		if (isActive) {
			const statusEl = card.createDiv({
				text: '● Active',
				cls: 'role-status-active role-color-text'
			});
			statusEl.setCssProps({ '--role-color': role.colorHex });
		}

		// Click handler
		card.addEventListener('click', (event) => {
			event.stopPropagation();

			if (isActive && this.mode === 'switch') {
				new Notice('Already in this role');
				return;
			}

			if (this.mode === 'start') {
				this.plugin.startSession(role.id);
			} else {
				this.plugin.switchSession(role.id);
			}

			// Defer close to next tick to allow events to complete
			setTimeout(() => this.close(), 0);
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

export class NoteEditModal extends Modal {
	private plugin: RoleSwitchPlugin;
	private sessionId: string;
	private note: Note | null;
	private textArea!: HTMLTextAreaElement;

	constructor(app: App, plugin: RoleSwitchPlugin, sessionId: string, note: Note | null = null) {
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

		this.textArea = contentEl.createEl('textarea', {
			cls: 'note-edit-textarea'
		});
		
		if (this.note) {
			this.textArea.value = this.note.text;
		}

		const buttonContainer = contentEl.createDiv({
			cls: 'note-edit-buttons'
		});

		const saveBtn = buttonContainer.createEl('button', {
			text: 'Save',
			cls: 'note-edit-save'
		});
		saveBtn.addEventListener('click', () => this.save());

		// Delete button for existing notes
		if (this.note) {
			const deleteBtn = buttonContainer.createEl('button', {
				text: 'Delete',
				cls: 'note-edit-delete'
			});
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
			this.close();
		} catch (error) {
			new Notice('Failed to save note');
		}
	}

	private delete(): void {
		if (!this.note) return;

		try {
			this.plugin.deleteNote(this.note.id);
			new Notice('Note deleted');
			this.close();
		} catch (error) {
			new Notice('Failed to delete note');
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

export class RoleDashboardModal extends Modal {
	private plugin: RoleSwitchPlugin;
	private timerInterval: number | null = null;
	private durationEl: HTMLElement | null = null;
	private lockEl: HTMLElement | null = null;

	constructor(app: App, plugin: RoleSwitchPlugin) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		// Mobile responsive styling
		contentEl.addClass('dashboard-modal');
		if (Platform.isMobile) {
			contentEl.addClass('mobile');
		}

		// Dashboard header with logo
		const headerContainer = contentEl.createDiv({ cls: 'dashboard-header' });

		// Try to load logo, but don't fail if it doesn't work
		// Logo loading is desktop-only to avoid FileSystemAdapter issues on mobile
		if (!Platform.isMobile) {
			try {
				const adapter = this.app.vault.adapter;
				// Use type guard to safely check if adapter has basePath
				if (hasBasePath(adapter)) {
					const configDir = this.app.vault.configDir;
					const pluginDir = `${adapter.basePath}/${configDir}/plugins/obsidian-role-switch`;
					const logo = headerContainer.createEl('img', {
						attr: {
							src: `app://local/${pluginDir}/image/logo.png`,
							alt: 'RoleSwitch Logo'
						},
						cls: 'dashboard-logo size-32'
					});

					// Fallback if image fails to load
					logo.addEventListener('error', () => {
						logo.remove();
					});
				}
			} catch (error) {
				// Logo loading failed, continue without logo
			}
		}

		headerContainer.createEl('h2', { text: 'Role Dashboard', cls: 'dashboard-header-title' });

		// Analytics section
		this.createAnalyticsSection(contentEl);

		// Current status section
		this.createCurrentStatusSection(contentEl);

		// Start real-time timer if there's an active session
		this.startRealtimeTimer();
	}

	private createAnalyticsSection(contentEl: HTMLElement): void {
		const section = contentEl.createDiv({
			cls: 'analytics-section-dashboard'
		});

		section.createEl('h3', {
			text: '📊 Analytics',
			cls: 'analytics-section-title'
		});

		// Get analytics data
		const today = Utils.getStartOfDay();
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
		const weekStart = Utils.getStartOfWeek();
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
		const monthStart = Utils.getStartOfMonth();
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
			cls: `analytics-grid-dashboard ${Platform.isMobile ? 'mobile' : ''}`
		});

		// Today's stats
		const todayCard = grid.createDiv({
			cls: 'analytics-card-dashboard'
		});
		todayCard.createEl('h4', {
			text: 'Today',
			cls: 'analytics-card-title'
		});
		todayCard.createEl('div', {
			text: `${Math.round(totalTodayMinutes)}min total`,
			cls: 'analytics-stat-text'
		});
		todayCard.createEl('div', {
			text: `${switchCount} switches`,
			cls: 'analytics-stat-text-muted'
		});

		// Averages card
		const avgCard = grid.createDiv({
			cls: 'analytics-card-dashboard'
		});
		avgCard.createEl('h4', {
			text: 'Averages',
			cls: 'analytics-card-title'
		});
		avgCard.createEl('div', {
			text: `${Math.round(avgDailyMinutes)}min/day (week)`,
			cls: 'analytics-stat-text'
		});
		avgCard.createEl('div', {
			text: `${Math.round(avgMonthlyDailyMinutes)}min/day (month)`,
			cls: 'analytics-stat-text-muted'
		});

		// Week and month totals
		const totalsCard = grid.createDiv({
			cls: `analytics-card-dashboard analytics-card-totals ${Platform.isMobile ? 'mobile' : ''}`
		});
		totalsCard.createEl('h4', {
			text: 'Totals',
			cls: 'analytics-card-title'
		});

		const totalsGrid = totalsCard.createDiv({
			cls: 'analytics-totals-grid'
		});

		totalsGrid.createEl('div', {
			text: `Week: ${Math.round(totalWeekMinutes)}min`,
			cls: 'analytics-totals-text'
		});
		totalsGrid.createEl('div', {
			text: `Month: ${Math.round(totalMonthMinutes)}min`,
			cls: 'analytics-totals-text'
		});
	}

	private createCurrentStatusSection(container: HTMLElement): void {
		const statusSection = container.createDiv({
			cls: 'current-status-dashboard'
		});

		statusSection.createEl('h3', { text: 'Current Session', cls: 'session-header-title' });

		if (this.plugin.data.state.activeRoleId) {
			const activeRole = this.plugin.data.roles.find(r => r.id === this.plugin.data.state.activeRoleId);
			if (activeRole) {
				const activeInfo = statusSection.createDiv({
					cls: 'active-info'
				});

				// Active role color dot with icon
				const activeRoleDot = activeInfo.createDiv({
					cls: 'active-role-dot role-color-bg'
				});
				activeRoleDot.setCssProps({ '--role-color': activeRole.colorHex });

				// Add icon if available
				if (activeRole.icon && IconLibrary.ICONS[activeRole.icon]) {
					const iconElement = IconLibrary.createIconElement(activeRole.icon, 12, 'white');
					iconElement.addClass('icon-filter-shadow');
					activeRoleDot.appendChild(iconElement);
				}

				// Role name and duration
				const roleInfo = activeInfo.createDiv();
				roleInfo.createEl('strong', {
					text: `Active: ${activeRole.name}`,
					cls: 'active-role-name'
				});

				// Create real-time session duration
				if (this.plugin.data.state.activeStartAt) {
					this.durationEl = roleInfo.createEl('div', {
						text: 'Duration: 0s',
						cls: 'active-duration'
					});
					this.updateDurationDisplay();
				}

				// Lock status
				if (this.plugin.isSessionLocked()) {
					const remaining = this.plugin.getRemainingLockTime();
					this.lockEl = statusSection.createDiv({
						text: `🔒 Session locked for ${remaining} more seconds`,
						cls: 'session-locked-warning'
					});
				}
			}
		} else {
			statusSection.createDiv({
				text: '⏸️ No active session',
				cls: 'no-session-notice'
			});
		}

		// Session history for today
		this.createTodayHistorySection(statusSection);
	}

	private createTodayHistorySection(container: HTMLElement): void {
		const today = Utils.getStartOfDay();
		const todaySessions = this.plugin.getDerivedSessions(today, new Date());

		if (todaySessions.length > 0) {
			container.createEl('h4', {
				text: "Today's History",
				cls: 'history-section-title'
			});

			const historyContainer = container.createDiv({
				cls: 'history-container'
			});

			todaySessions.forEach(session => {
				const role = this.plugin.data.roles.find(r => r.id === session.roleId);
				if (role) {
					const sessionEl = historyContainer.createDiv({
						cls: 'history-session-item'
					});

					// Role indicator
					const indicator = sessionEl.createDiv({
						cls: 'history-role-indicator role-color-bg'
					});
					indicator.setCssProps({ '--role-color': role.colorHex });

					// Session info
					const sessionInfo = sessionEl.createDiv();
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
						cls: 'history-session-details'
					});
				}
			});
		}
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
				this.updateLockDisplay();
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

	private updateLockDisplay(): void {
		if (!this.lockEl) return;

		if (this.plugin.isSessionLocked()) {
			const remaining = this.plugin.getRemainingLockTime();
			this.lockEl.setText(`🔒 Session locked for ${remaining} more seconds`);
		} else {
			// Session is no longer locked, remove the element
			this.lockEl.remove();
			this.lockEl = null;
		}
	}

	onClose() {
		if (this.timerInterval) {
			clearInterval(this.timerInterval);
		}
		const { contentEl } = this;
		contentEl.empty();
	}
}

export class IconPickerModal extends Modal {
	private onSelectIcon: (iconKey: string) => void;
	private selectedIcon: string | null = null;
	private updateButtonState: ((enabled: boolean) => void) | null = null;

	constructor(app: App, onSelectIcon: (iconKey: string) => void, currentIcon?: string) {
		super(app);
		this.onSelectIcon = onSelectIcon;
		this.selectedIcon = currentIcon || null;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl('h2', { text: 'Select Icon' });

		// Container for all icons with better structure
		const iconsContainer = contentEl.createDiv({
			cls: 'icon-picker-container'
		});

		// Create a simple grid with all icons first
		const allIconsGrid = iconsContainer.createDiv({
			cls: 'icon-grid'
		});

		// Get all available icons
		const allIcons = IconLibrary.getAllIcons();

		if (allIcons.length === 0) {
			iconsContainer.createDiv({
				text: 'No icons available',
				cls: 'no-icons-available'
			});
		} else {
			// Add all icons to the grid
			allIcons.forEach((iconKey) => {
				this.createIconButton(allIconsGrid, iconKey);
			});
		}

		// Selected icon display
		this.updateSelectedDisplay(contentEl);

		// Action buttons
		const buttonContainer = contentEl.createDiv({
			cls: 'icon-picker-buttons'
		});

		const selectBtn = buttonContainer.createEl('button', { text: 'Select' });
		selectBtn.disabled = !this.selectedIcon;
		selectBtn.addEventListener('click', () => {
			if (this.selectedIcon) {
				this.onSelectIcon(this.selectedIcon);
				this.close();
			}
		});

		const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });
		cancelBtn.addEventListener('click', () => this.close());

		// Update button state when selection changes
		this.updateButtonState = (enabled: boolean) => {
			selectBtn.disabled = !enabled;
		};
	}

	private createIconButton(container: HTMLElement, iconKey: string): void {
		const isSelected = this.selectedIcon === iconKey;

		const iconBtn = container.createDiv({
			cls: `icon-button ${isSelected ? 'selected' : ''}`,
			attr: {
				'data-icon-key': iconKey,
				title: iconKey
			}
		});

		const iconEl = iconBtn.createDiv({
			cls: `icon-element ${isSelected ? 'selected' : ''}`
		});
		
		try {
			const iconElement = IconLibrary.createIconElement(iconKey, 20, isSelected ? '#007acc' : '#666');
			iconEl.appendChild(iconElement);
		} catch (error) {
			// Fallback text if icon creation fails
			iconEl.textContent = iconKey.charAt(0).toUpperCase();
		}

		iconBtn.addEventListener('click', () => {
			this.selectedIcon = iconKey;
			if (iconBtn.parentElement instanceof HTMLElement) {
				this.updateIconGrid(iconBtn.parentElement);
			}
			this.updateSelectedDisplay(this.contentEl);
			if (this.updateButtonState) {
				this.updateButtonState(true);
			}
		});
	}

	private updateIconGrid(categoryGrid: HTMLElement): void {
		// Find the icons container (parent of all category grids)
		const iconsContainer = categoryGrid.parentElement;
		if (!iconsContainer) return;

		// Update all icon buttons in all category grids
		const allCategoryGrids = iconsContainer.querySelectorAll('div[style*="display: grid"]');
		allCategoryGrids.forEach(grid => {
			const iconButtons = grid.children;
			for (let i = 0; i < iconButtons.length; i++) {
				const btn = iconButtons[i];
				if (!(btn instanceof HTMLElement)) continue;

				const iconKey = btn.getAttribute('data-icon-key');
				const isSelected = iconKey === this.selectedIcon;

				if (isSelected) {
					btn.addClass('selected');
				} else {
					btn.removeClass('selected');
				}

				// Update the icon color by recreating the icon element
				const iconEl = btn.querySelector('.icon-element');
				if (iconEl instanceof HTMLElement && iconKey) {
					iconEl.empty();
					try {
						const iconElement = IconLibrary.createIconElement(iconKey, 20, isSelected ? '#007acc' : '#666');
						iconEl.appendChild(iconElement);
					} catch (error) {
						iconEl.textContent = iconKey.charAt(0).toUpperCase();
					}
				}
			}
		});
	}

	private updateSelectedDisplay(container: HTMLElement): void {
		// Don't show selected icon display below the grid
		// Selection is indicated by color change in the grid itself
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}