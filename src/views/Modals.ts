// Modal Components for RoleSwitch Plugin

import { App, Modal, Notice, Platform } from 'obsidian';
import { Role, Note } from '../types';
import { IconLibrary } from '../icons';
import { Utils } from '../utils';
import type RoleSwitchPlugin from '../../main';

export class TransitionModal extends Modal {
	private plugin: RoleSwitchPlugin;
	private targetRole: Role;
	private countdownInterval: number | null = null;
	private remainingSeconds: number;

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
		
		contentEl.createEl('div', { 
			text: `Switching to: ${this.targetRole.name}`,
			cls: 'transition-title'
		}).style.color = this.targetRole.colorHex;

		const countdownEl = contentEl.createEl('div', { 
			text: `${this.remainingSeconds}s`,
			cls: 'transition-countdown'
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
				attr: { style: 'text-align: center; color: var(--text-muted); font-style: italic; padding: 20px;' }
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
			cls: `role-card-picker ${isActive ? 'active' : ''}`
		});

		if (isActive) {
			card.style.borderColor = role.colorHex;
		}

		// Hover effect
		card.addEventListener('mouseenter', () => {
			if (!isActive) {
				card.style.borderColor = role.colorHex;
			}
		});

		card.addEventListener('mouseleave', () => {
			if (!isActive) {
				card.style.borderColor = '';
			}
		});

		// Role icon/color
		const iconContainer = card.createDiv({
			cls: 'role-icon-picker'
		});
		iconContainer.style.backgroundColor = role.colorHex;

		if (role.icon && IconLibrary.ICONS[role.icon]) {
			const iconElement = IconLibrary.createIconElement(role.icon, 20, 'white');
			iconContainer.appendChild(iconElement);
		}

		// Role name
		const nameEl = card.createEl('h3', {
			text: role.name,
			cls: `role-name-picker ${isActive ? 'active' : ''}`
		});

		if (isActive) {
			nameEl.style.color = role.colorHex;
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
				cls: 'role-status-active'
			});
			statusEl.style.color = role.colorHex;
		}

		// Click handler
		card.addEventListener('click', () => {
			if (isActive && this.mode === 'switch') {
				new Notice('Already in this role');
				return;
			}

			if (this.mode === 'start') {
				this.plugin.startSession(role.id);
			} else {
				this.plugin.switchSession(role.id);
			}
			this.close();
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
	private textArea: HTMLTextAreaElement;

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
			console.error('Error saving note:', error);
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
			console.error('Error deleting note:', error);
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

	constructor(app: App, plugin: RoleSwitchPlugin) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		// Mobile responsive styling
		if (Platform.isMobile) {
			contentEl.addClass('dashboard-modal mobile');
		} else {
			contentEl.addClass('dashboard-modal');
		}

		contentEl.createEl('h2', { text: 'Role Dashboard' });

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
			attr: { style: 'margin: 0 0 12px 0; font-size: 16px;' }
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
			attr: { style: 'margin: 0 0 8px 0; font-size: 14px; color: var(--text-accent);' }
		});
		todayCard.createEl('div', {
			text: `${Math.round(totalTodayMinutes)}min total`,
			attr: { style: 'font-size: 13px; margin-bottom: 4px;' }
		});
		todayCard.createEl('div', {
			text: `${switchCount} switches`,
			attr: { style: 'font-size: 13px; color: var(--text-muted);' }
		});

		// Averages card
		const avgCard = grid.createDiv({
			cls: 'analytics-card-dashboard'
		});
		avgCard.createEl('h4', {
			text: 'Averages',
			attr: { style: 'margin: 0 0 8px 0; font-size: 14px; color: var(--text-accent);' }
		});
		avgCard.createEl('div', {
			text: `${Math.round(avgDailyMinutes)}min/day (week)`,
			attr: { style: 'font-size: 13px; margin-bottom: 4px;' }
		});
		avgCard.createEl('div', {
			text: `${Math.round(avgMonthlyDailyMinutes)}min/day (month)`,
			attr: { style: 'font-size: 13px; color: var(--text-muted);' }
		});

		// Week and month totals
		const totalsCard = grid.createDiv({
			cls: `analytics-card-dashboard analytics-card-totals ${Platform.isMobile ? 'mobile' : ''}`
		});
		totalsCard.createEl('h4', {
			text: 'Totals',
			attr: { style: 'margin: 0 0 8px 0; font-size: 14px; color: var(--text-accent);' }
		});

		const totalsGrid = totalsCard.createDiv({
			cls: 'analytics-totals-grid'
		});

		totalsGrid.createEl('div', {
			text: `Week: ${Math.round(totalWeekMinutes)}min`,
			attr: { style: 'font-size: 13px;' }
		});
		totalsGrid.createEl('div', {
			text: `Month: ${Math.round(totalMonthMinutes)}min`,
			attr: { style: 'font-size: 13px;' }
		});
	}

	private createCurrentStatusSection(container: HTMLElement): void {
		const statusSection = container.createDiv({
			cls: 'current-status-dashboard'
		});

		statusSection.createEl('h3', { text: 'Current Session', attr: { style: 'margin-top: 0; color: var(--interactive-accent);' } });

		if (this.plugin.data.state.activeRoleId) {
			const activeRole = this.plugin.data.roles.find(r => r.id === this.plugin.data.state.activeRoleId);
			if (activeRole) {
				const activeInfo = statusSection.createDiv({
					cls: 'active-info'
				});

				// Active role color dot with icon
				const activeRoleDot = activeInfo.createDiv({
					cls: 'active-role-dot'
				});
				activeRoleDot.style.backgroundColor = activeRole.colorHex;

				// Add icon if available
				if (activeRole.icon && IconLibrary.ICONS[activeRole.icon]) {
					const iconElement = IconLibrary.createIconElement(activeRole.icon, 12, 'white');
					iconElement.style.filter = 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))';
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
					statusSection.createDiv({
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
				attr: { style: 'margin: 20px 0 10px 0; color: var(--text-accent);' }
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
						cls: 'history-role-indicator'
					});
					indicator.style.backgroundColor = role.colorHex;

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
			console.error('IconPickerModal: Error creating icon for', iconKey, error);
			// Fallback text if icon creation fails
			iconEl.textContent = iconKey.charAt(0).toUpperCase();
		}

		iconBtn.addEventListener('click', () => {
			this.selectedIcon = iconKey;
			this.updateIconGrid(iconBtn.parentElement as HTMLElement);
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
				const btn = iconButtons[i] as HTMLElement;
				const iconKey = btn.getAttribute('data-icon-key');
				const isSelected = iconKey === this.selectedIcon;

				if (isSelected) {
					btn.addClass('selected');
				} else {
					btn.removeClass('selected');
				}

				// Update icon color by finding the SVG element
				const svgElement = btn.querySelector('svg');
				if (svgElement) {
					svgElement.setAttribute('fill', isSelected ? '#007acc' : '#666');
				}
			}
		});
	}

	private updateSelectedDisplay(container: HTMLElement): void {
		// Remove existing selected display
		const existing = container.querySelector('.selected-icon-display');
		if (existing) existing.remove();

		if (this.selectedIcon) {
			const selectedDisplay = container.createDiv({
				cls: 'selected-icon-display'
			});

			const iconDisplay = selectedDisplay.createDiv({
				cls: 'selected-icon-container'
			});
			const iconElement = IconLibrary.createIconElement(this.selectedIcon, 20, '#007acc');
			iconDisplay.appendChild(iconElement);

			selectedDisplay.createSpan({
				text: this.selectedIcon.charAt(0).toUpperCase() + this.selectedIcon.slice(1),
				cls: 'selected-icon-name'
			});
		} else {
			// Show "no icon selected" state
			container.createDiv({
				cls: 'no-icon-selected',
				text: 'No icon selected'
			});
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}