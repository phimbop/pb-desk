import { describe, test, expect, beforeEach } from 'bun:test';

// Mock localStorage for test environment if not present
const store = new Map<string, string>();
const localStorageMock = {
	getItem: (key: string) => store.get(key) ?? null,
	setItem: (key: string, value: string) => store.set(key, String(value)),
	removeItem: (key: string) => store.delete(key),
	clear: () => store.clear(),
	get length() {
		return store.size;
	},
	key: (index: number) => Array.from(store.keys())[index] ?? null
};

if (typeof globalThis.localStorage === 'undefined') {
	(globalThis as any).localStorage = localStorageMock;
}

// @ts-ignore
const runtime: any = await import('../../src/lib/paraglide/runtime.js');
const { getLocale, setLocale, locales } = runtime;

// @ts-ignore
const m: any = await import('../../src/lib/paraglide/messages.js');

describe('Updater Multilanguage (i18n) verification', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	test('Updater keys resolve dynamically for vi and en', () => {
		setLocale('vi', { reload: false });
		expect(m.updater_app_version()).toBe('Phiên bản ứng dụng');
		expect(m.updater_check_btn()).toBe('Kiểm tra cập nhật');
		expect(m.updater_checking()).toBe('Đang kiểm tra...');
		expect(m.updater_status_available()).toBe('Có bản cập nhật mới!');
		expect(m.updater_btn_update_now()).toBe('Cập nhật ngay');
		expect(m.updater_current_version({ version: '0.1.7' })).toContain('0.1.7');

		setLocale('en', { reload: false });
		expect(m.updater_app_version()).toBe('Application version');
		expect(m.updater_check_btn()).toBe('Check for updates');
		expect(m.updater_checking()).toBe('Checking for updates...');
		expect(m.updater_status_available()).toBe('New update available!');
		expect(m.updater_btn_update_now()).toBe('Update now');
		expect(m.updater_current_version({ version: '0.1.7' })).toContain('0.1.7');
	});

	test('All 17 locales provide valid non-empty translations for all updater keys', () => {
		const updaterKeys = [
			'updater_app_version',
			'updater_checking',
			'updater_check_btn',
			'updater_close',
			'updater_status_available',
			'updater_status_downloading',
			'updater_status_downloaded',
			'updater_status_up_to_date',
			'updater_status_error',
			'updater_new_version',
			'updater_critical_badge',
			'updater_critical_desc',
			'updater_changelog_title',
			'updater_changelog_default',
			'updater_btn_later',
			'updater_btn_update_now',
			'updater_downloading_pkg',
			'updater_downloaded_desc',
			'updater_btn_restart_now',
			'updater_up_to_date_desc',
			'updater_btn_dismiss',
			'updater_error_default',
			'updater_btn_retry',
			'updater_error_check',
			'updater_error_connection',
			'updater_error_download'
		];

		setLocale('en', { reload: false });
		const enValues: Record<string, string> = {};
		for (const key of updaterKeys) {
			expect(typeof m[key]).toBe('function');
			enValues[key] = m[key]();
			expect(enValues[key].length).toBeGreaterThan(0);
		}

		for (const loc of locales) {
			setLocale(loc, { reload: false });
			for (const key of updaterKeys) {
				const val = m[key]();
				expect(typeof val).toBe('string');
				expect(val.length).toBeGreaterThan(0);

				// For distinct translated languages, check they are localized
				if (['vi', 'zh', 'ja', 'ko', 'es', 'fr', 'de', 'ru'].includes(loc)) {
					if (key === 'updater_app_version' || key === 'updater_check_btn') {
						expect(val).not.toBe(enValues[key]);
					}
				}
			}

			// Parametrized version helper
			const currentVer = m.updater_current_version({ version: '0.1.7' });
			expect(typeof currentVer).toBe('string');
			expect(currentVer).toContain('0.1.7');
		}
	});
});
