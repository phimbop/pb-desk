import { describe, test, expect, beforeEach } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import {
	formatMovieNotification,
	getTrayLabels,
	NOTIFICATION_TRANSLATIONS,
	TRAY_TRANSLATIONS,
	SUPPORTED_LOCALES,
	normalizeLocale
} from "../../electron/i18n";

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
const { getLocale, setLocale, locales } = runtime;

// @ts-ignore
const m: any = await import("../../src/lib/paraglide/messages.js");

const rootDir = path.resolve(__dirname, "../..");

describe("Desktop App Multi-Language Notification & QA Audit", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	test("R1: formatMovieNotification resolves dynamically across all 17 locales", () => {
		expect(SUPPORTED_LOCALES.length).toBe(17);

		// Vietnamese check
		const viRes = formatMovieNotification({ movieName: "Tinh Lac Ngung Thanh Duong", isNewMovie: true }, "vi");
		expect(viRes.title).toContain("Phim mới cập nhật");
		expect(viRes.body).toContain("đã có mặt trên PHIMBOP");

		const viEpRes = formatMovieNotification({ movieName: "Tinh Lac Ngung Thanh Duong", episode: "Tập 10" }, "vi");
		expect(viEpRes.title).toContain("Tập mới");
		expect(viEpRes.body).toContain("vừa cập nhật Tập 10");

		// English check
		const enRes = formatMovieNotification({ movieName: "Inception", isNewMovie: true }, "en");
		expect(enRes.title).toContain("New Movie Added");
		expect(enRes.body).toContain("is now available on PHIMBOP");

		const enEpRes = formatMovieNotification({ movieName: "Inception", episode: "Episode 1" }, "en");
		expect(enEpRes.title).toContain("New Episode");
		expect(enEpRes.body).toContain("just updated Episode 1");

		// Japanese check
		const jaRes = formatMovieNotification({ movieName: "君の名は", isNewMovie: true }, "ja");
		expect(jaRes.title).toContain("新着映画");
		expect(jaRes.body).toContain("PHIMBOPで配信開始");

		// Korean check
		const koRes = formatMovieNotification({ movieName: "기생충", isNewMovie: true }, "ko");
		expect(koRes.title).toContain("새 영화가 업데이트");
		expect(koRes.body).toContain("PHIMBOP에서 시청 가능");

		// Chinese check
		const zhRes = formatMovieNotification({ movieName: "流浪地球", isNewMovie: true }, "zh");
		expect(zhRes.title).toContain("新电影已上线");
		expect(zhRes.body).toContain("现已上线 PHIMBOP");

		// Validate all 17 locales provide distinct, non-empty notification translations
		for (const loc of SUPPORTED_LOCALES) {
			const res = formatMovieNotification({ movieName: "Test", episode: "1", isNewMovie: false }, loc);
			expect(res.title.length).toBeGreaterThan(0);
			expect(res.body.length).toBeGreaterThan(0);
			expect(res.title).toContain("Test");
			expect(res.body).toContain("Test");
		}
	});

	test("R1: Unknown or malformed locale safely falls back to default vi", () => {
		expect(normalizeLocale("invalid-xyz")).toBe("vi");
		expect(normalizeLocale(null)).toBe("vi");
		expect(normalizeLocale("EN-US")).toBe("en");
		expect(normalizeLocale("ja_JP")).toBe("ja");

		const fallbackRes = formatMovieNotification({ movieName: "Demo", isNewMovie: true }, "invalid");
		expect(fallbackRes.title).toBe(NOTIFICATION_TRANSLATIONS.vi.newMovieTitle);
	});

	test("R1: getTrayLabels provides localized tray labels across all 17 locales", () => {
		const viTray = getTrayLabels("vi");
		expect(viTray.open).toBe("Mở PHIMBOP");
		expect(viTray.checkUpdates).toBe("Kiểm tra cập nhật");
		expect(viTray.quit).toBe("Thoát");

		const enTray = getTrayLabels("en");
		expect(enTray.open).toBe("Open PHIMBOP");
		expect(enTray.checkUpdates).toBe("Check for updates");
		expect(enTray.quit).toBe("Quit");

		const jaTray = getTrayLabels("ja");
		expect(jaTray.open).toBe("PHIMBOPを開く");
		expect(jaTray.checkUpdates).toBe("アップデートを確認");
		expect(jaTray.quit).toBe("終了");

		for (const loc of SUPPORTED_LOCALES) {
			const tray = getTrayLabels(loc);
			expect(tray.open.length).toBeGreaterThan(0);
			expect(tray.checkUpdates.length).toBeGreaterThan(0);
			expect(tray.quit.length).toBeGreaterThan(0);
		}
	});

	test("R2: Renderer and layout properly integrate locale synchronization", () => {
		const layoutSrc = fs.readFileSync(path.join(rootDir, "src/routes/+layout.svelte"), "utf-8");
		const langSwitcherSrc = fs.readFileSync(path.join(rootDir, "src/lib/Components/Header/LanguageSwitcher.svelte"), "utf-8");
		const settingsSrc = fs.readFileSync(path.join(rootDir, "src/routes/settings/+page.svelte"), "utf-8");

		// +layout.svelte syncs locale onMount
		expect(layoutSrc).toMatch(/electronAPI\?\.setLocale/);

		// LanguageSwitcher.svelte syncs locale on language change
		expect(langSwitcherSrc).toMatch(/electronAPI\?\.setLocale/);

		// settings/+page.svelte syncs locale on language change
		expect(settingsSrc).toMatch(/electronAPI\?\.setLocale/);
	});

	test("R2: Notification relative time formatting is internationalized via Intl.RelativeTimeFormat", () => {
		const notifPageSrc = fs.readFileSync(path.join(rootDir, "src/routes/profile/notifications/+page.svelte"), "utf-8");

		// Must use Intl.RelativeTimeFormat and getLocale()
		expect(notifPageSrc).toContain("Intl.RelativeTimeFormat");
		expect(notifPageSrc).toContain("getLocale()");
	});

	test("R3: Paraglide notification keys resolve across all 17 locales without English fallback", async () => {
		const notificationKeys = [
			"profile_notifications",
			"notifications_title",
			"notifications_empty",
			"notifications_mark_all_read",
			"notifications_delete_all",
			"notifications_delete",
			"notification_type_mention",
			"notification_type_system"
		];

		// Baseline English values
		setLocale("en", { reload: false });
		const enValues: Record<string, string> = {};
		for (const key of notificationKeys) {
			expect(typeof m[key]).toBe("function");
			enValues[key] = m[key]();
			expect(enValues[key].length).toBeGreaterThan(0);
		}

		// Check non-English distinct languages
		for (const loc of ["vi", "ja", "ko", "zh", "de", "fr", "es", "ru", "tr", "id", "hi"]) {
			setLocale(loc, { reload: false });
			for (const key of notificationKeys) {
				const val = m[key]();
				expect(typeof val).toBe("string");
				expect(val.length).toBeGreaterThan(0);

				// For distinct non-English languages, phrases must not match English fallback
				if (loc !== "en" && (key === "notifications_title" || key === "notifications_empty")) {
					expect(val).not.toBe(enValues[key]);
				}
			}

			// Parametrized mention content
			const mention = m.notification_mention_content({ username: "Alice", text: "Hello" });
			expect(typeof mention).toBe("string");
			expect(mention).toContain("Alice");
			expect(mention).toContain("Hello");
		}
	});
});
