// Authentication Service for RoleSwitch API
// Handles API key generation, validation, and authentication

import { ApiKey, ApiPermission } from '../types';
import { Utils } from '../utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class AuthService {
	private plugin: any;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	constructor(plugin: any) {
		this.plugin = plugin;
	}

	// ====================
	// API KEY MANAGEMENT
	// ====================

	generateApiKey(name: string, permissions: ApiPermission[]): ApiKey {
		const apiKey: ApiKey = {
			id: Utils.generateId(),
			name,
			key: this.generateRandomKey(32),
			secret: this.generateRandomKey(64),
			createdAt: new Date().toISOString(),
			permissions,
			isActive: true
		};

		this.plugin.data.apiKeys.push(apiKey);
		this.plugin.savePluginData();

		return apiKey;
	}

	private generateRandomKey(length: number): string {
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		let result = '';
		for (let i = 0; i < length; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return result;
	}

	updateApiKey(keyId: string, updates: Partial<Omit<ApiKey, 'id' | 'key' | 'secret' | 'createdAt'>>): void {
		const apiKey = this.plugin.data.apiKeys.find((key: ApiKey) => key.id === keyId);
		if (!apiKey) {
			throw new Error('API key not found');
		}

		Object.assign(apiKey, updates);
		this.plugin.savePluginData();
	}

	deleteApiKey(keyId: string): void {
		this.plugin.data.apiKeys = this.plugin.data.apiKeys.filter((key: ApiKey) => key.id !== keyId);
		this.plugin.savePluginData();
	}

	getApiKeys(): ApiKey[] {
		// Return keys without secrets for security
		return this.plugin.data.apiKeys.map((key: ApiKey) => ({
			...key,
			secret: '***HIDDEN***'
		}));
	}

	getApiKey(keyId: string): ApiKey | null {
		return this.plugin.data.apiKeys.find((key: ApiKey) => key.id === keyId) || null;
	}

	// ====================
	// AUTHENTICATION
	// ====================

	validateApiKey(providedKey: string, requiredPermission?: ApiPermission): ApiKey | null {
		if (!this.plugin.data.settings.enableAuthentication) {
			return null; // Authentication disabled
		}

		const apiKey = this.plugin.data.apiKeys.find((key: ApiKey) =>
			key.key === providedKey && key.isActive
		);

		if (!apiKey) {
			return null;
		}

		// Check permission if specified
		if (requiredPermission && !apiKey.permissions.includes(requiredPermission) && !apiKey.permissions.includes('admin')) {
			return null;
		}

		// Update last used timestamp
		apiKey.lastUsed = new Date().toISOString();
		this.plugin.savePluginData();

		return apiKey;
	}

	authenticateRequest(headers: Record<string, string>, requiredPermission?: ApiPermission): {
		isAuthenticated: boolean;
		apiKey?: ApiKey;
		error?: string
	} {
		// If authentication is disabled, allow all requests
		if (!this.plugin.data.settings.enableAuthentication) {
			return { isAuthenticated: true };
		}

		// Check for API key in headers
		const authHeader = headers['authorization'] || headers['Authorization'];
		const apiKeyHeader = headers['x-api-key'] || headers['X-API-Key'];

		let providedKey: string | null = null;

		if (authHeader && authHeader.startsWith('Bearer ')) {
			providedKey = authHeader.substring(7);
		} else if (apiKeyHeader) {
			providedKey = apiKeyHeader;
		}

		if (!providedKey) {
			return {
				isAuthenticated: false,
				error: 'API key required. Provide via Authorization: Bearer <key> or X-API-Key header'
			};
		}

		const apiKey = this.validateApiKey(providedKey, requiredPermission);
		if (!apiKey) {
			return {
				isAuthenticated: false,
				error: 'Invalid API key or insufficient permissions'
			};
		}

		return { isAuthenticated: true, apiKey };
	}

	// ====================
	// TWO-WAY AUTHENTICATION
	// ====================

	generateSignature(payload: string, secret: string): string {
		// Simple HMAC-like signature - in production, use proper crypto library
		let hash = 0;
		const combined = payload + secret;
		for (let i = 0; i < combined.length; i++) {
			const char = combined.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash; // Convert to 32-bit integer
		}
		return Math.abs(hash).toString(16);
	}

	verifySignature(payload: string, signature: string, secret: string): boolean {
		const expectedSignature = this.generateSignature(payload, secret);
		return expectedSignature === signature;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	createAuthenticatedRequest(apiKey: ApiKey, payload: any): {
		headers: Record<string, string>;
		body: string;
	} {
		const timestamp = Date.now().toString();
		const bodyString = JSON.stringify(payload);
		const signaturePayload = `${timestamp}${bodyString}`;
		const signature = this.generateSignature(signaturePayload, apiKey.secret);

		return {
			headers: {
				'Content-Type': 'application/json',
				'X-API-Key': apiKey.key,
				'X-Timestamp': timestamp,
				'X-Signature': signature
			},
			body: bodyString
		};
	}

	verifyAuthenticatedRequest(headers: Record<string, string>, body: string): {
		isValid: boolean;
		apiKey?: ApiKey;
		error?: string;
	} {
		const apiKeyHeader = headers['x-api-key'] || headers['X-API-Key'];
		const timestamp = headers['x-timestamp'] || headers['X-Timestamp'];
		const signature = headers['x-signature'] || headers['X-Signature'];

		if (!apiKeyHeader || !timestamp || !signature) {
			return {
				isValid: false,
				error: 'Missing authentication headers (X-API-Key, X-Timestamp, X-Signature)'
			};
		}

		const apiKey = this.plugin.data.apiKeys.find((key: ApiKey) =>
			key.key === apiKeyHeader && key.isActive
		);

		if (!apiKey) {
			return {
				isValid: false,
				error: 'Invalid API key'
			};
		}

		// Verify timestamp (prevent replay attacks)
		const requestTime = parseInt(timestamp);
		const currentTime = Date.now();
		const timeDiff = Math.abs(currentTime - requestTime);

		if (timeDiff > 300000) { // 5 minutes tolerance
			return {
				isValid: false,
				error: 'Request timestamp too old'
			};
		}

		// Verify signature
		const signaturePayload = `${timestamp}${body}`;
		if (!this.verifySignature(signaturePayload, signature, apiKey.secret)) {
			return {
				isValid: false,
				error: 'Invalid signature'
			};
		}

		// Update last used
		apiKey.lastUsed = new Date().toISOString();
		this.plugin.savePluginData();

		return { isValid: true, apiKey };
	}
}