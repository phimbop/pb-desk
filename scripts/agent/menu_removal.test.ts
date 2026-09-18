import { describe, expect, it } from 'bun:test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const rootDir = path.resolve(__dirname, '../..');

describe('Remove Electron Default Menu Bar', () => {
	it('R1: electron/main.ts disables native application menu bar and configures BrowserWindow', () => {
		const mainTsPath = path.join(rootDir, 'electron/main.ts');
		expect(fs.existsSync(mainTsPath)).toBe(true);

		const mainContent = fs.readFileSync(mainTsPath, 'utf-8');

		// 1. Menu.setApplicationMenu(null) must be invoked to disable the global default menu
		expect(mainContent).toContain('Menu.setApplicationMenu(null)');

		// 2. BrowserWindow options should set autoHideMenuBar: true to ensure no space or Alt key reveals the menu
		expect(mainContent).toContain('autoHideMenuBar: true');

		// 3. mainWindow.setMenu(null) or removeMenu() explicitly invoked on window
		const hasWindowMenuRemoval =
			mainContent.includes('mainWindow.setMenu(null)') || mainContent.includes('mainWindow.removeMenu()');
		expect(hasWindowMenuRemoval).toBe(true);
	});

	it('R2: Bundled electron dist main.cjs reflects menu removal', () => {
		const distMainPath = path.join(rootDir, 'electron/dist/main.cjs');
		expect(fs.existsSync(distMainPath)).toBe(true);

		const distContent = fs.readFileSync(distMainPath, 'utf-8');
		expect(distContent).toContain('setApplicationMenu(null)');
		expect(distContent).toContain('autoHideMenuBar: true');
	});
});
