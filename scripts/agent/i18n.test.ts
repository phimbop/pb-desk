import { describe, test, expect, beforeEach } from "bun:test";

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

if (typeof globalThis.localStorage === "undefined") {
	(globalThis as any).localStorage = localStorageMock;
}

// @ts-ignore
const runtime: any = await import("../../src/lib/paraglide/runtime.js");
const {
	getLocale,
	setLocale,
	locales,
	strategy,
	localizeHref,
	deLocalizeHref,
	localStorageKey
} = runtime;

// @ts-ignore
const m: any = await import("../../src/lib/paraglide/messages.js");

describe("Desktop Multilanguage (i18n) runtime", () => {
	beforeEach(() => {
		// Reset localStorage mock
		localStorage.clear();
	});

	test("Strategy does not include URL routing and uses localStorage for desktop", () => {
		expect(strategy).toContain("localStorage");
		expect(strategy).not.toContain("url");
	});

	test("All 17 global locales are registered", () => {
		expect(locales.length).toBe(17);
		expect(locales).toContain("vi");
		expect(locales).toContain("en");
		expect(locales).toContain("ja");
		expect(locales).toContain("ko");
		expect(locales).toContain("zh");
	});

	test("localizeHref maintains clean relative URLs without prepending locale prefixes", () => {
		// When locale is set to 'vi', links must stay clean relative routes
		setLocale("vi", { reload: false });
		expect(localizeHref("/")).toBe("/");
		expect(localizeHref("/phim-bo")).toBe("/phim-bo");
		expect(localizeHref("/bang-xep-hang")).toBe("/bang-xep-hang");
		expect(localizeHref("/tim-kiem/phim")).toBe("/tim-kiem/phim");

		// When locale is set to 'en', links also stay clean
		setLocale("en", { reload: false });
		expect(localizeHref("/")).toBe("/");
		expect(localizeHref("/phim-moi")).toBe("/phim-moi");
	});

	test("deLocalizeHref preserves clean relative paths", () => {
		expect(deLocalizeHref("/")).toBe("/");
		expect(deLocalizeHref("/phim-bo")).toBe("/phim-bo");
	});

	test("setLocale persists to localStorage and getLocale reads it back", () => {
		setLocale("vi", { reload: false });
		expect(localStorage.getItem(localStorageKey)).toBe("vi");
		expect(getLocale()).toBe("vi");

		setLocale("ja", { reload: false });
		expect(localStorage.getItem(localStorageKey)).toBe("ja");
		expect(getLocale()).toBe("ja");

		setLocale("en", { reload: false });
		expect(localStorage.getItem(localStorageKey)).toBe("en");
		expect(getLocale()).toBe("en");
	});

	test("Translations resolve dynamically according to active locale", () => {
		setLocale("vi", { reload: false });
		expect(m.reuse_list()).toBe("Danh sách");
		expect(m.breadcrumb_home()).toBe("Trang chủ");

		setLocale("en", { reload: false });
		expect(m.reuse_list()).toBe("List");
		expect(m.breadcrumb_home()).toBe("Home");
	});

	test("Settings page translations resolve across all 17 locales without English fallback", () => {
		const settingsKeys = [
			"sidebar_settings_title",
			"sidebar_settings_tp",
			"settings_title",
			"settings_description",
			"settings_system_group",
			"settings_autostart_title",
			"settings_autostart_desc",
			"settings_tray_title",
			"settings_tray_desc",
			"settings_notification_group",
			"settings_notify_title",
			"settings_notify_desc",
			"settings_scope_label",
			"settings_scope_all",
			"settings_scope_all_desc",
			"settings_scope_fav",
			"settings_scope_fav_desc",
			"settings_interval_label",
			"settings_interval_desc",
			"settings_interval_15m",
			"settings_interval_30m",
			"settings_interval_1h",
			"settings_interval_2h",
			"settings_scan_btn",
			"settings_scanning_btn",
			"settings_scan_empty",
			"settings_scan_error",
			"settings_saved_status",
			"settings_save_btn",
			"settings_seo_title",
			"settings_scan_hint",
			"settings_language_group",
			"settings_language_label",
			"settings_language_desc",
			"updater_app_version",
			"updater_checking",
			"updater_check_btn",
			"updater_close",
			"updater_status_available",
			"updater_status_downloading",
			"updater_status_downloaded",
			"updater_status_up_to_date",
			"updater_status_error",
			"updater_new_version",
			"updater_critical_badge",
			"updater_critical_desc",
			"updater_changelog_title",
			"updater_changelog_default",
			"updater_btn_later",
			"updater_btn_update_now",
			"updater_downloading_pkg",
			"updater_downloaded_desc",
			"updater_btn_restart_now",
			"updater_up_to_date_desc",
			"updater_btn_dismiss",
			"updater_error_default",
			"updater_btn_retry",
			"updater_error_check",
			"updater_error_connection",
			"updater_error_download"
		];

		// Baseline English values
		setLocale("en", { reload: false });
		const enValues: Record<string, string> = {};
		for (const key of settingsKeys) {
			expect(typeof m[key]).toBe("function");
			enValues[key] = m[key]();
			expect(enValues[key].length).toBeGreaterThan(0);
		}

		// Check Korean specific translations (from user issue)
		setLocale("ko", { reload: false });
		expect(m.sidebar_settings_title()).toBe("설정");
		expect(m.sidebar_settings_tp()).toBe("앱 설정");
		expect(m.settings_title()).toBe("앱 설정");
		expect(m.sidebar_leaderboard_title()).toBe("리더보드");
		expect(m.settings_scan_hint()).toBe("스캔 주기를 기다리지 않고 지금 바로 새 영화를 확인하세요");
		expect(m.settings_language_group()).toBe("언어 및 화면 표시");
		expect(m.settings_language_label()).toBe("표시 언어");

		// Check all 17 locales
		for (const loc of locales) {
			setLocale(loc, { reload: false });
			for (const key of settingsKeys) {
				const val = m[key]();
				expect(typeof val).toBe("string");
				expect(val.length).toBeGreaterThan(0);
				// For long descriptive phrases, non-English locales must NOT return the English value
				if (loc !== "en" && (key === "settings_description" || key === "settings_system_group" || key === "settings_autostart_desc" || key === "settings_tray_desc")) {
					expect(val).not.toBe(enValues[key]);
				}
			}

			// Parametrized function
			const foundVal = m.settings_scan_found({ count: 3 });
			expect(typeof foundVal).toBe("string");
			expect(foundVal).toContain("3");
		}
	});
});

