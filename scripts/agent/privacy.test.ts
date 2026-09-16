import { describe, test, expect, beforeEach } from "bun:test";
import { getPrivacyContent, privacyTranslations } from "../../src/lib/data/privacyTranslations";

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
	locales
} = runtime;

describe("Privacy Policy Multilingual Localization", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	test("Provides complete translations for all 17 supported locales", () => {
		const expectedLocales = [
			"en", "vi", "hi", "ja", "ko", "tr", "id", "zh",
			"ru", "de", "fr", "es", "it", "pt", "pl", "nl", "be"
		];

		expect(locales.length).toBe(17);

		for (const loc of expectedLocales) {
			expect(privacyTranslations[loc]).toBeDefined();
			const content = getPrivacyContent(loc);
			expect(content).toBeDefined();

			// Core headers & SEO
			expect(content.seoTitle).toBeTruthy();
			expect(content.seoDescription).toBeTruthy();
			expect(content.title).toBeTruthy();
			expect(content.lastUpdated).toBeTruthy();
			expect(content.backHome).toBeTruthy();
			expect(content.welcomeIntro).toBeTruthy();

			// Section 1
			expect(content.section1.title).toBeTruthy();
			expect(content.section1.desc).toBeTruthy();
			expect(content.section1.personalInfoLabel).toBeTruthy();
			expect(content.section1.personalInfoText).toBeTruthy();
			expect(content.section1.accessDataLabel).toBeTruthy();
			expect(content.section1.accessDataText).toBeTruthy();
			expect(content.section1.cookieLabel).toBeTruthy();
			expect(content.section1.cookieText).toBeTruthy();

			// Section 2
			expect(content.section2.title).toBeTruthy();
			expect(content.section2.items.length).toBeGreaterThanOrEqual(3);

			// Section 3
			expect(content.section3.title).toBeTruthy();
			expect(content.section3.desc).toBeTruthy();
			expect(content.section3.items.length).toBeGreaterThanOrEqual(2);

			// Section 4
			expect(content.section4.title).toBeTruthy();
			expect(content.section4.items.length).toBeGreaterThanOrEqual(2);

			// Section 5
			expect(content.section5.title).toBeTruthy();
			expect(content.section5.desc).toBeTruthy();

			// Section 6
			expect(content.section6.title).toBeTruthy();
			expect(content.section6.desc).toBeTruthy();
			expect(content.section6.items.length).toBeGreaterThanOrEqual(2);

			// Section 7
			expect(content.section7.title).toBeTruthy();
			expect(content.section7.desc).toBeTruthy();

			// Section 8
			expect(content.section8.title).toBeTruthy();
			expect(content.section8.desc).toBeTruthy();
		}
	});

	test("Gracefully handles fallback for unknown or missing locale", () => {
		const fallback = getPrivacyContent("unknown-locale");
		expect(fallback).toBeDefined();
		expect(fallback.title).toBe("PRIVACY POLICY");
	});

	test("Dynamically updates privacy content when locale changes", () => {
		// Vietnamese
		setLocale("vi", { reload: false });
		let content = getPrivacyContent(getLocale());
		expect(content.title).toBe("CHÍNH SÁCH BẢO MẬT");
		expect(content.backHome).toContain("trang chủ PhimBop");

		// English
		setLocale("en", { reload: false });
		content = getPrivacyContent(getLocale());
		expect(content.title).toBe("PRIVACY POLICY");
		expect(content.backHome).toContain("Back to PhimBop Home");

		// Japanese
		setLocale("ja", { reload: false });
		content = getPrivacyContent(getLocale());
		expect(content.title).toBe("プライバシーポリシー");

		// Chinese
		setLocale("zh", { reload: false });
		content = getPrivacyContent(getLocale());
		expect(content.title).toBe("隐私政策");

		// Korean
		setLocale("ko", { reload: false });
		content = getPrivacyContent(getLocale());
		expect(content.title).toBe("개인정보 처리방침");

		// French
		setLocale("fr", { reload: false });
		content = getPrivacyContent(getLocale());
		expect(content.title).toBe("POLITIQUE DE CONFIDENTIALITÉ");

		// German
		setLocale("de", { reload: false });
		content = getPrivacyContent(getLocale());
		expect(content.title).toBe("DATENSCHUTZERKLÄRUNG");

		// Russian
		setLocale("ru", { reload: false });
		content = getPrivacyContent(getLocale());
		expect(content.title).toBe("ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ");

		// Spanish
		setLocale("es", { reload: false });
		content = getPrivacyContent(getLocale());
		expect(content.title).toBe("POLÍTICA DE PRIVACIDAD");
	});
});
