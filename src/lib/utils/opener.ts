import { isTauri as isTauriCore } from '@tauri-apps/api/core';
import { openUrl } from '@tauri-apps/plugin-opener';

/**
 * Checks whether the app is currently running inside the Tauri desktop webview.
 */
export const isTauriEnv = (): boolean => {
	if (typeof window === 'undefined') return false;
	return '__TAURI_INTERNALS__' in window || '__TAURI__' in window || isTauriCore();
};

/**
 * Opens an external URL in the system's default web browser.
 * Uses `@tauri-apps/plugin-opener` when running in a Tauri desktop environment,
 * falling back to `window.open` in a standard browser.
 */
export async function openExternalUrl(url: string | URL): Promise<void> {
	if (!url) return;
	const targetUrl = url.toString();
	try {
		if (isTauriEnv()) {
			await openUrl(targetUrl);
			return;
		}
	} catch (err) {
		console.warn('[Opener] Failed to open external URL via Tauri opener:', err);
	}

	if (typeof window !== 'undefined') {
		window.open(targetUrl, '_blank', 'noopener,noreferrer');
	}
}

let isGlobalOpenerInitialized = false;

/**
 * Initializes global interception of `window.open` and external `<a>` tags
 * to ensure they open in the default OS browser when running inside Tauri desktop app.
 */
export function setupGlobalOpener(): void {
	if (typeof window === 'undefined' || isGlobalOpenerInitialized) return;
	isGlobalOpenerInitialized = true;

	// Intercept window.open
	const originalOpen = window.open;
	window.open = (url?: string | URL, target?: string, features?: string) => {
		if (url && isTauriEnv()) {
			openExternalUrl(url).catch((err) => {
				console.warn('[window.open polyfill] openExternalUrl failed:', err);
				originalOpen.call(window, url, target, features);
			});
			return null;
		}
		return originalOpen.call(window, url, target, features);
	};

	// Intercept clicks on links targeting _blank or external URLs
	document.addEventListener(
		'click',
		(event) => {
			const target = (event.target as HTMLElement | null)?.closest('a');
			if (!target || !target.href) return;

			// Do not intercept in-app hash navigation or javascript links
			const rawHref = target.getAttribute('href');
			if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:')) {
				return;
			}

			const isHttp = target.href.startsWith('http://') || target.href.startsWith('https://');
			if (!isHttp) return;

			let isExternal = target.target === '_blank';
			try {
				const url = new URL(target.href);
				if (url.origin !== window.location.origin) {
					isExternal = true;
				}
			} catch {
				// Ignore malformed URLs
			}

			if (isExternal && isTauriEnv()) {
				event.preventDefault();
				openExternalUrl(target.href).catch((err) => {
					console.warn('[Global link opener] Failed to open link:', err);
				});
			}
		},
		{ capture: true }
	);
}
