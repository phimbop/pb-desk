import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
	isElectron: boolean;
	platform: string;
	invoke: <T = any>(command: string, args?: Record<string, unknown>) => Promise<T>;
	openExternal: (url: string) => Promise<void>;
	onEvent: (channel: string, callback: (...args: any[]) => void) => () => void;
	updater: {
		check: () => Promise<any>;
		downloadAndInstall: () => Promise<void>;
		relaunch: () => Promise<void>;
	};
	autostart: {
		get: () => Promise<boolean>;
		set: (enable: boolean) => Promise<boolean>;
	};
	showNotification: (title: string, body: string) => Promise<boolean>;
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
		downloadAndInstall: () => ipcRenderer.invoke('updater-download-install'),
		relaunch: () => ipcRenderer.invoke('updater-relaunch')
	},
	autostart: {
		get: () => ipcRenderer.invoke('autostart-get'),
		set: (enable: boolean) => ipcRenderer.invoke('autostart-set', enable)
	},
	showNotification: (title: string, body: string) => ipcRenderer.invoke('show-notification', { title, body })
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
