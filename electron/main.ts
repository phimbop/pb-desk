import { app, BrowserWindow, ipcMain, Menu, net, Notification, protocol, shell, Tray } from 'electron';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';
import { pathToFileURL } from 'node:url';

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
let sidecarProcess: ChildProcessWithoutNullStreams | null = null;
let nextRequestId = 1;
const pendingRequests = new Map<
	number,
	{ resolve: (val: any) => void; reject: (err: any) => void; timeout: NodeJS.Timeout }
>();

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
					const title = ev.isNewMovie
						? '🎬 PHIMBOP - Phim mới cập nhật!'
						: `🔥 Tập mới: ${ev.movieName || ev.movie_name}`;
					const body = ev.episode
						? `${ev.movieName || ev.movie_name} vừa cập nhật ${ev.episode}!`
						: `${ev.movieName || ev.movie_name} đã có mặt trên PHIMBOP!`;

					if (Notification.isSupported()) {
						new Notification({ title, body }).show();
					}
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

function createTray() {
	const appRoot = getAppRoot();
	const iconPath = app.isPackaged
		? path.join(process.resourcesPath, 'icons/32x32.png')
		: path.resolve(appRoot, 'electron/icons/32x32.png');

	if (fs.existsSync(iconPath)) {
		tray = new Tray(iconPath);
		const contextMenu = Menu.buildFromTemplate([
			{
				label: 'Mở PHIMBOP',
				click: () => {
					if (mainWindow) {
						mainWindow.show();
						mainWindow.focus();
					}
				}
			},
			{
				label: 'Kiểm tra cập nhật',
				click: () => {
					if (mainWindow) {
						mainWindow.webContents.send('trigger-check-update');
					}
				}
			},
			{ type: 'separator' },
			{
				label: 'Thoát',
				click: () => {
					isQuitting = true;
					app.quit();
				}
			}
		]);
		tray.setToolTip('PHIMBOP - Phim gì cũng có!');
		tray.setContextMenu(contextMenu);
		tray.on('click', () => {
			if (mainWindow) {
				if (mainWindow.isVisible()) {
					mainWindow.hide();
				} else {
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

	mainWindow = new BrowserWindow({
		title: 'PHIMBOP - Phim gì cũng có!',
		width: 1360,
		height: 860,
		minWidth: 960,
		minHeight: 640,
		backgroundColor: '#0a0a0a',
		autoHideMenuBar: true,
		icon: fs.existsSync(iconPath) ? iconPath : undefined,
		webPreferences: {
			preload: path.join(appRoot, 'electron/dist/preload.cjs'),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: false,
			webSecurity: true
		}
	});

	mainWindow.setMenu(null);

	// Window close interception for minimize to tray
	mainWindow.on('close', async (e) => {
		if (isQuitting) return;

		try {
			const settings = await invokeSidecar<{ minimize_to_tray?: boolean; minimizeToTray?: boolean }>('get_app_settings');
			const shouldMinimize = settings?.minimize_to_tray ?? settings?.minimizeToTray ?? true;
			if (shouldMinimize) {
				e.preventDefault();
				mainWindow?.hide();
			}
		} catch (_) {
			// If sidecar check fails, allow normal close
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
			mainWindow?.loadURL('app://localhost/index.html');
		});
	} else {
		mainWindow.loadURL('app://localhost/index.html');
	}

	// Hide if started with --minimized flag
	if (process.argv.includes('--minimized')) {
		mainWindow.hide();
	}
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

	return await invokeSidecar(command, args || {});
});

ipcMain.handle('open-external-url', async (_event, url: string) => {
	if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
		await shell.openExternal(url);
	}
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
			return { updateAvailable: false, currentVersion };
		}

		if (res.ok) {
			const data = await res.json();
			return {
				updateAvailable: true,
				currentVersion,
				version: data.version,
				notes: data.notes || data.body || '',
				url: data.url,
				signature: data.signature
			};
		}
	} catch (e: any) {
		console.warn('[Updater] Check failed:', e.message);
	}

	return { updateAvailable: false, currentVersion };
});

ipcMain.handle('updater-relaunch', () => {
	app.relaunch();
	app.exit(0);
});

ipcMain.handle('autostart-get', () => {
	return app.getLoginItemSettings().openAtLogin;
});

ipcMain.handle('autostart-set', (_event, enable: boolean) => {
	app.setLoginItemSettings({
		openAtLogin: enable,
		args: ['--minimized']
	});
	return true;
});

ipcMain.handle('show-notification', (_event, { title, body }) => {
	if (Notification.isSupported()) {
		new Notification({ title, body }).show();
	}
	return true;
});

// App lifecycle
app.whenReady().then(() => {
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
