// Icon Library - Contains all SVG icons and rendering utilities

import { Platform } from 'obsidian';

export class IconLibrary {
	static readonly ICONS: { [key: string]: string } = {
		'A': `<svg viewBox="0 0 24 24" fill="currentColor"><text x="12" y="18" text-anchor="middle" font-size="18" font-weight="bold" font-family="Arial, sans-serif">A</text></svg>`,
		'B': `<svg viewBox="0 0 24 24" fill="currentColor"><text x="12" y="18" text-anchor="middle" font-size="18" font-weight="bold" font-family="Arial, sans-serif">B</text></svg>`,
		'C': `<svg viewBox="0 0 24 24" fill="currentColor"><text x="12" y="18" text-anchor="middle" font-size="18" font-weight="bold" font-family="Arial, sans-serif">C</text></svg>`,
		'D': `<svg viewBox="0 0 24 24" fill="currentColor"><text x="12" y="18" text-anchor="middle" font-size="18" font-weight="bold" font-family="Arial, sans-serif">D</text></svg>`,
		'E': `<svg viewBox="0 0 24 24" fill="currentColor"><text x="12" y="18" text-anchor="middle" font-size="18" font-weight="bold" font-family="Arial, sans-serif">E</text></svg>`,
		'F': `<svg viewBox="0 0 24 24" fill="currentColor"><text x="12" y="18" text-anchor="middle" font-size="18" font-weight="bold" font-family="Arial, sans-serif">F</text></svg>`,
		'G': `<svg viewBox="0 0 24 24" fill="currentColor"><text x="12" y="18" text-anchor="middle" font-size="18" font-weight="bold" font-family="Arial, sans-serif">G</text></svg>`,
		'H': `<svg viewBox="0 0 24 24" fill="currentColor"><text x="12" y="18" text-anchor="middle" font-size="18" font-weight="bold" font-family="Arial, sans-serif">H</text></svg>`,
		'I': `<svg viewBox="0 0 24 24" fill="currentColor"><text x="12" y="18" text-anchor="middle" font-size="18" font-weight="bold" font-family="Arial, sans-serif">I</text></svg>`,
		'J': `<svg viewBox="0 0 24 24" fill="currentColor"><text x="12" y="18" text-anchor="middle" font-size="18" font-weight="bold" font-family="Arial, sans-serif">J</text></svg>`,
		'K': `<svg viewBox="0 0 24 24" fill="currentColor"><text x="12" y="18" text-anchor="middle" font-size="18" font-weight="bold" font-family="Arial, sans-serif">K</text></svg>`,
		'L': `<svg viewBox="0 0 24 24" fill="currentColor"><text x="12" y="18" text-anchor="middle" font-size="18" font-weight="bold" font-family="Arial, sans-serif">L</text></svg>`,
		'M': `<svg viewBox="0 0 24 24" fill="currentColor"><text x="12" y="18" text-anchor="middle" font-size="18" font-weight="bold" font-family="Arial, sans-serif">M</text></svg>`,
		'N': `<svg viewBox="0 0 24 24" fill="currentColor"><text x="12" y="18" text-anchor="middle" font-size="18" font-weight="bold" font-family="Arial, sans-serif">N</text></svg>`,
		'O': `<svg viewBox="0 0 24 24" fill="currentColor"><text x="12" y="18" text-anchor="middle" font-size="18" font-weight="bold" font-family="Arial, sans-serif">O</text></svg>`,
		'P': `<svg viewBox="0 0 24 24" fill="currentColor"><text x="12" y="18" text-anchor="middle" font-size="18" font-weight="bold" font-family="Arial, sans-serif">P</text></svg>`,
		'Q': `<svg viewBox="0 0 24 24" fill="currentColor"><text x="12" y="18" text-anchor="middle" font-size="18" font-weight="bold" font-family="Arial, sans-serif">Q</text></svg>`,
		'R': `<svg viewBox="0 0 24 24" fill="currentColor"><text x="12" y="18" text-anchor="middle" font-size="18" font-weight="bold" font-family="Arial, sans-serif">R</text></svg>`,
		'S': `<svg viewBox="0 0 24 24" fill="currentColor"><text x="12" y="18" text-anchor="middle" font-size="18" font-weight="bold" font-family="Arial, sans-serif">S</text></svg>`,
		'T': `<svg viewBox="0 0 24 24" fill="currentColor"><text x="12" y="18" text-anchor="middle" font-size="18" font-weight="bold" font-family="Arial, sans-serif">T</text></svg>`,
		'U': `<svg viewBox="0 0 24 24" fill="currentColor"><text x="12" y="18" text-anchor="middle" font-size="18" font-weight="bold" font-family="Arial, sans-serif">U</text></svg>`,
		'V': `<svg viewBox="0 0 24 24" fill="currentColor"><text x="12" y="18" text-anchor="middle" font-size="18" font-weight="bold" font-family="Arial, sans-serif">V</text></svg>`,
		'W': `<svg viewBox="0 0 24 24" fill="currentColor"><text x="12" y="18" text-anchor="middle" font-size="18" font-weight="bold" font-family="Arial, sans-serif">W</text></svg>`,
		'X': `<svg viewBox="0 0 24 24" fill="currentColor"><text x="12" y="18" text-anchor="middle" font-size="18" font-weight="bold" font-family="Arial, sans-serif">X</text></svg>`,
		'Y': `<svg viewBox="0 0 24 24" fill="currentColor"><text x="12" y="18" text-anchor="middle" font-size="18" font-weight="bold" font-family="Arial, sans-serif">Y</text></svg>`,
		'Z': `<svg viewBox="0 0 24 24" fill="currentColor"><text x="12" y="18" text-anchor="middle" font-size="18" font-weight="bold" font-family="Arial, sans-serif">Z</text></svg>`
	};

	static getIcon(iconKey: string): string {
		return this.ICONS[iconKey] || this.ICONS['A'];
	}

	static renderIcon(iconKey: string, size: number = 24, color: string = 'currentColor'): string {
		const svg = this.getIcon(iconKey);
		return svg.replace('fill="currentColor"', `fill="${color}"`).replace('viewBox="0 0 24 24"', `viewBox="0 0 24 24" width="${size}" height="${size}"`);
	}

	static createIconElement(iconKey: string, size: number = 24, color: string = 'currentColor'): HTMLElement {
		const container = document.createElement('div');
		container.addClass('icon-element-container');
		container.setCssProps({
			'width': size + 'px',
			'height': size + 'px'
		});

		// Use DOMParser for safe SVG parsing on all platforms
		const iconSvg = this.getIcon(iconKey);

		if (iconSvg) {
			try {
				// Parse SVG string using DOMParser (safe from XSS)
				const parser = new DOMParser();
				const doc = parser.parseFromString(iconSvg, 'image/svg+xml');
				const svg = doc.querySelector('svg');

				if (svg) {
					// Set attributes safely
					svg.setAttribute('width', size.toString());
					svg.setAttribute('height', size.toString());
					svg.setAttribute('fill', color);

					// Import and add the SVG node to container
					const importedSvg = document.importNode(svg, true);
					container.appendChild(importedSvg);
				} else {
					container.textContent = iconKey.charAt(0).toUpperCase();
					container.addClass('icon-fallback-text');
					container.setCssProps({
						'color': color,
						'font-size': (size * 0.6) + 'px'
					});
				}
			} catch (error) {
				container.textContent = iconKey.charAt(0).toUpperCase();
				container.addClass('icon-fallback-text');
				container.setCssProps({
					'color': color,
					'font-size': (size * 0.6) + 'px'
				});
			}
		} else {
			// Fallback text for missing icons
			container.textContent = iconKey.charAt(0).toUpperCase();
			container.addClass('icon-fallback-text');
			container.setCssProps({
				'color': color,
				'font-size': (size * 0.6) + 'px'
			});
		}

		return container;
	}

	static getAllIcons(): string[] {
		return Object.keys(this.ICONS);
	}

	static getIconsByCategory(): { [category: string]: string[] } {
		return {
			'A-G': ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
			'H-N': ['H', 'I', 'J', 'K', 'L', 'M', 'N'],
			'O-U': ['O', 'P', 'Q', 'R', 'S', 'T', 'U'],
			'V-Z': ['V', 'W', 'X', 'Y', 'Z']
		};
	}
}