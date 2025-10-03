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

		// API & Sync Settings Section (Combined) - Disabled for now
		// this.createApiAndSyncSettingsSection(containerEl);

		// Donate Section (disabled)
		// this.createDonateSection(containerEl);
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

		// Transition duration with buttons and input
		const transitionSetting = new Setting(containerEl)
			.setName('Transition duration')
			.setDesc('Time to wait before switching roles (seconds)');

		const transitionContainer = transitionSetting.controlEl.createDiv({ cls: 'setting-item-control-flex' });

		// Preset buttons for transition
		const transitionPresets = [5, 10, 30];
		transitionPresets.forEach(preset => {
			const btn = transitionContainer.createEl('button', {
				text: `${preset}s`,
				cls: 'setting-preset-button'
			});
			btn.addEventListener('click', async () => {
				this.plugin.data.settings.transitionSeconds = preset;
				await this.plugin.savePluginData();
				transitionInput.value = preset.toString();
			});
		});

		// Direct input
		const transitionInput = transitionContainer.createEl('input', {
			type: 'number',
			cls: 'setting-number-input',
			attr: { min: '5', max: '120', step: '5' }
		});
		transitionInput.value = this.plugin.data.settings.transitionSeconds.toString();
		transitionInput.addEventListener('change', async () => {
			const value = parseInt(transitionInput.value);
			if (value >= 5 && value <= 120) {
				this.plugin.data.settings.transitionSeconds = value;
				await this.plugin.savePluginData();
			} else {
				transitionInput.value = this.plugin.data.settings.transitionSeconds.toString();
			}
		});

		// Unit label
		transitionContainer.createSpan({ text: 'seconds', cls: 'setting-unit-label' });

		// Minimum session duration with buttons and input
		const sessionSetting = new Setting(containerEl)
			.setName('Minimum session duration')
			.setDesc('Minimum time before allowing role switches (minutes)');

		const sessionContainer = sessionSetting.controlEl.createDiv({ cls: 'setting-item-control-flex' });

		// Preset buttons for session (in minutes)
		const sessionPresets = [5, 15, 30];
		sessionPresets.forEach(preset => {
			const btn = sessionContainer.createEl('button', {
				text: `${preset}m`,
				cls: 'setting-preset-button'
			});
			btn.addEventListener('click', async () => {
				this.plugin.data.settings.minSessionSeconds = preset * 60;
				await this.plugin.savePluginData();
				sessionInput.value = preset.toString();
			});
		});

		// Direct input (in minutes)
		const sessionInput = sessionContainer.createEl('input', {
			type: 'number',
			cls: 'setting-number-input',
			attr: { min: '5', max: '60', step: '5' }
		});
		sessionInput.value = (this.plugin.data.settings.minSessionSeconds / 60).toString();
		sessionInput.addEventListener('change', async () => {
			const value = parseInt(sessionInput.value);
			if (value >= 5 && value <= 60) {
				this.plugin.data.settings.minSessionSeconds = value * 60;
				await this.plugin.savePluginData();
			} else {
				sessionInput.value = (this.plugin.data.settings.minSessionSeconds / 60).toString();
			}
		});

		// Unit label
		sessionContainer.createSpan({ text: 'minutes', cls: 'setting-unit-label' });
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

		// Border opacity with buttons and input
		const opacitySetting = new Setting(containerEl)
			.setName('Border opacity')
			.setDesc('Opacity of the workspace border (0.1 to 1.0)');

		const opacityContainer = opacitySetting.controlEl.createDiv({ cls: 'setting-item-control-flex' });

		// Preset buttons for opacity
		const opacityPresets = [0.3, 0.5, 0.8];
		opacityPresets.forEach(preset => {
			const btn = opacityContainer.createEl('button', {
				text: `${preset}`,
				cls: 'setting-preset-button'
			});
			btn.addEventListener('click', async () => {
				this.plugin.data.settings.borderOpacity = preset;
				await this.plugin.savePluginData();
				this.plugin.updateWorkspaceBorder();
				opacityInput.value = preset.toString();
			});
		});

		// Direct input
		const opacityInput = opacityContainer.createEl('input', {
			type: 'number',
			cls: 'setting-number-input',
			attr: { min: '0.1', max: '1.0', step: '0.1' }
		});
		opacityInput.value = this.plugin.data.settings.borderOpacity.toString();
		opacityInput.addEventListener('change', async () => {
			const value = parseFloat(opacityInput.value);
			if (value >= 0.1 && value <= 1.0) {
				this.plugin.data.settings.borderOpacity = value;
				await this.plugin.savePluginData();
				this.plugin.updateWorkspaceBorder();
			} else {
				opacityInput.value = this.plugin.data.settings.borderOpacity.toString();
			}
		});

		// Unit label
		opacityContainer.createSpan({ text: 'opacity', cls: 'setting-unit-label' });

		new Setting(containerEl)
			.setName('Show periodic role reminder')
			.setDesc('Display a periodic notification showing your current role')
			.addToggle(toggle => {
				toggle.setValue(this.plugin.data.settings.showPeriodicReminder)
					.onChange(async (value) => {
						this.plugin.data.settings.showPeriodicReminder = value;
						await this.plugin.savePluginData();
						this.plugin.updateReminderInterval();
					});
			});

		// Reminder interval with buttons and input
		const reminderSetting = new Setting(containerEl)
			.setName('Reminder interval')
			.setDesc('How often to show the role reminder (minutes)');

		const reminderContainer = reminderSetting.controlEl.createDiv({ cls: 'setting-item-control-flex' });

		// Preset buttons for reminder interval
		const reminderPresets = [5, 15, 30];
		reminderPresets.forEach(preset => {
			const btn = reminderContainer.createEl('button', {
				text: `${preset}m`,
				cls: 'setting-preset-button'
			});
			btn.addEventListener('click', async () => {
				this.plugin.data.settings.reminderIntervalMinutes = preset;
				await this.plugin.savePluginData();
				this.plugin.updateReminderInterval();
				reminderInput.value = preset.toString();
			});
		});

		// Direct input
		const reminderInput = reminderContainer.createEl('input', {
			type: 'number',
			cls: 'setting-number-input',
			attr: { min: '1', max: '60', step: '1' }
		});
		reminderInput.value = this.plugin.data.settings.reminderIntervalMinutes.toString();
		reminderInput.addEventListener('change', async () => {
			const value = parseInt(reminderInput.value);
			if (value >= 1 && value <= 60) {
				this.plugin.data.settings.reminderIntervalMinutes = value;
				await this.plugin.savePluginData();
				this.plugin.updateReminderInterval();
			} else {
				reminderInput.value = this.plugin.data.settings.reminderIntervalMinutes.toString();
			}
		});

		// Unit label
		reminderContainer.createSpan({ text: 'minutes', cls: 'setting-unit-label' });

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

	private createApiAndSyncSettingsSection(containerEl: HTMLElement): void {
		containerEl.createEl('h2', { text: 'API & Synchronization Settings' });

		// Enable Sync toggle (enables API automatically)
		new Setting(containerEl)
			.setName('Enable Synchronization')
			.setDesc('Enable API server and sync functionality for external integrations and device synchronization')
			.addToggle(toggle => {
				toggle.setValue(this.plugin.data.settings.enableSync)
					.onChange(async (value) => {
						this.plugin.data.settings.enableSync = value;
						this.plugin.data.settings.enableApi = value; // Auto-enable/disable API with sync
						await this.plugin.savePluginData();

						if (value) {
							await this.plugin.startApiServer();
							this.plugin.sync.startAutoSync();
						} else {
							await this.plugin.stopApiServer();
							this.plugin.sync.stopAutoSync();
						}
						this.display(); // Refresh to show/hide settings
					});
			});

		// Show settings only when sync is enabled
		if (this.plugin.data.settings.enableSync) {
			// Device Name
			new Setting(containerEl)
				.setName('Device Name')
				.setDesc('Name to identify this device in sync operations')
				.addText(text => {
					text.setValue(this.plugin.data.settings.deviceName)
						.onChange(async (value) => {
							this.plugin.data.settings.deviceName = value || 'Obsidian Device';
							await this.plugin.savePluginData();
						});
				});

			// Device ID (read-only)
			new Setting(containerEl)
				.setName('Device ID')
				.setDesc('Unique identifier for this device (auto-generated)')
				.addText(text => {
					text.setValue(this.plugin.data.settings.deviceId)
						.setDisabled(true);
				});

			// API Port
			new Setting(containerEl)
				.setName('API Port')
				.setDesc('Port number for the API server')
				.addText(text => {
					text.setValue(this.plugin.data.settings.apiPort.toString())
						.onChange(async (value) => {
							const port = parseInt(value);
							if (port >= 1024 && port <= 65535) {
								this.plugin.data.settings.apiPort = port;
								await this.plugin.savePluginData();
							}
						});
				});

			// Enable Authentication
			new Setting(containerEl)
				.setName('Enable Authentication')
				.setDesc('Require API keys for API access (recommended)')
				.addToggle(toggle => {
					toggle.setValue(this.plugin.data.settings.enableAuthentication)
						.onChange(async (value) => {
							this.plugin.data.settings.enableAuthentication = value;
							await this.plugin.savePluginData();
							this.display(); // Refresh to show/hide API key management
						});
				});

			// API Key Management
			if (this.plugin.data.settings.enableAuthentication) {
				this.createApiKeyManagement(containerEl);
			}

			// Sync Interval
			new Setting(containerEl)
				.setName('Sync Interval')
				.setDesc('How often to sync in minutes')
				.addSlider(slider => {
					slider.setLimits(1, 60, 1)
						.setValue(this.plugin.data.settings.syncInterval)
						.setDynamicTooltip()
						.onChange(async (value) => {
							this.plugin.data.settings.syncInterval = value;
							await this.plugin.savePluginData();
							// Restart auto-sync with new interval
							this.plugin.sync.stopAutoSync();
							this.plugin.sync.startAutoSync();
						});
				});

			// Sync Endpoints
			this.createSyncEndpointManagement(containerEl);
		}
	}

	private createApiKeyManagement(containerEl: HTMLElement): void {
		containerEl.createEl('h3', { text: 'API Key Management' });

		new Setting(containerEl)
			.setName('Generate API Key')
			.setDesc('Create a new API key for external applications')
			.addButton(button => {
				button.setButtonText('Generate Key')
					.setCta()
					.onClick(() => {
						this.showApiKeyModal();
					});
			});

		// List existing API keys
		const apiKeys = this.plugin.data.apiKeys;
		if (apiKeys.length === 0) {
			const noKeysEl = containerEl.createDiv({
				text: 'No API keys created yet.',
				cls: 'setting-item-description'
			});
		} else {
			apiKeys.forEach(apiKey => {
				const keyName = `${apiKey.name} (${apiKey.permissions.join(', ')})`;
				const lastUsed = apiKey.lastUsed ? new Date(apiKey.lastUsed).toLocaleDateString() : 'Never';

				new Setting(containerEl)
					.setName(keyName)
					.setDesc(`Created: ${new Date(apiKey.createdAt).toLocaleDateString()} | Last used: ${lastUsed}`)
					.addButton(button => {
						button.setButtonText('Delete')
							.setWarning()
							.onClick(async () => {
								const confirmed = await this.confirmDeleteApiKey(apiKey);
								if (confirmed) {
									this.plugin.auth.deleteApiKey(apiKey.id);
									this.display(); // Refresh settings
									new Notice('API key deleted');
								}
							});
					})
					.addToggle(toggle => {
						toggle.setValue(apiKey.isActive)
							.onChange(async (value) => {
								this.plugin.auth.updateApiKey(apiKey.id, { isActive: value });
								new Notice(`API key ${value ? 'enabled' : 'disabled'}`);
							});
					});
			});
		}
	}


	private createSyncEndpointManagement(containerEl: HTMLElement): void {
		containerEl.createEl('h3', { text: 'Sync Endpoints' });

		new Setting(containerEl)
			.setName('Add Sync Endpoint')
			.setDesc('Connect to another RoleSwitch instance')
			.addButton(button => {
				button.setButtonText('Add Endpoint')
					.setCta()
					.onClick(() => {
						this.showSyncEndpointModal();
					});
			});

		// List existing sync endpoints
		const endpoints = this.plugin.data.syncEndpoints;
		if (endpoints.length === 0) {
			containerEl.createDiv({
				text: 'No sync endpoints configured.',
				cls: 'setting-item-description'
			});
		} else {
			endpoints.forEach(endpoint => {
				const lastSync = endpoint.lastSync ? new Date(endpoint.lastSync).toLocaleString() : 'Never';

				new Setting(containerEl)
					.setName(endpoint.name)
					.setDesc(`URL: ${endpoint.url} | Direction: ${endpoint.syncDirection} | Last sync: ${lastSync}`)
					.addButton(button => {
						button.setButtonText('Test')
							.onClick(async () => {
								const result = await this.plugin.sync.testEndpointConnection(endpoint);
								new Notice(result.message);
							});
					})
					.addButton(button => {
						button.setButtonText('Sync Now')
							.onClick(async () => {
								const result = await this.plugin.sync.manualSyncEndpoint(endpoint.id);
								new Notice(result.message);
								if (result.success) {
									this.display(); // Refresh to update last sync time
								}
							});
					})
					.addButton(button => {
						button.setButtonText('Delete')
							.setWarning()
							.onClick(async () => {
								const confirmed = await this.confirmDeleteEndpoint(endpoint);
								if (confirmed) {
									this.plugin.sync.deleteSyncEndpoint(endpoint.id);
									this.display(); // Refresh settings
									new Notice('Sync endpoint deleted');
								}
							});
					})
					.addToggle(toggle => {
						toggle.setValue(endpoint.isActive)
							.onChange(async (value) => {
								this.plugin.sync.updateSyncEndpoint(endpoint.id, { isActive: value });
								new Notice(`Endpoint ${value ? 'enabled' : 'disabled'}`);
							});
					});
			});
		}
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

	private showApiKeyModal(): void {
		// Create a simple modal for API key creation
		const modal = new Modal(this.app);
		modal.titleEl.setText('Create API Key');

		const { contentEl } = modal;

		let nameInput: HTMLInputElement;
		let permissions: string[] = ['read'];

		// Key name
		const nameSetting = new Setting(contentEl)
			.setName('Key Name')
			.setDesc('Descriptive name for this API key')
			.addText(text => {
				nameInput = text.inputEl;
				text.setPlaceholder('My App Key');
				return text;
			});

		// Ensure nameInput is assigned
		nameSetting;

		// Permissions
		new Setting(contentEl)
			.setName('Permissions')
			.setDesc('Select what this key can do')
			.addDropdown(dropdown => {
				dropdown.addOption('read', 'Read Only - View data only')
					.addOption('write', 'Read/Write - Modify sessions and roles')
					.addOption('admin', 'Admin - Full access including key management')
					.setValue('read')
					.onChange(value => {
						permissions = [value as 'read' | 'write' | 'admin'];
					});
			});

		// Buttons
		const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });

		const createBtn = buttonContainer.createEl('button', { text: 'Create Key', cls: 'mod-cta' });
		createBtn.addEventListener('click', () => {
			const name = nameInput!.value.trim();
			if (!name) {
				new Notice('Key name is required');
				return;
			}

			try {
				const apiKey = this.plugin.auth.generateApiKey(name, permissions as any);
				new Notice(`API key created: ${apiKey.key}\nSecret: ${apiKey.secret}`, 10000);
				modal.close();
				this.display(); // Refresh settings
			} catch (error) {
				new Notice('Failed to create API key');
			}
		});

		const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });
		cancelBtn.addEventListener('click', () => modal.close());

		modal.open();
		nameInput!.focus();
	}

	private showSyncEndpointModal(): void {
		const modal = new Modal(this.app);
		modal.titleEl.setText('Add Sync Endpoint');

		const { contentEl } = modal;

		let nameInput: HTMLInputElement;
		let urlInput: HTMLInputElement;
		let apiKeySelect: HTMLSelectElement;
		let syncDirection: 'push' | 'pull' | 'bidirectional' = 'bidirectional';

		// Endpoint name
		const nameSetting = new Setting(contentEl)
			.setName('Endpoint Name')
			.setDesc('Name for this sync endpoint')
			.addText(text => {
				nameInput = text.inputEl;
				text.setPlaceholder('Home Computer');
				return text;
			});

		// Ensure nameInput is assigned
		nameSetting;

		// URL
		new Setting(contentEl)
			.setName('Endpoint URL')
			.setDesc('Full URL to the other RoleSwitch API')
			.addText(text => {
				urlInput = text.inputEl;
				text.setPlaceholder('http://localhost:3030');
			});

		// API Key selection
		new Setting(contentEl)
			.setName('API Key')
			.setDesc('Select API key to use for authentication')
			.addDropdown(dropdown => {
				const apiKeys = this.plugin.data.apiKeys.filter(key => key.isActive);
				if (apiKeys.length === 0) {
					dropdown.addOption('', 'No active API keys available');
				} else {
					apiKeys.forEach(key => {
						dropdown.addOption(key.id, key.name);
					});
				}
				apiKeySelect = dropdown.selectEl;
			});

		// Sync direction
		new Setting(contentEl)
			.setName('Sync Direction')
			.setDesc('How data should be synchronized')
			.addDropdown(dropdown => {
				dropdown.addOption('push', 'Push Only - Send data to endpoint')
					.addOption('pull', 'Pull Only - Receive data from endpoint')
					.addOption('bidirectional', 'Bidirectional - Both send and receive')
					.setValue('bidirectional')
					.onChange(value => {
						syncDirection = value as 'push' | 'pull' | 'bidirectional';
					});
			});

		// Buttons
		const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });

		const createBtn = buttonContainer.createEl('button', { text: 'Add Endpoint', cls: 'mod-cta' });
		createBtn.addEventListener('click', () => {
			const name = nameInput!.value.trim();
			const url = urlInput!.value.trim();
			const apiKeyId = apiKeySelect.value;

			if (!name || !url || !apiKeyId) {
				new Notice('All fields are required');
				return;
			}

			try {
				this.plugin.sync.addSyncEndpoint(name, url, apiKeyId, syncDirection);
				new Notice('Sync endpoint added');
				modal.close();
				this.display(); // Refresh settings
			} catch (error) {
				new Notice('Failed to add sync endpoint');
			}
		});

		const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });
		cancelBtn.addEventListener('click', () => modal.close());

		modal.open();
		nameInput!.focus();
	}

	private async confirmDeleteApiKey(apiKey: any): Promise<boolean> {
		return new Promise((resolve) => {
			const modal = new ConfirmModal(
				this.app,
				'Delete API Key',
				`Are you sure you want to delete the API key "${apiKey.name}"? This action cannot be undone and any applications using this key will lose access.`,
				'Delete',
				true
			);
			modal.onConfirm = (confirmed: boolean) => resolve(confirmed);
			modal.open();
		});
	}

	private async confirmDeleteEndpoint(endpoint: any): Promise<boolean> {
		return new Promise((resolve) => {
			const modal = new ConfirmModal(
				this.app,
				'Delete Sync Endpoint',
				`Are you sure you want to delete the sync endpoint "${endpoint.name}"?`,
				'Delete',
				true
			);
			modal.onConfirm = (confirmed: boolean) => resolve(confirmed);
			modal.open();
		});
	}

	private createDonateSection(containerEl: HTMLElement): void {
		containerEl.createEl('h2', { text: '💝 Support Development' });

		const donateContainer = containerEl.createDiv({
			cls: 'donate-section'
		});

		donateContainer.createEl('p', {
			text: 'If you find RoleSwitch helpful, consider supporting its development!',
			attr: { style: 'margin-bottom: 12px;' }
		});

		new Setting(donateContainer)
			.setName('Buy Me a Coffee')
			.setDesc('Support development with a one-time donation')
			.addButton(button => {
				button.setButtonText('☕ Donate')
					.setCta()
					.onClick(() => {
						window.open('https://www.buymeacoffee.com/yourusername', '_blank');
					});
			});

		new Setting(donateContainer)
			.setName('GitHub Sponsors')
			.setDesc('Become a sponsor and support ongoing development')
			.addButton(button => {
				button.setButtonText('💖 Sponsor')
					.onClick(() => {
						window.open('https://github.com/sponsors/yourusername', '_blank');
					});
			});

		donateContainer.createEl('p', {
			text: 'Thank you for your support! ❤️',
			attr: { style: 'margin-top: 12px; color: var(--text-muted); font-style: italic;' }
		});
	}
}

class RoleEditModal extends Modal implements RoleEditModalInterface {
	private plugin: RoleSwitchPlugin;
	private role: Role | null;
	private nameInput!: HTMLInputElement;
	private descriptionInput!: HTMLTextAreaElement;
	private colorInput!: HTMLInputElement;
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
				new Notice('Error in save method: ' + (error as Error).message);
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