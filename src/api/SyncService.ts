// Synchronization Service for RoleSwitch Plugin
// Handles cross-system session synchronization

import { requestUrl } from 'obsidian';
import { SyncEndpoint, Role, RoleSwitchEvent, ApiKey } from '../types';
import { SyncData } from './ApiInterface';
import { AuthService } from './AuthService';
import type RoleSwitchPlugin from '../../main';

export class SyncService {
	private plugin: RoleSwitchPlugin;
	private auth: AuthService;
	private syncIntervalId: number | null = null;

	constructor(plugin: RoleSwitchPlugin, auth: AuthService) {
		this.plugin = plugin;
		this.auth = auth;
	}

	// ====================
	// SYNC ENDPOINT MANAGEMENT
	// ====================

	async addSyncEndpoint(name: string, url: string, apiKey: string, syncDirection: 'push' | 'pull' | 'bidirectional'): Promise<SyncEndpoint> {
		const endpoint: SyncEndpoint = {
			id: this.generateId(),
			name,
			url: url.replace(/\/$/, ''), // Remove trailing slash
			apiKey,
			isActive: true,
			syncDirection
		};

		this.plugin.data.syncEndpoints.push(endpoint);
		await this.plugin.savePluginData();

		return endpoint;
	}

	async updateSyncEndpoint(endpointId: string, updates: Partial<Omit<SyncEndpoint, 'id'>>): Promise<void> {
		const endpoint = this.plugin.data.syncEndpoints.find((ep: SyncEndpoint) => ep.id === endpointId);
		if (!endpoint) {
			throw new Error('Sync endpoint not found');
		}

		Object.assign(endpoint, updates);
		await this.plugin.savePluginData();
	}

	async deleteSyncEndpoint(endpointId: string): Promise<void> {
		this.plugin.data.syncEndpoints = this.plugin.data.syncEndpoints.filter(
			(ep: SyncEndpoint) => ep.id !== endpointId
		);
		await this.plugin.savePluginData();
	}

	getSyncEndpoints(): SyncEndpoint[] {
		return this.plugin.data.syncEndpoints;
	}

	// ====================
	// AUTOMATIC SYNC
	// ====================

	startAutoSync(): void {
		if (this.syncIntervalId || !this.plugin.data.settings.enableSync) {
			return;
		}

		const intervalMs = this.plugin.data.settings.syncInterval * 60 * 1000; // Convert minutes to milliseconds
		this.syncIntervalId = window.setInterval(() => {
			void this.syncAllEndpoints();
		}, intervalMs);
	}

	stopAutoSync(): void {
		if (this.syncIntervalId) {
			clearInterval(this.syncIntervalId);
			this.syncIntervalId = null;
		}
	}

	async syncAllEndpoints(): Promise<void> {
		const activeEndpoints = this.plugin.data.syncEndpoints.filter((ep: SyncEndpoint) => ep.isActive);

		for (const endpoint of activeEndpoints) {
			try {
				await this.syncWithEndpoint(endpoint);
			} catch {
				// Sync failed, will retry on next interval
			}
		}
	}

	// ====================
	// INDIVIDUAL SYNC OPERATIONS
	// ====================

	async syncWithEndpoint(endpoint: SyncEndpoint): Promise<void> {
		const apiKey = this.plugin.data.apiKeys.find((key: ApiKey) => key.id === endpoint.apiKey);
		if (!apiKey) {
			throw new Error(`API key not found for endpoint: ${endpoint.name}`);
		}

		switch (endpoint.syncDirection) {
			case 'push':
				await this.pushToEndpoint(endpoint, apiKey);
				break;
			case 'pull':
				await this.pullFromEndpoint(endpoint, apiKey);
				break;
			case 'bidirectional':
				await this.bidirectionalSyncWithEndpoint(endpoint, apiKey);
				break;
		}

		// Update last sync timestamp
		endpoint.lastSync = new Date().toISOString();
		await this.plugin.savePluginData();
	}

	private async pushToEndpoint(endpoint: SyncEndpoint, apiKey: ApiKey): Promise<void> {
		const deviceId = this.plugin.data.settings.deviceId || await this.generateDeviceId();
		const syncData: SyncData = {
			deviceId,
			deviceName: this.plugin.data.settings.deviceName,
			timestamp: new Date().toISOString(),
			roles: [...this.plugin.data.roles],
			events: [...this.plugin.data.events],
			state: { ...this.plugin.data.state }
		};

		const request = this.auth.createAuthenticatedRequest(apiKey, syncData);

		await requestUrl({
			url: `${endpoint.url}/api/sync/push`,
			method: 'POST',
			headers: request.headers,
			body: request.body
		});
	}

	private async pullFromEndpoint(endpoint: SyncEndpoint, apiKey: ApiKey): Promise<void> {
		const lastSync = endpoint.lastSync || new Date(0).toISOString();
		const deviceId = this.plugin.data.settings.deviceId;

		const response = await requestUrl({
			url: `${endpoint.url}/api/sync/pull?since=${encodeURIComponent(lastSync)}&deviceId=${encodeURIComponent(deviceId)}`,
			method: 'GET',
			headers: {
				'X-API-Key': apiKey.key,
				'Content-Type': 'application/json'
			}
		});

		if (response.json.success && response.json.data) {
			await this.mergeSyncData(response.json.data);
		}
	}

	private async bidirectionalSyncWithEndpoint(endpoint: SyncEndpoint, apiKey: ApiKey): Promise<void> {
		const deviceId = this.plugin.data.settings.deviceId || await this.generateDeviceId();
		const ourSyncData: SyncData = {
			deviceId,
			deviceName: this.plugin.data.settings.deviceName,
			timestamp: new Date().toISOString(),
			roles: [...this.plugin.data.roles],
			events: [...this.plugin.data.events],
			state: { ...this.plugin.data.state }
		};

		const request = this.auth.createAuthenticatedRequest(apiKey, ourSyncData);

		const response = await requestUrl({
			url: `${endpoint.url}/api/sync/bidirectional`,
			method: 'POST',
			headers: request.headers,
			body: request.body
		});

		if (response.json.success && response.json.data) {
			await this.mergeSyncData(response.json.data);
		}
	}

	// ====================
	// MANUAL SYNC OPERATIONS
	// ====================

	async testEndpointConnection(endpoint: SyncEndpoint): Promise<{ success: boolean; message: string }> {
		try {
			const apiKey = this.plugin.data.apiKeys.find((key: ApiKey) => key.id === endpoint.apiKey);
			if (!apiKey) {
				return { success: false, message: 'API key not found' };
			}

			const response = await requestUrl({
				url: `${endpoint.url}/api/status`,
				method: 'GET',
				headers: {
					'X-API-Key': apiKey.key,
					'Content-Type': 'application/json'
				}
			});

			if (response.json.success) {
				return { success: true, message: 'Connection successful' };
			} else {
				return { success: false, message: response.json.error || 'Unknown error' };
			}
		} catch (error) {
			return { success: false, message: `Connection failed: ${error}` };
		}
	}

	async manualSyncEndpoint(endpointId: string): Promise<{ success: boolean; message: string }> {
		try {
			const endpoint = this.plugin.data.syncEndpoints.find((ep: SyncEndpoint) => ep.id === endpointId);
			if (!endpoint) {
				return { success: false, message: 'Endpoint not found' };
			}

			await this.syncWithEndpoint(endpoint);
			return { success: true, message: `Successfully synced with ${endpoint.name}` };
		} catch (error) {
			return { success: false, message: `Sync failed: ${error}` };
		}
	}

	// ====================
	// CONFLICT RESOLUTION
	// ====================

	private async mergeSyncData(syncData: SyncData): Promise<void> {
		// This is similar to the API version but runs locally
		// Merge roles (update existing, add new ones)
		syncData.roles.forEach((incomingRole: Role) => {
			const existingRoleIndex = this.plugin.data.roles.findIndex((r: Role) => r.id === incomingRole.id);
			if (existingRoleIndex >= 0) {
				// Update existing role
				this.plugin.data.roles[existingRoleIndex] = incomingRole;
			} else {
				// Add new role
				this.plugin.data.roles.push(incomingRole);
			}
		});

		// Merge events (add new ones, avoid duplicates)
		const newEvents: RoleSwitchEvent[] = [];
		syncData.events.forEach((incomingEvent: RoleSwitchEvent) => {
			const exists = this.plugin.data.events.some((e: RoleSwitchEvent) => e.id === incomingEvent.id);
			if (!exists) {
				newEvents.push(incomingEvent);
			}
		});

		this.plugin.data.events.push(...newEvents);

		// Sort events by timestamp
		this.plugin.data.events.sort((a: RoleSwitchEvent, b: RoleSwitchEvent) => new Date(a.at).getTime() - new Date(b.at).getTime());

		// Handle state synchronization - only update if incoming state is more recent
		if (syncData.state.activeStartAt &&
			(!this.plugin.data.state.activeStartAt ||
			new Date(syncData.state.activeStartAt) > new Date(this.plugin.data.state.activeStartAt))) {

			// Check if the role exists locally
			const roleExists = this.plugin.data.roles.some((r: Role) => r.id === syncData.state.activeRoleId);
			if (roleExists) {
				this.plugin.data.state = { ...syncData.state };
			}
		}

		// Save merged data
		await this.plugin.savePluginData();

		// Refresh UI
		this.plugin.updateStatusBar();
		this.plugin.updateWorkspaceBorder();
		this.plugin.refreshSidePanel();
	}

	// ====================
	// UTILITY METHODS
	// ====================

	private generateId(): string {
		return Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
	}

	private async generateDeviceId(): Promise<string> {
		const deviceId = Math.random().toString(36).substring(2, 15) +
						Math.random().toString(36).substring(2, 15);
		this.plugin.data.settings.deviceId = deviceId;
		await this.plugin.savePluginData();
		return deviceId;
	}

	// ====================
	// SYNC STATUS
	// ====================

	getSyncStatus(): {
		isAutoSyncEnabled: boolean;
		activeEndpoints: number;
		lastSyncTimes: Record<string, string>;
	} {
		const activeEndpoints = this.plugin.data.syncEndpoints.filter((ep: SyncEndpoint) => ep.isActive);
		const lastSyncTimes: Record<string, string> = {};

		activeEndpoints.forEach((ep: SyncEndpoint) => {
			if (ep.lastSync) {
				lastSyncTimes[ep.name] = ep.lastSync;
			}
		});

		return {
			isAutoSyncEnabled: this.plugin.data.settings.enableSync,
			activeEndpoints: activeEndpoints.length,
			lastSyncTimes
		};
	}
}