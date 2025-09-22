// Settings Tab Component

import { App, PluginSettingTab, Setting, Notice, Modal } from 'obsidian';
import { Role, DEFAULT_SETTINGS, ColorPickerComponent, RoleEditModalInterface } from '../types';
import { IconLibrary } from '../icons';
import { Utils } from '../utils';
import { IconPickerModal } from '../views/Modals';
import type RoleSwitchPlugin from '../../main';

export class RoleSwitchSettingsTab extends PluginSettingTab {
	plugin: RoleSwitchPlugin;

	constructor(app: App, plugin: RoleSwitchPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h1', { text: 'RoleSwitch Settings' });

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
		colorEl.addClass('role-color-indicator');
		colorEl.style.backgroundColor = role.colorHex;

		if (role.icon && IconLibrary.ICONS[role.icon]) {
			const iconEl = document.createElement('div');
			iconEl.addClass('role-icon-container');
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
		const modal = new RoleEditModal(this.app, this.plugin, role);

		// Store the original onClose and add our refresh logic
		const originalOnClose = modal.onClose.bind(modal);
		modal.onClose = () => {
			originalOnClose();
			this.display(); // Refresh settings when modal closes
		};

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

class RoleEditModal extends Modal implements RoleEditModalInterface {
	private plugin: RoleSwitchPlugin;
	private role: Role | null;
	private nameInput: HTMLInputElement;
	private descriptionInput: HTMLTextAreaElement;
	private colorInput: HTMLInputElement;
	colorComponent?: ColorPickerComponent;
	private selectedIcon: string | null = null;

	constructor(app: App, plugin: RoleSwitchPlugin, role?: Role) {
		super(app);
		this.plugin = plugin;
		this.role = role || null;
		this.selectedIcon = role?.icon || null;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		const title = this.role ? 'Edit Role' : 'Create New Role';
		contentEl.createEl('h2', { text: title });

		// Name input
		new Setting(contentEl)
			.setName('Role name')
			.setDesc('A descriptive name for this role')
			.addText(text => {
				this.nameInput = text.inputEl;
				text.setValue(this.role?.name || '')
					.setPlaceholder('e.g., Deep Work, Meetings, Learning');
			});

		// Description input
		new Setting(contentEl)
			.setName('Description')
			.setDesc('Optional description of this role')
			.addTextArea(text => {
				this.descriptionInput = text.inputEl;
				text.setValue(this.role?.description || '')
					.setPlaceholder('Optional description...');
				text.inputEl.rows = 3;
			});

		// Color input
		new Setting(contentEl)
			.setName('Color')
			.setDesc('Color to represent this role')
			.addColorPicker(color => {
				// Get the color input element using proper typing
				const colorPicker = color as unknown as ColorPickerComponent;
				this.colorInput = colorPicker.inputEl || colorPicker.input!;

				const defaultColor = this.role?.colorHex || Utils.generateRandomColor();
				color.setValue(defaultColor);

				// Store the color component with proper typing
				this.colorComponent = colorPicker;
			});

		// Icon selection
		this.createIconSelection(contentEl);

		// Action buttons
		const buttonContainer = contentEl.createDiv({
			cls: 'role-edit-buttons'
		});

		const saveBtn = buttonContainer.createEl('button', { text: 'Save' });

		// Add CSS class for styling
		saveBtn.addClass('role-edit-save');

		saveBtn.addEventListener('click', (event) => {
			event.preventDefault();
			event.stopPropagation();

			try {
				this.save();
			} catch (error) {
				console.error('RoleEditModal: Error in save method:', error);
				new Notice('Error in save method: ' + error.message);
			}
		});

		const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });

		// Add CSS class for styling
		cancelBtn.addClass('role-edit-cancel');

		cancelBtn.addEventListener('click', (event) => {
			event.preventDefault();
			event.stopPropagation();
			this.close();
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
		const name = this.nameInput?.value?.trim() || '';
		const description = this.descriptionInput?.value?.trim() || '';

		// Handle color input more safely
		let color = '';
		if (this.colorInput && this.colorInput.value) {
			color = this.colorInput.value;
		} else if (this.colorComponent && this.colorComponent.getValue) {
			color = this.colorComponent.getValue();
		} else {
			color = Utils.generateRandomColor();
		}

		if (!name) {
			new Notice('Role name is required');
			return;
		}

		const isValidColor = Utils.isValidHexColor(color);

		if (!isValidColor) {
			// Try to fix common color format issues
			if (color && typeof color === 'string') {
				if (!color.startsWith('#')) {
					color = '#' + color;
				}

				// Try validation again
				if (!Utils.isValidHexColor(color)) {
					color = Utils.generateRandomColor();
				}
			} else {
				color = Utils.generateRandomColor();
			}
		}

		try {
			if (this.role) {
				// Update existing role
				this.plugin.updateRole(this.role.id, {
					name,
					description: description || undefined,
					colorHex: color,
					icon: this.selectedIcon || undefined
				});
				new Notice('Role updated');
			} else {
				// Create new role
				const newRole = this.plugin.createRole(name, color, description || undefined, this.selectedIcon || undefined);
				new Notice('Role created');
			}
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
			cls: 'confirm-modal-buttons'
		});

		const confirmBtn = buttonContainer.createEl('button', {
			text: this.confirmText,
			cls: this.isDestructive ? 'confirm-button destructive' : 'confirm-button'
		});
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