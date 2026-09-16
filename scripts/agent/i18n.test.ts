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
});
