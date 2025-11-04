// Utility functions for RoleSwitch plugin

import { Session, RoleSwitchEvent, Note } from './types';

export class Utils {
	/**
	 * Generate a unique ID
	 */
	static generateId(): string {
		return Math.random().toString(36).substring(2, 9);
	}

	/**
	 * Format duration in a human readable way
	 */
	static formatDuration(minutes: number): string {
		if (minutes < 60) {
			return `${Math.round(minutes)}min`;
		}
		
		const hours = Math.floor(minutes / 60);
		const remainingMinutes = Math.round(minutes % 60);
		
		if (remainingMinutes === 0) {
			return `${hours}h`;
		}
		
		return `${hours}h ${remainingMinutes}min`;
	}

	/**
	 * Format time as HH:MM
	 */
	static formatTime(date: Date): string {
		return date.toLocaleTimeString('en', { 
			hour: '2-digit', 
			minute: '2-digit',
			hour12: false 
		});
	}

	/**
	 * Get start of day for a given date
	 */
	static getStartOfDay(date: Date = new Date()): Date {
		const startOfDay = new Date(date);
		startOfDay.setHours(0, 0, 0, 0);
		return startOfDay;
	}

	/**
	 * Get start of week for a given date (Sunday = 0)
	 */
	static getStartOfWeek(date: Date = new Date()): Date {
		const startOfWeek = new Date(date);
		startOfWeek.setDate(date.getDate() - date.getDay());
		startOfWeek.setHours(0, 0, 0, 0);
		return startOfWeek;
	}

	/**
	 * Get start of month for a given date
	 */
	static getStartOfMonth(date: Date = new Date()): Date {
		return new Date(date.getFullYear(), date.getMonth(), 1);
	}

	/**
	 * Calculate session duration in minutes
	 */
	static calculateSessionDuration(session: Session, activeSessionId?: string): number {
		if (session.endAt) {
			return (new Date(session.endAt).getTime() - new Date(session.startAt).getTime()) / (1000 * 60);
		} else if (session.id === activeSessionId) {
			return (Date.now() - new Date(session.startAt).getTime()) / (1000 * 60);
		}
		return 0;
	}

	/**
	 * Derive sessions from events
	 */
	static deriveSessionsFromEvents(
		events: RoleSwitchEvent[], 
		startDate?: Date, 
		endDate?: Date
	): Session[] {
		const sessions: Session[] = [];
		const sortedEvents = events.slice().sort((a, b) => 
			new Date(a.at).getTime() - new Date(b.at).getTime()
		);
		
		let currentSession: Partial<Session> | null = null;
		
		for (const event of sortedEvents) {
			const eventTime = new Date(event.at);
			
			// Filter by date range if provided
			if (startDate && eventTime < startDate) continue;
			if (endDate && eventTime > endDate) continue;
			
			switch (event.type) {
				case 'start':
					currentSession = {
						id: event.meta?.sessionId || Utils.generateId(),
						roleId: event.roleId,
						startAt: event.at,
						notes: []
					};
					break;
					
				case 'end':
					if (currentSession && currentSession.roleId === event.roleId) {
						sessions.push({
							...currentSession,
							endAt: event.at
						} as Session);
						currentSession = null;
					}
					break;
					
				case 'switch':
					// End current session and start new one
					if (currentSession) {
						sessions.push({
							...currentSession,
							endAt: event.at
						} as Session);
					}
					currentSession = {
						id: event.meta?.sessionId || Utils.generateId(),
						roleId: event.roleId,
						startAt: event.at,
						notes: []
					};
					break;
			}
		}
		
		// Add current ongoing session if exists
		if (currentSession && currentSession.startAt) {
			sessions.push(currentSession as Session);
		}
		
		return sessions;
	}

	/**
	 * Get sessions for a specific date range with duration calculations
	 */
	static getSessionsWithDurations(
		events: RoleSwitchEvent[],
		startDate?: Date,
		endDate?: Date,
		activeSessionId?: string
	): Array<Session & { durationMinutes: number }> {
		const sessions = Utils.deriveSessionsFromEvents(events, startDate, endDate);
		
		return sessions.map(session => ({
			...session,
			durationMinutes: Utils.calculateSessionDuration(session, activeSessionId)
		}));
	}

	/**
	 * Calculate analytics for sessions
	 */
	static calculateAnalytics(sessions: Array<Session & { durationMinutes: number }>) {
		const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
		const switchCount = sessions.length;
		const avgSessionDuration = switchCount > 0 ? totalMinutes / switchCount : 0;
		
		// Group by role
		const roleStats: { [roleId: string]: { totalMinutes: number; sessionCount: number } } = {};
		
		sessions.forEach(session => {
			if (!roleStats[session.roleId]) {
				roleStats[session.roleId] = { totalMinutes: 0, sessionCount: 0 };
			}
			roleStats[session.roleId].totalMinutes += session.durationMinutes;
			roleStats[session.roleId].sessionCount += 1;
		});
		
		return {
			totalMinutes,
			switchCount,
			avgSessionDuration,
			roleStats
		};
	}

	/**
	 * Export sessions to CSV format
	 */
	static exportToCSV(sessions: Session[], notes: Note[] = []): string {
		const headers = ['Date', 'Start Time', 'End Time', 'Duration (min)', 'Role ID', 'Session ID', 'Notes'];
		const rows = [headers];
		
		sessions.forEach(session => {
			const startDate = new Date(session.startAt);
			const endDate = session.endAt ? new Date(session.endAt) : null;
			const duration = endDate ? 
				Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60)) : 
				'Ongoing';
			
			const sessionNotes = notes.filter(n => session.notes.some(sn => sn.id === n.id));
			const notesText = sessionNotes.map(n => n.text).join('; ');
			
			rows.push([
				startDate.toLocaleDateString(),
				Utils.formatTime(startDate),
				endDate ? Utils.formatTime(endDate) : 'Ongoing',
				duration.toString(),
				session.roleId,
				session.id,
				notesText
			]);
		});
		
		return rows.map(row => 
			row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
		).join('\n');
	}

	/**
	 * Export sessions to JSON format
	 */
	static exportToJSON(sessions: Session[], notes: Note[] = []): string {
		const data = {
			exportDate: new Date().toISOString(),
			sessions: sessions.map(session => ({
				...session,
				notes: notes.filter(n => session.notes.some(sn => sn.id === n.id))
			}))
		};
		
		return JSON.stringify(data, null, 2);
	}

	/**
	 * Debounce function to limit rapid calls
	 */
	static debounce<T extends (...args: any[]) => void>(
		func: T,
		wait: number
	): (...args: Parameters<T>) => void {
		let timeout: NodeJS.Timeout;
		
		return (...args: Parameters<T>) => {
			clearTimeout(timeout);
			timeout = setTimeout(() => func(...args), wait);
		};
	}

	/**
	 * Validate hex color
	 */
	static isValidHexColor(color: string): boolean {
		return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
	}

	/**
	 * Generate a random hex color
	 */
	static generateRandomColor(): string {
		const colors = [
			'#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
			'#1abc9c', '#34495e', '#e67e22', '#8e44ad', '#27ae60',
			'#2980b9', '#f1c40f', '#d35400', '#c0392b', '#16a085'
		];
		return colors[Math.floor(Math.random() * colors.length)];
	}
}