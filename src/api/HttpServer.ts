// HTTP Server implementation for RoleSwitch API
// Handles REST API requests and routes them to the appropriate API methods

import { RoleSwitchApi, ApiResponse, CreateRoleRequest, UpdateRoleRequest, AddNoteRequest, UpdateNoteRequest, SyncData } from './ApiInterface';
import { AuthService } from './AuthService';
import { ApiPermission, ApiKey } from '../types';

export interface HttpRequest {
	method: string;
	url: string;
	headers: Record<string, string>;
	body?: unknown;
	params?: Record<string, string>;
	query?: Record<string, string>;
	apiKey?: ApiKey;
}

export interface HttpResponse {
	statusCode: number;
	headers: Record<string, string>;
	body: unknown;
}

export class RoleSwitchHttpServer {
	private api: RoleSwitchApi;
	private auth: AuthService;
	private routes: Map<string, {
		handler: (req: HttpRequest) => HttpResponse;
		permission?: ApiPermission;
	}>;

	constructor(api: RoleSwitchApi, auth: AuthService) {
		this.api = api;
		this.auth = auth;
		this.routes = new Map();
		this.setupRoutes();
	}

	private setupRoutes(): void {
		// Status endpoints (read permission)
		this.routes.set('GET /api/status', {
			handler: this.handleGetStatus.bind(this),
			permission: 'read'
		});

		// Authentication endpoints (admin permission)
		this.routes.set('POST /api/auth/keys', {
			handler: this.handleCreateApiKey.bind(this),
			permission: 'admin'
		});
		this.routes.set('GET /api/auth/keys', {
			handler: this.handleGetApiKeys.bind(this),
			permission: 'admin'
		});
		this.routes.set('PUT /api/auth/keys/:id', {
			handler: this.handleUpdateApiKey.bind(this),
			permission: 'admin'
		});
		this.routes.set('DELETE /api/auth/keys/:id', {
			handler: this.handleDeleteApiKey.bind(this),
			permission: 'admin'
		});

		// Role endpoints
		this.routes.set('GET /api/roles', {
			handler: this.handleGetRoles.bind(this),
			permission: 'read'
		});
		this.routes.set('GET /api/roles/:id', {
			handler: this.handleGetRole.bind(this),
			permission: 'read'
		});
		this.routes.set('POST /api/roles', {
			handler: this.handleCreateRole.bind(this),
			permission: 'write'
		});
		this.routes.set('PUT /api/roles/:id', {
			handler: this.handleUpdateRole.bind(this),
			permission: 'write'
		});
		this.routes.set('DELETE /api/roles/:id', {
			handler: this.handleDeleteRole.bind(this),
			permission: 'write'
		});

		// Session endpoints
		this.routes.set('POST /api/sessions/start', {
			handler: this.handleStartSession.bind(this),
			permission: 'write'
		});
		this.routes.set('POST /api/sessions/switch', {
			handler: this.handleSwitchSession.bind(this),
			permission: 'write'
		});
		this.routes.set('POST /api/sessions/end', {
			handler: this.handleEndSession.bind(this),
			permission: 'write'
		});
		this.routes.set('GET /api/sessions', {
			handler: this.handleGetSessions.bind(this),
			permission: 'read'
		});

		// Notes endpoints
		this.routes.set('POST /api/notes', {
			handler: this.handleAddNote.bind(this),
			permission: 'write'
		});
		this.routes.set('PUT /api/notes/:id', {
			handler: this.handleUpdateNote.bind(this),
			permission: 'write'
		});
		this.routes.set('DELETE /api/notes/:id', {
			handler: this.handleDeleteNote.bind(this),
			permission: 'write'
		});

		// Events endpoints
		this.routes.set('GET /api/events', {
			handler: this.handleGetEvents.bind(this),
			permission: 'read'
		});

		// Analytics endpoints
		this.routes.set('GET /api/analytics', {
			handler: this.handleGetAnalytics.bind(this),
			permission: 'read'
		});

		// Sync endpoints
		this.routes.set('POST /api/sync/push', {
			handler: this.handleSyncPush.bind(this),
			permission: 'write'
		});
		this.routes.set('GET /api/sync/pull', {
			handler: this.handleSyncPull.bind(this),
			permission: 'read'
		});
		this.routes.set('POST /api/sync/bidirectional', {
			handler: this.handleSyncBidirectional.bind(this),
			permission: 'write'
		});
	}

	// Route handler method
	handleRequest(req: HttpRequest): HttpResponse {
		try {
			// Add CORS headers
			const corsHeaders = {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Timestamp, X-Signature',
				'Content-Type': 'application/json'
			};

			// Handle preflight OPTIONS requests
			if (req.method === 'OPTIONS') {
				return {
					statusCode: 200,
					headers: corsHeaders,
					body: null
				};
			}

			// Extract route pattern
			const routeKey = `${req.method} ${this.extractRoutePath(req.url)}`;
			const route = this.routes.get(routeKey);

			if (!route) {
				return {
					statusCode: 404,
					headers: corsHeaders,
					body: { success: false, error: 'Endpoint not found' }
				};
			}

			// Authentication check
			if (route.permission) {
				const authResult = this.auth.authenticateRequest(req.headers, route.permission);
				if (!authResult.isAuthenticated) {
					return {
						statusCode: 401,
						headers: corsHeaders,
						body: { success: false, error: authResult.error || 'Authentication required' }
					};
				}
				req.apiKey = authResult.apiKey;
			}

			// Extract path parameters
			req.params = this.extractPathParams(req.url, routeKey);
			req.query = this.extractQueryParams(req.url);

			const response = route.handler(req);
			response.headers = { ...corsHeaders, ...response.headers };

			return response;

		} catch (error) {
			return {
				statusCode: 500,
				headers: { 'Content-Type': 'application/json' },
				body: { success: false, error: `Internal server error: ${error}` }
			};
		}
	}

	private extractRoutePath(url: string): string {
		const path = url.split('?')[0];
		return path.replace(/\/[^/]+/g, (match) => {
			// Replace ID segments with parameter placeholders
			if (/^\/[a-f0-9-]{36}$/i.test(match) || /^\/\d+$/.test(match)) {
				return '/:id';
			}
			return match;
		});
	}

	private extractPathParams(url: string, routeKey: string): Record<string, string> {
		const params: Record<string, string> = {};
		const urlParts = url.split('?')[0].split('/');
		const routeParts = routeKey.split(' ')[1].split('/');

		for (let i = 0; i < routeParts.length; i++) {
			if (routeParts[i].startsWith(':')) {
				const paramName = routeParts[i].substring(1);
				params[paramName] = urlParts[i];
			}
		}

		return params;
	}

	private extractQueryParams(url: string): Record<string, string> {
		const query: Record<string, string> = {};
		const queryString = url.split('?')[1];

		if (queryString) {
			queryString.split('&').forEach(param => {
				const [key, value] = param.split('=');
				query[decodeURIComponent(key)] = decodeURIComponent(value || '');
			});
		}

		return query;
	}

	private createResponse(apiResponse: ApiResponse, statusCode: number = 200): HttpResponse {
		return {
			statusCode: apiResponse.success ? statusCode : 400,
			headers: {},
			body: apiResponse
		};
	}

	// ====================
	// ROUTE HANDLERS
	// ====================

	private handleGetStatus(req: HttpRequest): HttpResponse {
		const result = this.api.getStatus();
		return this.createResponse(result);
	}

	private handleGetRoles(req: HttpRequest): HttpResponse {
		const result = this.api.getRoles();
		return this.createResponse(result);
	}

	private handleGetRole(req: HttpRequest): HttpResponse {
		const roleId = req.params?.id;
		if (!roleId) {
			return this.createResponse({ success: false, error: 'Role ID is required' });
		}

		const result = this.api.getRole(roleId);
		return this.createResponse(result);
	}

	private handleCreateRole(req: HttpRequest): HttpResponse {
		if (!req.body) {
			return this.createResponse({ success: false, error: 'Request body is required' });
		}

		const result = this.api.createRole(req.body as CreateRoleRequest);
		return this.createResponse(result, 201);
	}

	private handleUpdateRole(req: HttpRequest): HttpResponse {
		const roleId = req.params?.id;
		if (!roleId) {
			return this.createResponse({ success: false, error: 'Role ID is required' });
		}

		if (!req.body) {
			return this.createResponse({ success: false, error: 'Request body is required' });
		}

		const result = this.api.updateRole(roleId, req.body as UpdateRoleRequest);
		return this.createResponse(result);
	}

	private handleDeleteRole(req: HttpRequest): HttpResponse {
		const roleId = req.params?.id;
		if (!roleId) {
			return this.createResponse({ success: false, error: 'Role ID is required' });
		}

		const result = this.api.deleteRole(roleId);
		return this.createResponse(result);
	}

	private handleStartSession(req: HttpRequest): HttpResponse {
		const { roleId } = (req.body as { roleId?: string }) || {};
		if (!roleId) {
			return this.createResponse({ success: false, error: 'Role ID is required' });
		}

		const result = this.api.startSession(roleId);
		return this.createResponse(result);
	}

	private handleSwitchSession(req: HttpRequest): HttpResponse {
		const { roleId } = (req.body as { roleId?: string }) || {};
		if (!roleId) {
			return this.createResponse({ success: false, error: 'Role ID is required' });
		}

		const result = this.api.switchSession(roleId);
		return this.createResponse(result);
	}

	private handleEndSession(req: HttpRequest): HttpResponse {
		const result = this.api.endSession();
		return this.createResponse(result);
	}

	private handleGetSessions(req: HttpRequest): HttpResponse {
		const filters = {
			startDate: req.query?.startDate,
			endDate: req.query?.endDate,
			roleId: req.query?.roleId
		};

		const result = this.api.getSessions(filters);
		return this.createResponse(result);
	}

	private handleAddNote(req: HttpRequest): HttpResponse {
		if (!req.body) {
			return this.createResponse({ success: false, error: 'Request body is required' });
		}

		const result = this.api.addNote(req.body as AddNoteRequest);
		return this.createResponse(result, 201);
	}

	private handleUpdateNote(req: HttpRequest): HttpResponse {
		const noteId = req.params?.id;
		if (!noteId) {
			return this.createResponse({ success: false, error: 'Note ID is required' });
		}

		if (!req.body) {
			return this.createResponse({ success: false, error: 'Request body is required' });
		}

		const result = this.api.updateNote(noteId, req.body as UpdateNoteRequest);
		return this.createResponse(result);
	}

	private handleDeleteNote(req: HttpRequest): HttpResponse {
		const noteId = req.params?.id;
		if (!noteId) {
			return this.createResponse({ success: false, error: 'Note ID is required' });
		}

		const result = this.api.deleteNote(noteId);
		return this.createResponse(result);
	}

	private handleGetEvents(req: HttpRequest): HttpResponse {
		const typeValue = req.query?.type;
		const validTypes = ['start', 'end', 'switch', 'cancelTransition'];

		const filters = {
			startDate: req.query?.startDate,
			endDate: req.query?.endDate,
			roleId: req.query?.roleId,
			type: (typeValue && validTypes.includes(typeValue))
				? typeValue as 'start' | 'end' | 'switch' | 'cancelTransition'
				: undefined
		};

		const result = this.api.getEvents(filters);
		return this.createResponse(result);
	}

	private handleGetAnalytics(req: HttpRequest): HttpResponse {
		const filters = {
			startDate: req.query?.startDate,
			endDate: req.query?.endDate
		};

		const result = this.api.getAnalytics(filters);
		return this.createResponse(result);
	}

	// ====================
	// AUTHENTICATION HANDLERS
	// ====================

	private handleCreateApiKey(req: HttpRequest): HttpResponse {
		if (!req.body) {
			return this.createResponse({ success: false, error: 'Request body is required' });
		}

		const { name, permissions } = req.body as { name?: string; permissions?: ApiPermission[] };
		if (!name || !permissions) {
			return this.createResponse({ success: false, error: 'Name and permissions are required' });
		}

		try {
			const apiKey = this.auth.generateApiKey(name, permissions);
			return this.createResponse({ success: true, data: apiKey }, 201);
		} catch (error) {
			return this.createResponse({ success: false, error: `Failed to create API key: ${error}` });
		}
	}

	private handleGetApiKeys(req: HttpRequest): HttpResponse {
		try {
			const apiKeys = this.auth.getApiKeys();
			return this.createResponse({ success: true, data: apiKeys });
		} catch (error) {
			return this.createResponse({ success: false, error: `Failed to get API keys: ${error}` });
		}
	}

	private handleUpdateApiKey(req: HttpRequest): HttpResponse {
		const keyId = req.params?.id;
		if (!keyId) {
			return this.createResponse({ success: false, error: 'API key ID is required' });
		}

		if (!req.body) {
			return this.createResponse({ success: false, error: 'Request body is required' });
		}

		try {
			this.auth.updateApiKey(keyId, req.body as Partial<Omit<ApiKey, 'id' | 'key' | 'secret' | 'createdAt'>>);
			return this.createResponse({ success: true, message: 'API key updated successfully' });
		} catch (error) {
			return this.createResponse({ success: false, error: `Failed to update API key: ${error}` });
		}
	}

	private handleDeleteApiKey(req: HttpRequest): HttpResponse {
		const keyId = req.params?.id;
		if (!keyId) {
			return this.createResponse({ success: false, error: 'API key ID is required' });
		}

		try {
			this.auth.deleteApiKey(keyId);
			return this.createResponse({ success: true, message: 'API key deleted successfully' });
		} catch (error) {
			return this.createResponse({ success: false, error: `Failed to delete API key: ${error}` });
		}
	}

	// ====================
	// SYNC HANDLERS
	// ====================

	private handleSyncPush(req: HttpRequest): HttpResponse {
		if (!req.body) {
			return this.createResponse({ success: false, error: 'Request body is required' });
		}

		try {
			const result = this.api.handleSyncPush(req.body as SyncData);
			return this.createResponse(result);
		} catch (error) {
			return this.createResponse({ success: false, error: `Sync push failed: ${error}` });
		}
	}

	private handleSyncPull(req: HttpRequest): HttpResponse {
		try {
			const filters = {
				since: req.query?.since,
				deviceId: req.query?.deviceId
			};
			const result = this.api.handleSyncPull(filters);
			return this.createResponse(result);
		} catch (error) {
			return this.createResponse({ success: false, error: `Sync pull failed: ${error}` });
		}
	}

	private handleSyncBidirectional(req: HttpRequest): HttpResponse {
		if (!req.body) {
			return this.createResponse({ success: false, error: 'Request body is required' });
		}

		try {
			const result = this.api.handleSyncBidirectional(req.body as SyncData);
			return this.createResponse(result);
		} catch (error) {
			return this.createResponse({ success: false, error: `Bidirectional sync failed: ${error}` });
		}
	}
}