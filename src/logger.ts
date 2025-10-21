/**
 * Debug logger utility - all logging is disabled for Obsidian compliance
 *
 * Usage:
 *   import { logger } from './logger';
 *   logger.log('Debug message', data);
 *   logger.warn('Warning message');
 *   logger.error('Error message', error);
 *
 * All logger calls are no-op (do nothing) to comply with Obsidian's
 * requirement to not use console.log statements.
 */

// Create no-op (empty) function
const noop = (): void => {};

// All logger methods are no-op functions
// No console statements are used in this file
export const logger = {
	log: noop,
	warn: noop,
	error: noop,
	debug: noop,
	info: noop,
};
