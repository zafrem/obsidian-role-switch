// Modal Components for TaskSwitch Plugin

import { App, Modal, Notice, Platform } from 'obsidian';
import { Role, Note } from '../types';
import { IconLibrary } from '../icons';
import { Utils } from '../utils';
import type TaskSwitchPlugin from '../../main';

export class TransitionModal extends Modal {
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
		contentEl.addClass('transition-modal');
		
		// Make modal mobile-friendly
		if (Platform.isMobile) {
			contentEl.style.padding = '20px';
			contentEl.style.maxWidth = '90vw';
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
			cancelBtn.style.padding = '12px';
			cancelBtn.style.fontSize = '16px';
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
	private plugin: TaskSwitchPlugin;
	private mode: 'start' | 'switch';

	constructor(app: App, plugin: TaskSwitchPlugin, mode: 'start' | 'switch' = 'start') {
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
			contentEl.createDiv({
				text: 'No roles created yet. Create roles in settings first.',
				attr: { style: 'text-align: center; color: var(--text-muted); font-style: italic; padding: 20px;' }
			});
			return;
		}

		const rolesGrid = contentEl.createDiv({
			attr: {
				style: `
					display: grid;
					grid-template-columns: repeat(auto-fill, minmax(${Platform.isMobile ? '120px' : '160px'}, 1fr));
					gap: 12px;
					margin-top: 20px;
				`
			}
		});

		this.plugin.data.roles.forEach(role => {
			this.createRoleCard(rolesGrid, role);
		});
	}

	private createRoleCard(container: HTMLElement, role: Role): void {
		const isActive = this.plugin.data.state.activeRoleId === role.id;

		const card = container.createDiv({
			attr: {
				style: `
					border: 2px solid ${isActive ? role.colorHex : 'var(--background-modifier-border)'};
					border-radius: 8px;
					padding: 16px;
					cursor: pointer;
					text-align: center;
					transition: all 0.2s ease;
					background: var(--background-primary);
				`
			}
		});

		// Hover effect
		card.addEventListener('mouseenter', () => {
			if (!isActive) {
				card.style.borderColor = role.colorHex;
			}
			card.style.transform = 'translateY(-2px)';
			card.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
		});

		card.addEventListener('mouseleave', () => {
			if (!isActive) {
				card.style.borderColor = 'var(--background-modifier-border)';
			}
			card.style.transform = 'none';
			card.style.boxShadow = 'none';
		});

		// Role icon/color
		const iconContainer = card.createDiv({
			attr: {
				style: `
					width: 40px;
					height: 40px;
					border-radius: 50%;
					background-color: ${role.colorHex};
					margin: 0 auto 12px;
					display: flex;
					align-items: center;
					justify-content: center;
				`
			}
		});

		if (role.icon && IconLibrary.ICONS[role.icon]) {
			const iconElement = IconLibrary.createIconElement(role.icon, 20, 'white');
			iconContainer.appendChild(iconElement);
		}

		// Role name
		card.createEl('h3', {
			text: role.name,
			attr: { style: `margin: 0 0 8px 0; color: ${isActive ? role.colorHex : 'var(--text-normal)'}; font-size: 14px;` }
		});

		// Role description
		if (role.description) {
			card.createDiv({
				text: role.description,
				attr: { style: 'color: var(--text-muted); font-size: 12px; margin-bottom: 8px;' }
			});
		}

		// Status indicator
		if (isActive) {
			card.createDiv({
				text: '● Active',
				attr: { style: `color: ${role.colorHex}; font-size: 12px; font-weight: 500;` }
			});
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
	private plugin: TaskSwitchPlugin;
	private sessionId: string;
	private note: Note | null;
	private textArea: HTMLTextAreaElement;

	constructor(app: App, plugin: TaskSwitchPlugin, sessionId: string, note: Note | null = null) {
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

		this.textArea = contentEl.createEl('textarea');
		this.textArea.style.width = '100%';
		this.textArea.style.minHeight = '100px';
		this.textArea.style.marginBottom = '16px';
		this.textArea.style.resize = 'vertical';
		
		if (this.note) {
			this.textArea.value = this.note.text;
		}

		const buttonContainer = contentEl.createDiv();
		buttonContainer.style.textAlign = 'right';

		const saveBtn = buttonContainer.createEl('button', { text: 'Save' });
		saveBtn.style.marginRight = '8px';
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
			contentEl.style.padding = '15px';
			contentEl.style.maxHeight = '90vh';
			contentEl.style.overflowY = 'auto';
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
			attr: {
				style: `
					padding: 12px;
					border-radius: 6px;
					background: var(--background-primary);
					border: 1px solid var(--background-modifier-border);
				`
			}
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
		totalsCard.createEl('h4', {
			text: 'Totals',
			attr: { style: 'margin: 0 0 8px 0; font-size: 14px; color: var(--text-accent);' }
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
			attr: {
				style: 'background: var(--background-secondary); border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid var(--interactive-accent);'
			}
		});

		statusSection.createEl('h3', { text: 'Current Session', attr: { style: 'margin-top: 0; color: var(--interactive-accent);' } });

		if (this.plugin.data.state.activeRoleId) {
			const activeRole = this.plugin.data.roles.find(r => r.id === this.plugin.data.state.activeRoleId);
			if (activeRole) {
				const activeInfo = statusSection.createDiv({
					attr: { style: 'display: flex; align-items: center; margin-bottom: 10px;' }
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
					const iconElement = IconLibrary.createIconElement(activeRole.icon, 12, 'white');
					iconElement.style.filter = 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))';
					activeRoleDot.appendChild(iconElement);
				}

				// Role name and duration
				const roleInfo = activeInfo.createDiv();
				roleInfo.createEl('strong', {
					text: `Active: ${activeRole.name}`,
					attr: { style: 'font-size: 18px; color: var(--text-normal);' }
				});

				// Create real-time session duration
				if (this.plugin.data.state.activeStartAt) {
					this.durationEl = roleInfo.createEl('div', {
						text: 'Duration: 0s',
						attr: { style: 'color: var(--text-muted); margin-top: 4px;' }
					});
					this.updateDurationDisplay();
				}

				// Lock status
				if (this.plugin.isSessionLocked()) {
					const remaining = this.plugin.getRemainingLockTime();
					statusSection.createDiv({
						text: `🔒 Session locked for ${remaining} more seconds`,
						attr: { style: 'color: var(--text-warning); margin-top: 8px; font-style: italic;' }
					});
				}
			}
		} else {
			statusSection.createDiv({
				text: '⏸️ No active session',
				attr: { style: 'color: var(--text-muted); font-style: italic;' }
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
				attr: { style: 'max-height: 200px; overflow-y: auto;' }
			});

			todaySessions.forEach(session => {
				const role = this.plugin.data.roles.find(r => r.id === session.roleId);
				if (role) {
					const sessionEl = historyContainer.createDiv({
						attr: { style: 'display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--background-modifier-border);' }
					});

					// Role indicator
					const indicator = sessionEl.createDiv({
						attr: {
							style: `
								width: 12px;
								height: 12px;
								border-radius: 50%;
								background-color: ${role.colorHex};
								margin-right: 8px;
							`
						}
					});

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
						attr: { style: 'font-size: 13px;' }
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
			attr: {
				style: `
					max-height: 400px;
					overflow-y: auto;
					margin: 20px 0;
					padding: 8px;
					border: 1px solid var(--background-modifier-border);
					border-radius: 4px;
				`
			}
		});

		// Create a simple grid with all icons first
		const allIconsGrid = iconsContainer.createDiv({
			attr: {
				style: `
					display: grid;
					grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
					gap: 8px;
					margin-bottom: 16px;
				`
			}
		});

		// Get all available icons
		const allIcons = IconLibrary.getAllIcons();
		console.log('IconPickerModal: Available icons:', allIcons.length, allIcons); // Debug log

		if (allIcons.length === 0) {
			console.error('IconPickerModal: No icons found!');
			iconsContainer.createDiv({
				text: 'No icons available',
				attr: { style: 'text-align: center; color: var(--text-error); padding: 20px;' }
			});
		} else {
			console.log('IconPickerModal: Creating', allIcons.length, 'icon buttons');
			// Add all icons to the grid
			allIcons.forEach((iconKey, index) => {
				console.log('IconPickerModal: Creating button', index + 1, 'of', allIcons.length, 'for icon:', iconKey);
				this.createIconButton(allIconsGrid, iconKey);
			});
		}

		// Selected icon display
		this.updateSelectedDisplay(contentEl);

		// Action buttons
		const buttonContainer = contentEl.createDiv({
			attr: { style: 'text-align: right; margin-top: 20px; gap: 8px; display: flex; justify-content: flex-end;' }
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
		console.log('Creating icon button for:', iconKey); // Debug log
		const isSelected = this.selectedIcon === iconKey;

		const iconBtn = container.createDiv({
			attr: {
				'data-icon-key': iconKey,
				title: iconKey, // Add tooltip
				style: `
					width: 40px;
					height: 40px;
					border: 2px solid ${isSelected ? '#007acc' : 'var(--background-modifier-border)'};
					border-radius: 4px;
					display: flex;
					align-items: center;
					justify-content: center;
					cursor: pointer;
					transition: all 0.2s ease;
					background: ${isSelected ? '#007acc20' : 'var(--background-primary)'};
				`
			}
		});

		const iconEl = iconBtn.createDiv({
			attr: {
				style: `
					width: 20px;
					height: 20px;
					display: flex;
					align-items: center;
					justify-content: center;
					color: ${isSelected ? '#007acc' : '#666'};
				`
			}
		});
		
		try {
			const iconElement = IconLibrary.createIconElement(iconKey, 20, isSelected ? '#007acc' : '#666');
			console.log('IconPickerModal: Created icon element for', iconKey, 'innerHTML:', iconElement.innerHTML.substring(0, 100));
			console.log('IconPickerModal: Icon element style:', iconElement.style.cssText);
			iconEl.appendChild(iconElement);
			
			// Additional debug - check if element is actually in DOM
			console.log('IconPickerModal: iconEl after appendChild:', iconEl.innerHTML.substring(0, 100));
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
				
				btn.style.borderColor = isSelected ? '#007acc' : 'var(--background-modifier-border)';
				btn.style.backgroundColor = isSelected ? '#007acc20' : 'var(--background-primary)';
				
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
				cls: 'selected-icon-display',
				attr: {
					style: `
						display: flex;
						align-items: center;
						gap: 8px;
						padding: 12px;
						margin: 16px 0;
						border: 1px solid #007acc;
						border-radius: 4px;
						background: #007acc10;
					`
				}
			});

			const iconDisplay = selectedDisplay.createDiv({
				attr: {
					style: `
						width: 24px;
						height: 24px;
						display: flex;
						align-items: center;
						justify-content: center;
						color: #007acc;
					`
				}
			});
			const iconElement = IconLibrary.createIconElement(this.selectedIcon, 20, '#007acc');
			iconDisplay.appendChild(iconElement);

			selectedDisplay.createSpan({
				text: this.selectedIcon.charAt(0).toUpperCase() + this.selectedIcon.slice(1),
				attr: { style: 'font-weight: 500; color: #007acc;' }
			});
		} else {
			// Show "no icon selected" state
			container.createDiv({
				attr: {
					style: `
						text-align: center;
						color: var(--text-muted);
						font-style: italic;
						padding: 20px;
					`
				},
				text: 'No icon selected'
			});
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}