import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
	isElectron: boolean;
	platform: string;
	invoke: <T = any>(command: string, args?: Record<string, unknown>) => Promise<T>;
	openExternal: (url: string) => Promise<void>;
	onEvent: (channel: string, callback: (...args: any[]) => void) => () => void;
	updater: {
		check: () => Promise<any>;
		downloadAndInstall: (url?: string) => Promise<any>;
		relaunch: () => Promise<void>;
	};
	getAppVersion: () => Promise<string>;
	autostart: {
		get: () => Promise<boolean>;
		set: (enable: boolean) => Promise<boolean>;
	};
	showNotification: (title: string, body: string) => Promise<boolean>;
	setLocale: (locale: string) => Promise<boolean>;
	getLocale: () => Promise<string>;
	locale: {
		get: () => Promise<string>;
		set: (locale: string) => Promise<boolean>;
	};
}

const electronAPI: ElectronAPI = {
	isElectron: true,
	platform: process.platform,
	invoke: (command: string, args?: Record<string, unknown>) => {
		return ipcRenderer.invoke('pb-invoke', { command, args });
	},
	openExternal: (url: string) => {
		return ipcRenderer.invoke('open-external-url', url);
	},
	onEvent: (channel: string, callback: (...args: any[]) => void) => {
		const listener = (_event: Electron.IpcRendererEvent, ...args: any[]) => {
			callback(...args);
		};
		ipcRenderer.on(channel, listener);
		return () => {
			ipcRenderer.removeListener(channel, listener);
		};
	},
	updater: {
		check: () => ipcRenderer.invoke('updater-check'),
		downloadAndInstall: (url?: string) => ipcRenderer.invoke('updater-download-install', url),
		relaunch: () => ipcRenderer.invoke('updater-relaunch')
	},
	getAppVersion: () => ipcRenderer.invoke('app-get-version'),
	autostart: {
		get: () => ipcRenderer.invoke('autostart-get'),
		set: (enable: boolean) => ipcRenderer.invoke('autostart-set', enable)
	},
	showNotification: (title: string, body: string) => ipcRenderer.invoke('show-notification', { title, body }),
	setLocale: (locale: string) => ipcRenderer.invoke('set-locale', locale),
	getLocale: () => ipcRenderer.invoke('get-locale'),
	locale: {
		get: () => ipcRenderer.invoke('get-locale'),
		set: (locale: string) => ipcRenderer.invoke('set-locale', locale)
	}
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
