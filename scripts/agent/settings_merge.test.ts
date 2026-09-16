import { describe, expect, it } from 'bun:test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const rootDir = path.resolve(__dirname, '../..');

describe('Settings and About merge verification', () => {
	it('Sidebar: removes Giới thiệu and configures Settings at slot 3', () => {
		const sidebarPath = path.join(rootDir, 'src/lib/Components/Sidebar/Sidebar.svelte');
		const content = fs.readFileSync(sidebarPath, 'utf-8');

		// Must not have the old gioi-thieu item in sidebar
		expect(content).not.toContain("href={localizeHref('/gioi-thieu')}");
		expect(content).not.toContain("title={m.sidebar_more_tile()}");

		// Must have settings item pointing to /settings
		expect(content).toContain("href={localizeHref('/settings')}");
		expect(content).toContain("title={m.sidebar_settings_title()}");

		// Check menu-bg positioning for /settings and /profile
		expect(content).toContain("currentPath.includes('/settings')");
		expect(content).toContain("translate-y-40");
		expect(content).toContain("translate-y-60");
	});

	it('Settings Layout: has 3 sub-items in correct order (Settings, About, Docs)', () => {
		const layoutPath = path.join(rootDir, 'src/routes/settings/+layout.svelte');
		expect(fs.existsSync(layoutPath)).toBe(true);

		const content = fs.readFileSync(layoutPath, 'utf-8');

		const settingsIdx = content.indexOf("href={localizeHref('/settings')}");
		const aboutIdx = content.indexOf("href={localizeHref('/settings/about')}");
		const docsIdx = content.indexOf("href={localizeHref('/settings/docs')}");

		expect(settingsIdx).toBeGreaterThan(-1);
		expect(aboutIdx).toBeGreaterThan(-1);
		expect(docsIdx).toBeGreaterThan(-1);

		// Must be in exact order: Settings first, then About, then Docs
		expect(settingsIdx).toBeLessThan(aboutIdx);
		expect(aboutIdx).toBeLessThan(docsIdx);

		// Must have breadcrumb support
		expect(content).toContain('breadcrumb');
	});

	it('Settings Pages: all 3 pages exist and have required contents', () => {
		const settingsPage = path.join(rootDir, 'src/routes/settings/+page.svelte');
		const aboutPage = path.join(rootDir, 'src/routes/settings/about/+page.svelte');
		const docsPage = path.join(rootDir, 'src/routes/settings/docs/+page.svelte');

		expect(fs.existsSync(settingsPage)).toBe(true);
		expect(fs.existsSync(aboutPage)).toBe(true);
		expect(fs.existsSync(docsPage)).toBe(true);

		const settingsContent = fs.readFileSync(settingsPage, 'utf-8');
		expect(settingsContent).toContain('api.getAppSettings');
		expect(settingsContent).toContain('settings_language_group');
		expect(settingsContent).toContain('languageOptions');

		const aboutContent = fs.readFileSync(aboutPage, 'utf-8');
		expect(aboutContent).toContain('pageAboutUs_updateInfo');
		expect(aboutContent).toContain('linktr.ee/phimbop');

		const docsContent = fs.readFileSync(docsPage, 'utf-8');
		expect(docsContent).toContain('docs_heading_shortcuts');
		expect(docsContent).toContain('docs_heading_player_controls');
	});

	it('Global link updates: Footer, UserMenu, Profile point to /settings', () => {
		const footerPath = path.join(rootDir, 'src/lib/Components/Footer.svelte');
		const userMenuPath = path.join(rootDir, 'src/lib/Components/Auth/UserMenu.svelte');
		const profilePath = path.join(rootDir, 'src/routes/profile/+page.svelte');

		const footerContent = fs.readFileSync(footerPath, 'utf-8');
		expect(footerContent).toContain("href: '/settings/about'");
		expect(footerContent).toContain("href: '/settings/docs'");

		const userMenuContent = fs.readFileSync(userMenuPath, 'utf-8');
		expect(userMenuContent).toContain("href={localizeHref('/settings')}");
		expect(userMenuContent).not.toContain("href={localizeHref('/cai-dat')}");

		const profileContent = fs.readFileSync(profilePath, 'utf-8');
		expect(profileContent).toContain("href={localizeHref('/settings')}");
		expect(profileContent).not.toContain("href={localizeHref('/cai-dat')}");
	});

	it('Legacy route backward compatibility: old routes redirect to new routes', () => {
		const caiDatPage = path.join(rootDir, 'src/routes/cai-dat/+page.svelte');
		const gioiThieuPage = path.join(rootDir, 'src/routes/gioi-thieu/+page.svelte');
		const gioiThieuDocsPage = path.join(rootDir, 'src/routes/gioi-thieu/huong-dan-su-dung-phimbop/+page.svelte');

		if (fs.existsSync(caiDatPage)) {
			const content = fs.readFileSync(caiDatPage, 'utf-8');
			expect(content).toContain('/settings');
		}

		if (fs.existsSync(gioiThieuPage)) {
			const content = fs.readFileSync(gioiThieuPage, 'utf-8');
			expect(content).toContain('/settings/about');
		}

		if (fs.existsSync(gioiThieuDocsPage)) {
			const content = fs.readFileSync(gioiThieuDocsPage, 'utf-8');
			expect(content).toContain('/settings/docs');
		}
	});
});
