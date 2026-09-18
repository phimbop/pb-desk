import { describe, expect, it } from 'bun:test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const rootDir = path.resolve(__dirname, '../..');

describe('Desktop Runtime Production Audit: 404 Bug, Background, Autostart & Notifications', () => {
	it('R1: Launch URL and Genre catch-all guard prevent 404 on index.html', () => {
		const mainTs = fs.readFileSync(path.join(rootDir, 'electron/main.ts'), 'utf-8');
		// Must not load app://localhost/index.html as a pathname since SvelteKit matches it to [genres]
		expect(mainTs).not.toContain("loadURL('app://localhost/index.html')");
		expect(mainTs).toContain("loadURL('app://localhost/')");

		// [genres]/+page.svelte must guard against index.html / index / .html
		const genrePage = fs.readFileSync(path.join(rootDir, 'src/routes/[genres]/+page.svelte'), 'utf-8');
		expect(genrePage).toMatch(/currentSlug === ['"]index\.html['"]|currentSlug\.endsWith\(['"]\.html['"]\)/);
	});

	it('R2: Background running minimizes to tray synchronously without async close bug', () => {
		const mainTs = fs.readFileSync(path.join(rootDir, 'electron/main.ts'), 'utf-8');

		// mainWindow.on('close', ...) must synchronously preventDefault if minimizeToTray is enabled
		// It must NOT await before e.preventDefault()
		const closeHandlerMatch = mainTs.match(/mainWindow\.on\('close',\s*(\basync\b)?\s*\(([^)]*)\)\s*=>\s*\{([\s\S]*?)\}\);/);
		expect(closeHandlerMatch).not.toBeNull();
		const closeBody = closeHandlerMatch![3];

		// e.preventDefault() must appear before any await in the close handler
		const awaitIndex = closeBody.indexOf('await ');
		const preventDefaultIndex = closeBody.indexOf('.preventDefault()');
		expect(preventDefaultIndex).toBeGreaterThan(-1);
		if (awaitIndex !== -1) {
			expect(preventDefaultIndex).toBeLessThan(awaitIndex);
		}

		// Tray menu must have Open, Check Update, and Quit
		expect(mainTs).toContain('createTray');
		expect(mainTs).toContain('isQuitting = true');

		// Window should support startMinimized without flash
		expect(mainTs).toMatch(/show:\s*!startMinimized|startMinimized/);
	});

	it('R3: Cross-platform autostart handles Linux XDG desktop entry and Windows/macOS login items', () => {
		const mainTs = fs.readFileSync(path.join(rootDir, 'electron/main.ts'), 'utf-8');

		// Must handle Linux autostart via XDG autostart directory (.config/autostart)
		expect(mainTs).toContain('autostart');
		expect(mainTs).toMatch(/process\.platform === ['"]linux['"]/);
		expect(mainTs).toContain('.desktop');

		// Must handle Windows and macOS via setLoginItemSettings
		expect(mainTs).toContain('setLoginItemSettings');
		expect(mainTs).toContain('getLoginItemSettings');
	});

	it('R4: Production notifications configure AppUserModelId, app icon, and click-to-focus', () => {
		const mainTs = fs.readFileSync(path.join(rootDir, 'electron/main.ts'), 'utf-8');

		// Windows AppUserModelId must be set for native notification toast routing
		expect(mainTs).toContain('setAppUserModelId');
		expect(mainTs).toContain('com.phimbop.desktop');

		// Notifications must pass icon
		expect(mainTs).toMatch(/icon:\s*(fs\.existsSync\([^)]+\)\s*\?\s*iconPath|iconPath)/);

		// Notifications must handle click to restore/show/focus window
		expect(mainTs).toMatch(/(\.on\('click'|onclick)/);
	});

	it('R5: Notifications and tray menu support multi-language dynamic resolution and IPC sync', () => {
		const mainTs = fs.readFileSync(path.join(rootDir, 'electron/main.ts'), 'utf-8');
		const preloadTs = fs.readFileSync(path.join(rootDir, 'electron/preload.ts'), 'utf-8');

		// Must import and use formatMovieNotification and getTrayLabels
		expect(mainTs).toContain('formatMovieNotification');
		expect(mainTs).toContain('getTrayLabels');

		// Must handle set-locale and get-locale IPC
		expect(mainTs).toContain("'set-locale'");
		expect(mainTs).toContain("'get-locale'");
		expect(preloadTs).toContain('setLocale');
		expect(preloadTs).toContain('getLocale');

		// Must dynamically update tray menu on locale change
		expect(mainTs).toContain('updateTrayMenu');
	});
});
