// Settings Tab Component

import { App, PluginSettingTab, Setting, Notice, Modal } from 'obsidian';
import { Role, DEFAULT_SETTINGS } from '../types';
import { IconLibrary } from '../icons';
import { Utils } from '../utils';
import { IconPickerModal } from '../views/Modals';
import type TaskSwitchPlugin from '../../main';

export class TaskSwitchSettingsTab extends PluginSettingTab {
	plugin: TaskSwitchPlugin;

	constructor(app: App, plugin: TaskSwitchPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h1', { text: 'TaskSwitch Settings' });

		// Role Management Section (Top Priority)
		this.createRoleManagementSection(containerEl);
		
		// Session Settings Section
		this.createSessionSettingsSection(containerEl);
		
		// Display Settings Section
		this.createDisplaySettingsSection(containerEl);
	}

	private createRoleManagementSection(containerEl: HTMLElement): void {
		containerEl.createEl('h2', { text: 'Role Management' });

		// Add role button
		new Setting(containerEl)
			.setName('Add new role')
			.setDesc('Create a new role for task switching')
			.addButton(button => {
				button.setButtonText('Add Role')
					.setCta()
					.onClick(() => {
						this.showRoleEditModal();
					});
			});

		// List existing roles
		this.createRolesList(containerEl);
	}

	private createRolesList(containerEl: HTMLElement): void {
		const rolesContainer = containerEl.createDiv({ cls: 'roles-list-container' });
		
		if (this.plugin.data.roles.length === 0) {
			rolesContainer.createDiv({
				text: 'No roles created yet. Add your first role above.',
				cls: 'no-roles-message'
			});
			return;
		}

		this.plugin.data.roles.forEach(role => {
			this.createRoleSetting(rolesContainer, role);
		});
	}

	private createRoleSetting(container: HTMLElement, role: Role): void {
		const roleSetting = new Setting(container)
			.setName(role.name)
			.setDesc(role.description || 'No description')
			.addButton(button => {
				button.setButtonText('Edit')
					.onClick(() => {
						this.showRoleEditModal(role);
					});
			})
			.addButton(button => {
				button.setButtonText('Delete')
					.setWarning()
					.onClick(async () => {
						if (await this.confirmDelete(role)) {
							this.plugin.deleteRole(role.id);
							this.display(); // Refresh settings
						}
					});
			});

		// Add visual role indicator
		const colorEl = document.createElement('div');
		colorEl.style.width = '20px';
		colorEl.style.height = '20px';
		colorEl.style.borderRadius = '50%';
		colorEl.style.backgroundColor = role.colorHex;
		colorEl.style.marginRight = '8px';
		colorEl.style.display = 'inline-flex';
		colorEl.style.alignItems = 'center';
		colorEl.style.justifyContent = 'center';
		colorEl.style.flexShrink = '0';

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
	}

	private createSessionSettingsSection(containerEl: HTMLElement): void {
		containerEl.createEl('h2', { text: 'Session Settings' });

		new Setting(containerEl)
			.setName('Transition duration')
			.setDesc('Time to wait before switching roles (seconds)')
			.addSlider(slider => {
				slider.setLimits(30, 600, 30)
					.setValue(this.plugin.data.settings.transitionSeconds)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.data.settings.transitionSeconds = value;
						await this.plugin.savePluginData();
					});
			});

		new Setting(containerEl)
			.setName('Minimum session duration')
			.setDesc('Minimum time before allowing role switches (seconds)')
			.addSlider(slider => {
				slider.setLimits(300, 3600, 300)
					.setValue(this.plugin.data.settings.minSessionSeconds)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.data.settings.minSessionSeconds = value;
						await this.plugin.savePluginData();
					});
			});
	}

	private createDisplaySettingsSection(containerEl: HTMLElement): void {
		containerEl.createEl('h2', { text: 'Display Settings' });

		new Setting(containerEl)
			.setName('Show status bar')
			.setDesc('Display current role in the status bar')
			.addToggle(toggle => {
				toggle.setValue(this.plugin.data.settings.showStatusBar)
					.onChange(async (value) => {
						this.plugin.data.settings.showStatusBar = value;
						await this.plugin.savePluginData();
						this.plugin.updateStatusBar();
					});
			});

		new Setting(containerEl)
			.setName('Show workspace border')
			.setDesc('Add colored border around workspace (desktop only)')
			.addToggle(toggle => {
				toggle.setValue(this.plugin.data.settings.showWorkspaceBorder)
					.onChange(async (value) => {
						this.plugin.data.settings.showWorkspaceBorder = value;
						await this.plugin.savePluginData();
						this.plugin.updateWorkspaceBorder();
					});
			});

		new Setting(containerEl)
			.setName('Border opacity')
			.setDesc('Opacity of the workspace border')
			.addSlider(slider => {
				slider.setLimits(0.1, 1.0, 0.1)
					.setValue(this.plugin.data.settings.borderOpacity)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.data.settings.borderOpacity = value;
						await this.plugin.savePluginData();
						this.plugin.updateWorkspaceBorder();
					});
			});

		// Reset settings button
		new Setting(containerEl)
			.setName('Reset settings')
			.setDesc('Reset all settings to default values')
			.addButton(button => {
				button.setButtonText('Reset to Defaults')
					.setWarning()
					.onClick(async () => {
						if (await this.confirmReset()) {
							this.plugin.data.settings = { ...DEFAULT_SETTINGS };
							await this.plugin.savePluginData();
							this.display(); // Refresh settings
							new Notice('Settings reset to defaults');
						}
					});
			});
	}

	private showRoleEditModal(role?: Role): void {
		console.log('TaskSwitchSettingsTab: showRoleEditModal called with role:', role);
		const modal = new RoleEditModal(this.app, this.plugin, role);
		
		// Store the original onClose and add our refresh logic
		const originalOnClose = modal.onClose.bind(modal);
		modal.onClose = () => {
			console.log('TaskSwitchSettingsTab: Modal closing, refreshing settings');
			originalOnClose();
			this.display(); // Refresh settings when modal closes
		};
		
		console.log('TaskSwitchSettingsTab: Opening modal');
		modal.open();
	}

	private async confirmDelete(role: Role): Promise<boolean> {
		return new Promise((resolve) => {
			const modal = new ConfirmModal(
				this.app,
				'Delete Role',
				`Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`,
				'Delete',
				true
			);
			modal.onConfirm = (confirmed: boolean) => resolve(confirmed);
			modal.open();
		});
	}

	private async confirmReset(): Promise<boolean> {
		return new Promise((resolve) => {
			const modal = new ConfirmModal(
				this.app,
				'Reset Settings',
				'Are you sure you want to reset all settings to defaults? This action cannot be undone.',
				'Reset',
				true
			);
			modal.onConfirm = (confirmed: boolean) => resolve(confirmed);
			modal.open();
		});
	}
}

class RoleEditModal extends Modal {
	private plugin: TaskSwitchPlugin;
	private role: Role | null;
	private nameInput: HTMLInputElement;
	private descriptionInput: HTMLTextAreaElement;
	private colorInput: HTMLInputElement;
	private selectedIcon: string | null = null;

	constructor(app: App, plugin: TaskSwitchPlugin, role?: Role) {
		super(app);
		this.plugin = plugin;
		this.role = role || null;
		this.selectedIcon = role?.icon || null;
	}

	onOpen() {
		console.log('RoleEditModal: onOpen called', { role: this.role, selectedIcon: this.selectedIcon });
		
		const { contentEl } = this;
		contentEl.empty();

		const title = this.role ? 'Edit Role' : 'Create New Role';
		console.log('RoleEditModal: Creating modal with title:', title);
		contentEl.createEl('h2', { text: title });

		// Name input
		new Setting(contentEl)
			.setName('Role name')
			.setDesc('A descriptive name for this role')
			.addText(text => {
				this.nameInput = text.inputEl;
				console.log('RoleEditModal: Name input assigned:', !!this.nameInput);
				text.setValue(this.role?.name || '')
					.setPlaceholder('e.g., Deep Work, Meetings, Learning');
			});

		// Description input
		new Setting(contentEl)
			.setName('Description')
			.setDesc('Optional description of this role')
			.addTextArea(text => {
				this.descriptionInput = text.inputEl;
				console.log('RoleEditModal: Description input assigned:', !!this.descriptionInput);
				text.setValue(this.role?.description || '')
					.setPlaceholder('Optional description...');
				text.inputEl.rows = 3;
			});

		// Color input
		new Setting(contentEl)
			.setName('Color')
			.setDesc('Color to represent this role')
			.addColorPicker(color => {
				// Try multiple ways to get the color input element
				this.colorInput = (color as any).inputEl || (color as any).input;
				console.log('RoleEditModal: Color input assigned:', !!this.colorInput, typeof this.colorInput);
				
				if (this.colorInput) {
					console.log('RoleEditModal: Color input value:', this.colorInput.value);
					console.log('RoleEditModal: Color input type:', this.colorInput.type);
				} else {
					console.error('RoleEditModal: Failed to get color input element');
				}
				
				const defaultColor = this.role?.colorHex || Utils.generateRandomColor();
				console.log('RoleEditModal: Setting default color:', defaultColor);
				color.setValue(defaultColor);
				
				// Store the color component as fallback
				(this as any).colorComponent = color;
			});

		// Icon selection
		this.createIconSelection(contentEl);

		// Action buttons
		const buttonContainer = contentEl.createDiv({
			attr: { style: 'text-align: right; margin-top: 20px; gap: 8px; display: flex; justify-content: flex-end;' }
		});

		const saveBtn = buttonContainer.createEl('button', { text: 'Save' });
		console.log('RoleEditModal: Save button created:', saveBtn);
		console.log('RoleEditModal: Save button style:', saveBtn.style.cssText);
		console.log('RoleEditModal: Save button disabled:', saveBtn.disabled);
		
		// Add some basic styling to ensure button is clickable
		saveBtn.style.padding = '8px 16px';
		saveBtn.style.marginRight = '8px';
		saveBtn.style.cursor = 'pointer';
		saveBtn.style.backgroundColor = '#007acc';
		saveBtn.style.color = 'white';
		saveBtn.style.border = 'none';
		saveBtn.style.borderRadius = '4px';
		
		saveBtn.addEventListener('click', (event) => {
			console.log('RoleEditModal: Save button event triggered', event);
			console.log('RoleEditModal: Event target:', event.target);
			console.log('RoleEditModal: Event currentTarget:', event.currentTarget);
			event.preventDefault();
			event.stopPropagation();
			
			// Test if we can show a simple notice first
			try {
				console.log('RoleEditModal: About to call save method');
				this.save();
			} catch (error) {
				console.error('RoleEditModal: Error in save method:', error);
				new Notice('Error in save method: ' + error.message);
			}
		});
		
		// Also add a mousedown listener as backup
		saveBtn.addEventListener('mousedown', () => {
			console.log('RoleEditModal: Save button mousedown detected');
		});
		
		// Add a test to verify the button is in the DOM
		setTimeout(() => {
			console.log('RoleEditModal: Button in DOM check:', document.contains(saveBtn));
			console.log('RoleEditModal: Button parent:', saveBtn.parentElement);
		}, 100);

		const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });
		console.log('RoleEditModal: Cancel button created:', cancelBtn);
		
		// Add some basic styling
		cancelBtn.style.padding = '8px 16px';
		cancelBtn.style.cursor = 'pointer';
		cancelBtn.style.backgroundColor = 'var(--interactive-normal)';
		cancelBtn.style.border = '1px solid var(--background-modifier-border)';
		cancelBtn.style.borderRadius = '4px';
		
		cancelBtn.addEventListener('click', (event) => {
			console.log('RoleEditModal: Cancel button event triggered', event);
			event.preventDefault();
			event.stopPropagation();
			this.close();
		});

		// Add a quick save button as backup
		const quickSaveBtn = buttonContainer.createEl('button', { text: 'Quick Save' });
		quickSaveBtn.style.padding = '8px 16px';
		quickSaveBtn.style.marginRight = '8px';
		quickSaveBtn.style.backgroundColor = '#28a745';
		quickSaveBtn.style.color = 'white';
		quickSaveBtn.style.border = 'none';
		quickSaveBtn.style.borderRadius = '4px';
		quickSaveBtn.addEventListener('click', () => {
			console.log('RoleEditModal: Quick Save button clicked');
			
			// Simple save with minimal validation
			const simpleName = this.nameInput?.value?.trim() || 'New Role';
			const simpleColor = '#007acc'; // Default blue
			const simpleDescription = this.descriptionInput?.value?.trim() || undefined;
			
			try {
				console.log('RoleEditModal: Quick save with:', { simpleName, simpleColor, simpleDescription, selectedIcon: this.selectedIcon });
				const newRole = this.plugin.createRole(simpleName, simpleColor, simpleDescription, this.selectedIcon || undefined);
				console.log('RoleEditModal: Quick save successful:', newRole);
				new Notice('Role created via quick save!');
				this.close();
			} catch (error) {
				console.error('RoleEditModal: Quick save failed:', error);
				new Notice('Quick save failed: ' + error.message);
			}
		});

		// Focus name input
		this.nameInput.focus();
	}

	private createIconSelection(container: HTMLElement): void {
		new Setting(container)
			.setName('Icon')
			.setDesc('Optional icon for this role')
			.addButton(button => {
				button.setButtonText('Choose Icon')
					.onClick(() => {
						new IconPickerModal(this.app, (iconKey) => {
							this.selectedIcon = iconKey;
							this.updateIconDisplay(button.buttonEl);
						}, this.selectedIcon || undefined).open();
					});
				
				this.updateIconDisplay(button.buttonEl);
			});
	}

	private updateIconDisplay(buttonEl: HTMLElement): void {
		buttonEl.textContent = '';
		if (this.selectedIcon) {
			const iconElement = IconLibrary.createIconElement(this.selectedIcon, 16);
			buttonEl.appendChild(iconElement);
			buttonEl.appendChild(document.createTextNode(' ' + this.selectedIcon));
		} else {
			buttonEl.textContent = 'Choose Icon';
		}
	}

	private save(): void {
		console.log('RoleEditModal: Save button clicked');
		
		const name = this.nameInput?.value?.trim() || '';
		const description = this.descriptionInput?.value?.trim() || '';
		
		// Handle color input more safely
		let color = '';
		if (this.colorInput && this.colorInput.value) {
			color = this.colorInput.value;
		} else if ((this as any).colorComponent && (this as any).colorComponent.getValue) {
			console.warn('RoleEditModal: Using color component fallback');
			color = (this as any).colorComponent.getValue();
		} else {
			console.warn('RoleEditModal: No color input available, using random color');
			color = Utils.generateRandomColor();
		}

		console.log('RoleEditModal: Form values:', { 
			name, 
			description, 
			color, 
			selectedIcon: this.selectedIcon,
			nameInputExists: !!this.nameInput,
			descriptionInputExists: !!this.descriptionInput,
			colorInputExists: !!this.colorInput
		});

		if (!name) {
			console.log('RoleEditModal: Save failed - no name');
			new Notice('Role name is required');
			return;
		}

		console.log('RoleEditModal: Checking color validity for:', color, typeof color);
		const isValidColor = Utils.isValidHexColor(color);
		console.log('RoleEditModal: Color validation result:', isValidColor);
		
		if (!isValidColor) {
			console.log('RoleEditModal: Save failed - invalid color:', color);
			console.log('RoleEditModal: Attempting to fix color format...');
			
			// Try to fix common color format issues
			if (color && typeof color === 'string') {
				if (!color.startsWith('#')) {
					color = '#' + color;
					console.log('RoleEditModal: Added # prefix, new color:', color);
				}
				
				// Try validation again
				if (Utils.isValidHexColor(color)) {
					console.log('RoleEditModal: Color fixed successfully');
				} else {
					console.log('RoleEditModal: Color still invalid, using fallback');
					color = Utils.generateRandomColor();
				}
			} else {
				console.log('RoleEditModal: Color is not a string, using fallback');
				color = Utils.generateRandomColor();
			}
		}

		console.log('RoleEditModal: Validation passed, attempting to save...');

		try {
			if (this.role) {
				// Update existing role
				console.log('RoleEditModal: Updating existing role:', this.role.id);
				this.plugin.updateRole(this.role.id, {
					name,
					description: description || undefined,
					colorHex: color,
					icon: this.selectedIcon || undefined
				});
				new Notice('Role updated');
			} else {
				// Create new role
				console.log('RoleEditModal: Creating new role');
				const newRole = this.plugin.createRole(name, color, description || undefined, this.selectedIcon || undefined);
				console.log('RoleEditModal: New role created:', newRole);
				new Notice('Role created');
			}
			console.log('RoleEditModal: Save successful, closing modal');
			this.close();
		} catch (error) {
			console.error('RoleEditModal: Error saving role:', error);
			new Notice('Failed to save role');
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class ConfirmModal extends Modal {
	private title: string;
	private message: string;
	private confirmText: string;
	private isDestructive: boolean;
	public onConfirm: (confirmed: boolean) => void = () => {};

	constructor(app: App, title: string, message: string, confirmText: string = 'Confirm', isDestructive: boolean = false) {
		super(app);
		this.title = title;
		this.message = message;
		this.confirmText = confirmText;
		this.isDestructive = isDestructive;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl('h2', { text: this.title });
		contentEl.createEl('p', { text: this.message });

		const buttonContainer = contentEl.createDiv({
			attr: { style: 'text-align: right; margin-top: 20px; gap: 8px; display: flex; justify-content: flex-end;' }
		});

		const confirmBtn = buttonContainer.createEl('button', { text: this.confirmText });
		if (this.isDestructive) {
			confirmBtn.style.backgroundColor = 'var(--text-error)';
			confirmBtn.style.color = 'white';
		}
		confirmBtn.addEventListener('click', () => {
			this.close();
			this.onConfirm(true);
		});

		const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });
		cancelBtn.addEventListener('click', () => {
			this.close();
			this.onConfirm(false);
		});
	}

	onClose() {
		// Override parent method without parameters
		super.onClose();
	}
}