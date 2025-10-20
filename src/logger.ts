/**
 * Debug logger utility that can be stripped from production builds
 *
 * Usage:
 *   import { logger } from './logger';
 *   logger.log('Debug message', data);
 *   logger.warn('Warning message');
 *   logger.error('Error message', error);
 *
 * In production builds, all logger calls are replaced with empty functions
 * to avoid polluting the console.
 */

const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
	log: (...args: unknown[]): void => {
		if (isDev) {
			console.log('[RoleSwitch]', ...args);
		}
	},

	warn: (...args: unknown[]): void => {
		if (isDev) {
			console.warn('[RoleSwitch]', ...args);
		}
	},

	error: (...args: unknown[]): void => {
		if (isDev) {
			console.error('[RoleSwitch]', ...args);
		}
	},

	debug: (...args: unknown[]): void => {
		if (isDev) {
			console.debug('[RoleSwitch]', ...args);
		}
	},

	info: (...args: unknown[]): void => {
		if (isDev) {
			console.info('[RoleSwitch]', ...args);
		}
	},
};
