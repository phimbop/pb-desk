import { app, BrowserWindow, ipcMain, Menu, net, Notification, protocol, session, shell, Tray } from 'electron';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';
import * as os from 'node:os';
import { pathToFileURL } from 'node:url';
import { formatMovieNotification, getTrayLabels, isSupportedLocale, normalizeLocale } from './i18n';

// Set Application User Model ID on Windows for native notifications
if (process.platform === 'win32') {
	app.setAppUserModelId('com.phimbop.desktop');
}

// Register custom protocol for local SPA assets before app is ready
protocol.registerSchemesAsPrivileged([
	{
		scheme: 'app',
		privileges: {
			standard: true,
			secure: true,
			supportFetchAPI: true,
			corsEnabled: true,
			allowServiceWorkers: true
		}
	}
]);

function isDevMode(): boolean {
	return !app.isPackaged && (process.env.ELECTRON_DEV === 'true' || process.argv.includes('--dev'));
}

const DEFAULT_SUPABASE_KEY =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oeGdkc2FueWtwbm1naHRvaGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTY1NjYzNTYsImV4cCI6MjAxMjE0MjM1Nn0._M573rGbATQfCvNRLqQHk7dCXSArLo6J_KI2M9HUBd0';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
let cachedMinimizeToTray = true;
let cachedLocale = 'vi';

function getLocaleFilePath(): string {
	return path.join(app.getPath('userData'), 'app-locale.txt');
}

function loadPersistedLocale(): string {
	try {
		const filePath = getLocaleFilePath();
		if (fs.existsSync(filePath)) {
			const saved = fs.readFileSync(filePath, 'utf-8').trim();
			if (saved && isSupportedLocale(saved)) {
				return saved;
			}
		}
	} catch (e) {
		console.warn('[Electron] Failed to read persisted locale:', e);
	}
	return 'vi';
}

function savePersistedLocale(loc: string): void {
	try {
		const dir = app.getPath('userData');
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
		const filePath = getLocaleFilePath();
		fs.writeFileSync(filePath, loc, 'utf-8');
	} catch (e) {
		console.warn('[Electron] Failed to write persisted locale:', e);
	}
}
let sidecarProcess: ChildProcessWithoutNullStreams | null = null;
let nextRequestId = 1;
const pendingRequests = new Map<
	number,
	{ resolve: (val: any) => void; reject: (err: any) => void; timeout: NodeJS.Timeout }
>();
let activeApiDomain = (
	process.env.PUBLIC_WEBSITE_URL ||
	process.env.REMOTE_API_URL ||
	process.env.API_URL ||
	process.env.API_DOMAIN ||
	'https://v3.phimbop.cfd'
).trim().replace(/\/+$/, '');

// Ensure single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
	app.quit();
} else {
	app.on('second-instance', () => {
		if (mainWindow) {
			if (mainWindow.isMinimized()) mainWindow.restore();
			if (!mainWindow.isVisible()) mainWindow.show();
			mainWindow.focus();
		}
	});
}

function getAppRoot(): string {
	if (app.isPackaged) {
		return app.getAppPath();
	}
	const dir = __dirname;
	if (dir.endsWith('electron/dist') || dir.endsWith('electron/dist/')) {
		return path.resolve(dir, '../..');
	}
	if (dir.endsWith('electron') || dir.endsWith('electron/')) {
		return path.resolve(dir, '..');
	}
	return app.getAppPath();
}

function resolveSidecarPath(): string {
	const binName = process.platform === 'win32' ? 'pb-sidecar.exe' : 'pb-sidecar';
	if (!app.isPackaged) {
		const appRoot = getAppRoot();
		const debugPath = path.resolve(appRoot, 'target/debug', binName);
		if (fs.existsSync(debugPath)) return debugPath;
		const releasePath = path.resolve(appRoot, 'target/release', binName);
		if (fs.existsSync(releasePath)) return releasePath;
	}
	return path.join(process.resourcesPath, 'bin', binName);
}

function showNativeNotification(title: string, body: string, onClick?: () => void) {
	if (!Notification.isSupported()) return;

	const appRoot = getAppRoot();
	const iconPath = app.isPackaged
		? path.join(process.resourcesPath, 'icons/128x128.png')
		: path.resolve(appRoot, 'electron/icons/128x128.png');

	const notif = new Notification({
		title,
		body,
		icon: fs.existsSync(iconPath) ? iconPath : undefined,
		silent: false
	});

	notif.on('click', () => {
		if (onClick) {
			onClick();
		} else if (mainWindow) {
			if (mainWindow.isMinimized()) mainWindow.restore();
			if (!mainWindow.isVisible()) mainWindow.show();
			mainWindow.focus();
		}
	});

	notif.show();
}

function startSidecar() {
	const sidecarBin = resolveSidecarPath();
	const dataDir = app.getPath('userData');
	console.log(`[Electron] Starting Rust sidecar: ${sidecarBin} with data-dir: ${dataDir}`);

	if (!fs.existsSync(sidecarBin)) {
		console.error(`[Electron] Sidecar binary not found at: ${sidecarBin}`);
		return;
	}

	sidecarProcess = spawn(sidecarBin, ['--data-dir', dataDir], {
		stdio: ['pipe', 'pipe', 'inherit'],
		env: {
			...process.env,
			RUST_LOG: 'info'
		}
	});

	const rl = readline.createInterface({
		input: sidecarProcess.stdout,
		terminal: false
	});

	rl.on('line', (line) => {
		const trimmed = line.trim();
		if (!trimmed) return;

		try {
			const parsed = JSON.parse(trimmed);

			// Handle events emitted from sidecar (e.g. movie-update)
			if (parsed.type === 'event') {
				if (parsed.event === 'movie-update') {
					const ev = parsed.data;
					const { title, body } = formatMovieNotification(ev, cachedLocale);

					showNativeNotification(title, body, () => {
						if (mainWindow) {
							if (mainWindow.isMinimized()) mainWindow.restore();
							if (!mainWindow.isVisible()) mainWindow.show();
							mainWindow.focus();
						}
					});

					if (mainWindow && !mainWindow.isDestroyed()) {
						mainWindow.webContents.send('movie-update', ev);
					}
				}
				return;
			}

			// Handle request responses correlated by id
			if (typeof parsed.id === 'number') {
				const pending = pendingRequests.get(parsed.id);
				if (pending) {
					clearTimeout(pending.timeout);
					pendingRequests.delete(parsed.id);
					if (parsed.error) {
						pending.reject(new Error(parsed.error));
					} else {
						pending.resolve(parsed.result);
					}
				}
			}
		} catch (e) {
			console.error('[Electron] Failed to parse sidecar stdout line:', trimmed, e);
		}
	});

	sidecarProcess.on('exit', (code, signal) => {
		console.log(`[Electron] Sidecar exited with code ${code}, signal ${signal}`);
		sidecarProcess = null;
		if (!isQuitting) {
			console.log('[Electron] Restarting sidecar in 2 seconds...');
			setTimeout(startSidecar, 2000);
		}
	});

	// Preload settings into memory cache
	invokeSidecar<any>('get_app_settings')
		.then((settings) => {
			if (settings) {
				if (typeof settings.minimizeToTray === 'boolean') {
					cachedMinimizeToTray = settings.minimizeToTray;
				} else if (typeof settings.minimize_to_tray === 'boolean') {
					cachedMinimizeToTray = settings.minimize_to_tray;
				}
			}
		})
		.catch(() => {});

	invokeSidecar<string>('get_api_domain')
		.then((domain) => {
			if (domain && typeof domain === 'string' && (domain.startsWith('http://') || domain.startsWith('https://'))) {
				activeApiDomain = domain.trim().replace(/\/+$/, '');
				console.log(`[Electron] Active API domain loaded from sidecar: ${activeApiDomain}`);
			}
		})
		.catch(() => {});
}

function invokeSidecar<T = any>(method: string, params: Record<string, unknown> = {}): Promise<T> {
	return new Promise((resolve, reject) => {
		if (!sidecarProcess || !sidecarProcess.stdin.writable) {
			return reject(new Error('Rust sidecar process is not running or writable'));
		}

		const id = nextRequestId++;
		const timeout = setTimeout(() => {
			pendingRequests.delete(id);
			reject(new Error(`Sidecar command '${method}' timed out after 30s`));
		}, 30000);

		pendingRequests.set(id, { resolve, reject, timeout });

		const reqPayload = JSON.stringify({ id, method, params }) + '\n';
		sidecarProcess.stdin.write(reqPayload, 'utf-8', (err) => {
			if (err) {
				clearTimeout(timeout);
				pendingRequests.delete(id);
				reject(err);
			}
		});
	});
}

function updateTrayMenu(locale: string = cachedLocale) {
	if (!tray) return;
	const labels = getTrayLabels(locale);
	const contextMenu = Menu.buildFromTemplate([
		{
			label: labels.open,
			click: () => {
				if (mainWindow) {
					if (mainWindow.isMinimized()) mainWindow.restore();
					mainWindow.show();
					mainWindow.focus();
				}
			}
		},
		{
			label: labels.checkUpdates,
			click: () => {
				if (mainWindow) {
					mainWindow.webContents.send('trigger-check-update');
				}
			}
		},
		{ type: 'separator' },
		{
			label: labels.quit,
			click: () => {
				isQuitting = true;
				app.quit();
			}
		}
	]);
	tray.setContextMenu(contextMenu);
}

function createTray() {
	const appRoot = getAppRoot();
	const iconPath = app.isPackaged
		? path.join(process.resourcesPath, 'icons/32x32.png')
		: path.resolve(appRoot, 'electron/icons/32x32.png');

	if (fs.existsSync(iconPath)) {
		tray = new Tray(iconPath);
		tray.setToolTip('PHIMBOP - Phim gì cũng có!');
		updateTrayMenu(cachedLocale);
		tray.on('click', () => {
			if (mainWindow) {
				if (mainWindow.isVisible()) {
					mainWindow.hide();
				} else {
					if (mainWindow.isMinimized()) mainWindow.restore();
					mainWindow.show();
					mainWindow.focus();
				}
			}
		});
	}
}

function createWindow() {
	const appRoot = getAppRoot();
	const iconPath = app.isPackaged
		? path.join(process.resourcesPath, 'icons/128x128.png')
		: path.resolve(appRoot, 'electron/icons/128x128.png');

	const startMinimized = process.argv.includes('--minimized') || process.argv.includes('--hidden');

	mainWindow = new BrowserWindow({
		title: 'PHIMBOP - Phim gì cũng có!',
		width: 1360,
		height: 860,
		minWidth: 960,
		minHeight: 640,
		backgroundColor: '#0a0a0a',
		show: !startMinimized,
		autoHideMenuBar: true,
		icon: fs.existsSync(iconPath) ? iconPath : undefined,
		webPreferences: {
			preload: path.join(appRoot, 'electron/dist/preload.cjs'),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: true,
			webSecurity: true
		}
	});

	mainWindow.setMenu(null);

	// Synchronous window close interception for minimize to tray
	mainWindow.on('close', (e) => {
		if (isQuitting) return;

		if (cachedMinimizeToTray) {
			e.preventDefault();
			mainWindow?.hide();
		}
	});

	mainWindow.webContents.setWindowOpenHandler(({ url }) => {
		if (url.startsWith('http://') || url.startsWith('https://')) {
			shell.openExternal(url);
		}
		return { action: 'deny' };
	});

	if (isDevMode()) {
		mainWindow.loadURL('http://localhost:1420').catch((err) => {
			console.warn('[Electron] Failed to connect to http://localhost:1420, falling back to app://:', err.message);
			mainWindow?.loadURL('app://localhost/');
		});
	} else {
		mainWindow.loadURL('app://localhost/');
	}

	if (!startMinimized) {
		mainWindow.once('ready-to-show', () => {
			if (!startMinimized && mainWindow && !mainWindow.isDestroyed()) {
				mainWindow.show();
			}
		});
	}
}

// Cross-platform autostart helpers
function getLinuxAutostartPath(): string {
	const configHome = process.env.XDG_CONFIG_HOME || path.join(app.getPath('home'), '.config');
	return path.join(configHome, 'autostart', 'com.phimbop.desktop.desktop');
}

function getAutostart(): boolean {
	if (process.platform === 'linux') {
		const desktopPath = getLinuxAutostartPath();
		if (fs.existsSync(desktopPath)) {
			try {
				const content = fs.readFileSync(desktopPath, 'utf-8');
				return !content.includes('X-GNOME-Autostart-enabled=false');
			} catch {
				return false;
			}
		}
		return false;
	}
	return app.getLoginItemSettings().openAtLogin;
}

function setAutostart(enable: boolean): boolean {
	if (process.platform === 'linux') {
		const desktopPath = getLinuxAutostartPath();
		const autostartDir = path.dirname(desktopPath);
		if (enable) {
			try {
				fs.mkdirSync(autostartDir, { recursive: true });
				const execTarget = process.env.APPIMAGE || process.execPath;
				const desktopContent = [
					'[Desktop Entry]',
					'Type=Application',
					'Name=PHIMBOP',
					`Exec="${execTarget}" --minimized`,
					'Icon=phimbop',
					'Comment=PHIMBOP - Phim gì cũng có!',
					'Terminal=false',
					'StartupNotify=false',
					'Categories=AudioVideo;Video;Player;',
					'X-GNOME-Autostart-enabled=true'
				].join('\n') + '\n';
				fs.writeFileSync(desktopPath, desktopContent, 'utf-8');
				return true;
			} catch (err) {
				console.error('[Autostart] Failed to write Linux autostart desktop file:', err);
				return false;
			}
		} else {
			try {
				if (fs.existsSync(desktopPath)) {
					fs.unlinkSync(desktopPath);
				}
				return true;
			} catch (err) {
				console.error('[Autostart] Failed to remove Linux autostart desktop file:', err);
				return false;
			}
		}
	}

	app.setLoginItemSettings({
		openAtLogin: enable,
		args: ['--minimized']
	});
	return true;
}

// IPC Handlers
ipcMain.handle('pb-invoke', async (_event, { command, args }) => {
	// Special handling for local/shell commands that don't need Rust sidecar
	if (command === 'open_external_url') {
		const url = args?.url as string;
		if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
			await shell.openExternal(url);
			return;
		}
		throw new Error('Only http/https URLs allowed');
	}

	// Synchronize cached minimize to tray state when settings are saved
	if (command === 'save_app_settings') {
		const s = args?.settings as any;
		if (s && typeof s === 'object') {
			if (typeof s.minimizeToTray === 'boolean') cachedMinimizeToTray = s.minimizeToTray;
			if (typeof s.minimize_to_tray === 'boolean') cachedMinimizeToTray = s.minimize_to_tray;
		}
	}

	// Synchronize active API domain when set_api_domain is called
	if (command === 'set_api_domain' && args?.domain) {
		const d = (args.domain as string).trim().replace(/\/+$/, '');
		if (d.startsWith('http://') || d.startsWith('https://')) {
			activeApiDomain = d;
			console.log(`[Electron] Active API domain synchronized: ${activeApiDomain}`);
		}
	}

	const res = await invokeSidecar(command, args || {});

	// Update cached minimize to tray state when settings are fetched
	if (command === 'get_app_settings' && res && typeof res === 'object') {
		const s = res as any;
		if (typeof s.minimizeToTray === 'boolean') cachedMinimizeToTray = s.minimizeToTray;
		if (typeof s.minimize_to_tray === 'boolean') cachedMinimizeToTray = s.minimize_to_tray;
	}

	return res;
});

ipcMain.handle('open-external-url', async (_event, url: string) => {
	if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
		await shell.openExternal(url);
	}
});

interface PendingUpdate {
	version: string;
	url: string;
	filePath: string;
	isAppImage: boolean;
	isWindowsInstaller: boolean;
}

let latestCheckResult: { version: string; url: string; signature: string; notes: string } | null = null;
let pendingUpdate: PendingUpdate | null = null;

function resolvePlatformAsset(data: any): { url: string; signature: string } {
	if (!data) return { url: '', signature: '' };
	if (!data.platforms || typeof data.platforms !== 'object') {
		return { url: data.url || '', signature: data.signature || '' };
	}

	const isArm64 = process.arch === 'arm64';
	const isWin = process.platform === 'win32';
	const isMac = process.platform === 'darwin';
	const isLinux = process.platform === 'linux';
	const isAppImage = isLinux && !!process.env.APPIMAGE;

	let candidateKeys: string[] = [];

	if (isWin) {
		candidateKeys = ['windows-x86_64-nsis', 'windows-x86_64', 'windows'];
	} else if (isMac) {
		candidateKeys = isArm64
			? ['darwin-aarch64', 'darwin-aarch64-app', 'darwin']
			: ['darwin-x86_64', 'darwin-x86_64-app', 'darwin'];
	} else if (isLinux) {
		if (isAppImage) {
			candidateKeys = ['linux-x86_64-appimage', 'linux-x86_64', 'linux', 'linux-x86_64-deb'];
		} else {
			candidateKeys = ['linux-x86_64-deb', 'linux-x86_64-appimage', 'linux-x86_64', 'linux'];
		}
	}

	for (const key of candidateKeys) {
		if (data.platforms[key]?.url) {
			return {
				url: data.platforms[key].url,
				signature: data.platforms[key].signature || ''
			};
		}
	}

	for (const key of Object.keys(data.platforms)) {
		if (data.platforms[key]?.url) {
			return {
				url: data.platforms[key].url,
				signature: data.platforms[key].signature || ''
			};
		}
	}

	return { url: data.url || '', signature: data.signature || '' };
}

ipcMain.handle('app-get-version', () => {
	return app.getVersion();
});

ipcMain.handle('updater-check', async () => {
	const currentVersion = app.getVersion();
	const target = process.platform === 'darwin' ? 'darwin' : process.platform === 'win32' ? 'windows' : 'linux';
	const arch = process.arch === 'arm64' ? 'aarch64' : 'x86_64';
	const url = `https://nhxgdsanykpnmghtohfz.supabase.co/functions/v1/app-update?target=${target}&arch=${arch}&current_version=${currentVersion}`;

	try {
		const res = await fetch(url, {
			headers: {
				apikey: DEFAULT_SUPABASE_KEY,
				Authorization: `Bearer ${DEFAULT_SUPABASE_KEY}`
			}
		});

		if (res.status === 204) {
			latestCheckResult = null;
			return { updateAvailable: false, currentVersion };
		}

		if (res.ok) {
			const data = await res.json();
			const asset = resolvePlatformAsset(data);
			const notes = data.notes || data.body || '';

			latestCheckResult = {
				version: data.version,
				url: asset.url,
				signature: asset.signature,
				notes
			};

			return {
				updateAvailable: true,
				currentVersion,
				version: data.version,
				notes,
				url: asset.url,
				signature: asset.signature
			};
		}
	} catch (e: any) {
		console.warn('[Updater] Check failed:', e.message);
	}

	return { updateAvailable: false, currentVersion };
});

function isTrustedUpdateUrl(urlStr: string): boolean {
	try {
		const parsed = new URL(urlStr);
		if (parsed.protocol !== 'https:') {
			return false;
		}
		// If it matches the latest validated check result
		if (latestCheckResult?.url && urlStr === latestCheckResult.url) {
			return true;
		}
		// Official GitHub Releases endpoint for pb-desk
		if (
			parsed.hostname === 'github.com' &&
			parsed.pathname.startsWith('/phimbop/pb-desk/releases/download/')
		) {
			return true;
		}
		// GitHub release binary CDN redirect host
		if (parsed.hostname === 'objects.githubusercontent.com') {
			return true;
		}
		// Supabase project storage if hosting binaries
		if (parsed.hostname === 'nhxgdsanykpnmghtohfz.supabase.co') {
			return true;
		}
		return false;
	} catch {
		return false;
	}
}

function resolveTargetAppImage(): string | null {
	if (process.env.APPIMAGE && fs.existsSync(process.env.APPIMAGE)) {
		return process.env.APPIMAGE;
	}
	const standardPath = path.join(os.homedir(), '.local/lib/phimbop/phimbop.AppImage');
	if (fs.existsSync(standardPath)) {
		return standardPath;
	}
	return null;
}

ipcMain.handle('updater-download-install', async (_event, customUrl?: string) => {
	const downloadUrl = customUrl || latestCheckResult?.url;
	if (!downloadUrl) {
		throw new Error('No download URL available for update');
	}

	if (!isTrustedUpdateUrl(downloadUrl)) {
		throw new Error(`Untrusted update download URL: ${downloadUrl}`);
	}

	const parsedUrl = new URL(downloadUrl);
	const rawFilename = path.basename(parsedUrl.pathname) || 'update-package';

	// Enforce safe filename and allowed binary extensions
	const isValidExtension = /^[a-zA-Z0-9._-]+\.(AppImage|deb|exe|dmg|zip|tar\.gz)$/i.test(rawFilename);
	if (!isValidExtension) {
		throw new Error(`Invalid update file extension or name: ${rawFilename}`);
	}

	let tempFilePath: string;

	if (process.platform === 'linux' && !!process.env.APPIMAGE) {
		const currentAppImage = process.env.APPIMAGE;
		const currentDir = path.dirname(currentAppImage);
		let canWrite = false;
		try {
			fs.accessSync(currentDir, fs.constants.W_OK);
			canWrite = true;
		} catch {}

		if (canWrite) {
			tempFilePath = path.join(currentDir, `.${path.basename(currentAppImage)}.part-${Date.now()}`);
		} else {
			tempFilePath = path.join(app.getPath('temp'), `update-${Date.now()}-${rawFilename}`);
		}
	} else {
		tempFilePath = path.join(app.getPath('temp'), `update-${Date.now()}-${rawFilename}`);
	}

	console.log(`[Updater] Downloading update from: ${downloadUrl} to ${tempFilePath}`);

	const res = await fetch(downloadUrl);
	if (!res.ok) {
		throw new Error(`Failed to download update: HTTP ${res.status} ${res.statusText}`);
	}

	const totalBytes = Number(res.headers.get('content-length')) || 0;
	let transferredBytes = 0;

	const fileStream = fs.createWriteStream(tempFilePath);
	const reader = res.body?.getReader();
	if (!reader) {
		throw new Error('Response body stream is not available');
	}

	let lastProgressTime = 0;

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			fileStream.write(value);
			transferredBytes += value.length;

			const now = Date.now();
			if (now - lastProgressTime > 100 || (totalBytes > 0 && transferredBytes >= totalBytes)) {
				lastProgressTime = now;
				const percent = totalBytes > 0 ? Math.min(100, Math.round((transferredBytes / totalBytes) * 100)) : 0;
				if (mainWindow && !mainWindow.isDestroyed()) {
					mainWindow.webContents.send('updater-progress', {
						percent,
						transferred: transferredBytes,
						total: totalBytes
					});
				}
			}
		}

		await new Promise<void>((resolve, reject) => {
			fileStream.end(() => resolve());
			fileStream.on('error', reject);
		});
	} catch (err) {
		fileStream.destroy();
		try { fs.unlinkSync(tempFilePath); } catch {}
		throw err;
	}

	const isAppImage = process.platform === 'linux' && (rawFilename.endsWith('.AppImage') || !!process.env.APPIMAGE);
	const isWindowsInstaller = process.platform === 'win32' && rawFilename.endsWith('.exe');

	if (isAppImage) {
		try {
			fs.chmodSync(tempFilePath, 0o755);
		} catch (e) {
			console.warn('[Updater] Could not chmod temp AppImage:', e);
		}

		// Immediately replace target AppImage so even if user closes/quits the app instead
		// of clicking relaunch, launching from menu bar / desktop icon runs the new version!
		const targetAppImage = resolveTargetAppImage();
		if (targetAppImage) {
			try {
				const targetDir = path.dirname(targetAppImage);
				fs.accessSync(targetDir, fs.constants.W_OK);
				const tempInDest = path.join(targetDir, `.${path.basename(targetAppImage)}.update-${Date.now()}`);
				fs.copyFileSync(tempFilePath, tempInDest);
				fs.chmodSync(tempInDest, 0o755);
				fs.renameSync(tempInDest, targetAppImage);
				fs.chmodSync(targetAppImage, 0o755);
				console.log(`[Updater] Atomically replaced installed AppImage at ${targetAppImage}`);
			} catch (replaceErr) {
				console.warn('[Updater] Could not immediately replace target AppImage:', replaceErr);
			}
		}
	}

	pendingUpdate = {
		version: latestCheckResult?.version || '',
		url: downloadUrl,
		filePath: tempFilePath,
		isAppImage,
		isWindowsInstaller
	};

	if (mainWindow && !mainWindow.isDestroyed()) {
		mainWindow.webContents.send('updater-progress', {
			percent: 100,
			transferred: totalBytes > 0 ? totalBytes : transferredBytes,
			total: totalBytes > 0 ? totalBytes : transferredBytes
		});
	}

	return { success: true, filePath: tempFilePath };
});

ipcMain.handle('updater-relaunch', async () => {
	const targetAppImage = resolveTargetAppImage();

	if (!pendingUpdate || !fs.existsSync(pendingUpdate.filePath)) {
		console.warn('[Updater] No downloaded update found on disk, running standard relaunch');
		if (process.platform === 'linux' && targetAppImage) {
			spawn(targetAppImage, process.argv.slice(1), { detached: true, stdio: 'ignore' }).unref();
		} else if (process.platform === 'linux' && process.env.APPIMAGE) {
			spawn(process.env.APPIMAGE, process.argv.slice(1), { detached: true, stdio: 'ignore' }).unref();
		} else {
			app.relaunch();
		}
		app.exit(0);
		return;
	}

	const { filePath, isAppImage, isWindowsInstaller } = pendingUpdate;

	if (process.platform === 'win32' && isWindowsInstaller) {
		console.log(`[Updater] Executing Windows NSIS installer: ${filePath}`);
		const child = spawn(filePath, ['/S', '--updated'], {
			detached: true,
			stdio: 'ignore'
		});
		child.unref();
		app.exit(0);
		return;
	}

	if (process.platform === 'linux') {
		if (isAppImage) {
			let targetExec = targetAppImage || (process.env.APPIMAGE && fs.existsSync(process.env.APPIMAGE) ? process.env.APPIMAGE : filePath);

			if (targetAppImage) {
				try {
					const currentDir = path.dirname(targetAppImage);
					fs.accessSync(currentDir, fs.constants.W_OK);
					if (fs.existsSync(filePath) && filePath !== targetAppImage) {
						if (path.dirname(filePath) !== currentDir) {
							const tempInDest = path.join(currentDir, `.${path.basename(targetAppImage)}.update-${Date.now()}`);
							fs.copyFileSync(filePath, tempInDest);
							fs.chmodSync(tempInDest, 0o755);
							fs.renameSync(tempInDest, targetAppImage);
							fs.chmodSync(targetAppImage, 0o755);
							try { fs.unlinkSync(filePath); } catch {}
						} else {
							fs.renameSync(filePath, targetAppImage);
							fs.chmodSync(targetAppImage, 0o755);
						}
					}
					targetExec = targetAppImage;
				} catch (err) {
					console.warn('[Updater] Could not replace current AppImage directly, falling back to temp file:', err);
					targetExec = fs.existsSync(filePath) ? filePath : targetAppImage;
				}
			}

			console.log(`[Updater] Launching updated AppImage: ${targetExec}`);
			const child = spawn(targetExec, process.argv.slice(1), {
				detached: true,
				stdio: 'ignore'
			});
			child.unref();
			app.exit(0);
			return;
		} else if (filePath.endsWith('.deb')) {
			const downloadsDir = app.getPath('downloads');
			const cleanName = path.basename(filePath).replace(/^update-\d+-/, '');
			const destDeb = path.join(downloadsDir, cleanName);
			try {
				if (path.dirname(filePath) !== downloadsDir) {
					fs.copyFileSync(filePath, destDeb);
					try { fs.unlinkSync(filePath); } catch {}
				} else {
					fs.renameSync(filePath, destDeb);
				}
				await shell.openPath(destDeb);
			} catch {
				await shell.openPath(filePath);
			}
			app.exit(0);
			return;
		}
	}

	if (process.platform === 'darwin') {
		await shell.openPath(filePath);
		app.exit(0);
		return;
	}

	// Fallback
	app.relaunch();
	app.exit(0);
});

ipcMain.handle('autostart-get', () => {
	return getAutostart();
});

ipcMain.handle('autostart-set', (_event, enable: boolean) => {
	return setAutostart(enable);
});

ipcMain.handle('set-locale', (_event, locale: string) => {
	if (locale && typeof locale === 'string') {
		const normalized = normalizeLocale(locale);
		cachedLocale = normalized;
		savePersistedLocale(normalized);
		updateTrayMenu(cachedLocale);
		return true;
	}
	return false;
});

ipcMain.handle('get-locale', () => {
	return cachedLocale;
});

ipcMain.handle('show-notification', (_event, { title, body }) => {
	showNativeNotification(title, body);
	return true;
});

// App lifecycle
app.whenReady().then(() => {
	cachedLocale = loadPersistedLocale();

	// Strip Authorization for TMDB reverse proxy to maintain simple requests and prevent CORS preflights
	session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
		const requestHeaders = { ...details.requestHeaders };
		const url = details.url || '';
		if (url.includes('/api/tmdb/')) {
			delete requestHeaders['Authorization'];
			delete requestHeaders['authorization'];
		}
		callback({ cancel: false, requestHeaders });
	});

	// Strip X-Frame-Options and relax frame-ancestors in Content-Security-Policy for embedded player iframes
	session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
		const responseHeaders = { ...details.responseHeaders };
		for (const key of Object.keys(responseHeaders)) {
			const lowerKey = key.toLowerCase();
			if (lowerKey === 'x-frame-options') {
				delete responseHeaders[key];
			} else if (lowerKey === 'content-security-policy' || lowerKey === 'content-security-policy-report-only') {
				responseHeaders[key] = responseHeaders[key].map((csp) =>
					csp.replace(/frame-ancestors[^;]+;?/gi, '')
				);
			} else if (lowerKey === 'cross-origin-resource-policy') {
				responseHeaders[key] = ['cross-origin'];
			}
		}

		// Dynamically adapt CORS for API domain, reverse proxies, CDNs, and internal requests
		const initiator = details.initiator || '';
		const url = details.url || '';
		const isApiOrApp =
			initiator.startsWith('app://') ||
			initiator.includes('localhost') ||
			(activeApiDomain && url.startsWith(activeApiDomain)) ||
			url.includes('/api/tmdb/') ||
			url.includes('phimbop.cfd');

		if (isApiOrApp) {
			responseHeaders['access-control-allow-origin'] = ['*'];
			responseHeaders['access-control-allow-methods'] = ['GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD'];
			responseHeaders['access-control-allow-headers'] = ['*'];
			responseHeaders['access-control-expose-headers'] = ['*'];
			responseHeaders['access-control-allow-credentials'] = ['true'];

			if (details.method === 'OPTIONS') {
				return callback({
					cancel: false,
					statusLine: 'HTTP/1.1 200 OK',
					responseHeaders
				});
			}
		}

		callback({ cancel: false, responseHeaders });
	});

	// Intercept app:// requests to serve static files from build directory
	protocol.handle('app', (request) => {
		const url = new URL(request.url);
		let pathname = decodeURIComponent(url.pathname);
		if (pathname === '/' || pathname === '') {
			pathname = '/index.html';
		}
		const appRoot = app.getAppPath();
		const relativePath = pathname.replace(/^\/+/, '');
		const filePath = path.join(appRoot, 'build', relativePath);

		if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
			return net.fetch(pathToFileURL(filePath).toString());
		}
		const fallbackPath = path.join(appRoot, 'build', 'index.html');
		return net.fetch(pathToFileURL(fallbackPath).toString());
	});

	Menu.setApplicationMenu(null);
	startSidecar();
	createWindow();
	createTray();

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		} else if (mainWindow) {
			if (mainWindow.isMinimized()) mainWindow.restore();
			mainWindow.show();
			mainWindow.focus();
		}
	});
});

app.on('before-quit', () => {
	isQuitting = true;
	if (sidecarProcess) {
		sidecarProcess.kill('SIGTERM');
	}
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});
