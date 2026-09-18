import { describe, expect, it } from 'bun:test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const rootDir = path.resolve(__dirname, '../..');

describe('Desktop Auto-Updater Flow & Production Verification', () => {
	it('R1: Platform asset resolution extracts correct asset from platforms map', () => {
		const mainTs = fs.readFileSync(path.join(rootDir, 'electron/main.ts'), 'utf-8');

		// resolvePlatformAsset helper must exist
		expect(mainTs).toContain('resolvePlatformAsset');
		expect(mainTs).toContain('linux-x86_64-appimage');
		expect(mainTs).toContain('windows-x86_64-nsis');
		expect(mainTs).toContain('darwin-aarch64');

		// updater-check must call resolvePlatformAsset and map url and signature
		expect(mainTs).toContain('const asset = resolvePlatformAsset(data);');
		expect(mainTs).toContain('url: asset.url');
		expect(mainTs).toContain('signature: asset.signature');
		expect(mainTs).not.toMatch(/url:\s*data\.url,\s*signature:\s*data\.signature/);
	});

	it('R2: Streaming download with progress reporting via IPC', () => {
		const mainTs = fs.readFileSync(path.join(rootDir, 'electron/main.ts'), 'utf-8');
		const updaterTs = fs.readFileSync(path.join(rootDir, 'src/lib/services/updater.svelte.ts'), 'utf-8');
		const preloadTs = fs.readFileSync(path.join(rootDir, 'electron/preload.ts'), 'utf-8');

		// Main process must handle updater-download-install with streaming fetch
		expect(mainTs).toContain("ipcMain.handle('updater-download-install'");
		expect(mainTs).toContain("reader.read()");
		expect(mainTs).toContain("'updater-progress'");
		expect(mainTs).toContain('transferred');
		expect(mainTs).toContain('percent');

		// Preload must expose updater.downloadAndInstall
		expect(preloadTs).toContain("downloadAndInstall: (url?: string) => ipcRenderer.invoke('updater-download-install', url)");

		// Svelte updater service must listen for updater-progress and update progress & byte stats
		expect(updaterTs).toContain("'updater-progress'");
		expect(updaterTs).toContain('this.progress =');
		expect(updaterTs).toContain('this.downloadedBytes =');
		expect(updaterTs).toContain('this.totalBytes =');
		expect(updaterTs).toContain('downloadAndInstall(this.activeUpdate.url)');
	});

	it('R3: Robust binary replacement & relaunch handling per platform', () => {
		const mainTs = fs.readFileSync(path.join(rootDir, 'electron/main.ts'), 'utf-8');

		// updater-relaunch must handle Linux AppImage properly
		expect(mainTs).toContain("ipcMain.handle('updater-relaunch'");
		expect(mainTs).toContain('process.env.APPIMAGE');
		expect(mainTs).toContain('0o755'); // Chmod executable
		expect(mainTs).toMatch(/spawn\(\s*(targetExec|targetAppImage|execTarget)/);

		// Windows NSIS silent execution
		expect(mainTs).toContain("['/S', '--updated']");

		// macOS DMG opening
		expect(mainTs).toMatch(/shell\.openPath\(\s*filePath\s*\)/);
	});

	it('R4: Dynamic runtime version resolution instead of hardcoded strings', () => {
		const mainTs = fs.readFileSync(path.join(rootDir, 'electron/main.ts'), 'utf-8');
		const preloadTs = fs.readFileSync(path.join(rootDir, 'electron/preload.ts'), 'utf-8');
		const updaterTs = fs.readFileSync(path.join(rootDir, 'src/lib/services/updater.svelte.ts'), 'utf-8');
		const aboutPage = fs.readFileSync(path.join(rootDir, 'src/routes/settings/about/+page.svelte'), 'utf-8');

		// Main process exposes app-get-version
		expect(mainTs).toContain("ipcMain.handle('app-get-version'");
		expect(mainTs).toContain('app.getVersion()');

		// Preload exposes getAppVersion
		expect(preloadTs).toContain("getAppVersion: () => ipcRenderer.invoke('app-get-version')");

		// UpdaterService has dynamic currentVersion property
		expect(updaterTs).toContain('currentVersion = $state<string>');
		expect(updaterTs).toContain('getAppVersion');

		// About page displays dynamic updater.currentVersion
		expect(aboutPage).toContain('v{updater.currentVersion}');
	});
});
