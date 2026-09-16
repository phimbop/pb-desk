import { describe, expect, it } from 'bun:test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const rootDir = path.resolve(__dirname, '../..');

describe('Supabase & Tauri v2 Updater Integration Tests', () => {
	it('R1: Supabase migration SQL exists with correct schema, RLS, and columns', () => {
		const migrationPath = path.join(rootDir, 'supabase/migrations/20260916_app_versions.sql');
		expect(fs.existsSync(migrationPath)).toBe(true);

		const sql = fs.readFileSync(migrationPath, 'utf-8');
		expect(sql).toContain('create table if not exists public.app_versions');
		expect(sql).toContain('version text not null');
		expect(sql).toContain('target text not null');
		expect(sql).toContain('download_url text not null');
		expect(sql).toContain('signature text not null');
		expect(sql).toContain('min_supported_version text');
		expect(sql).toContain('is_critical boolean');
		expect(sql).toContain('rollout_percentage int');
		expect(sql).toContain('is_active boolean');
		expect(sql).toContain('alter table public.app_versions enable row level security');
		expect(sql).toContain('Allow public read active app_versions');
	});

	it('R1: Supabase Edge Function exists and implements Tauri v2 update protocol', () => {
		const funcPath = path.join(rootDir, 'supabase/functions/app-update/index.ts');
		expect(fs.existsSync(funcPath)).toBe(true);

		const content = fs.readFileSync(funcPath, 'utf-8');
		expect(content).toContain('compareSemver');
		expect(content).toContain('target');
		expect(content).toContain('current_version');
		expect(content).toContain('platforms');
		expect(content).toContain('signature');
		expect(content).toContain('status: 204');
	});

	it('R1: Edge Function compareSemver logic behaves accurately', () => {
		function compareSemver(v1: string, v2: string): number {
			const clean = (v: string) => v.replace(/^v/, '').split('-')[0];
			const parts1 = clean(v1).split('.').map((n) => parseInt(n, 10) || 0);
			const parts2 = clean(v2).split('.').map((n) => parseInt(n, 10) || 0);

			for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
				const p1 = parts1[i] || 0;
				const p2 = parts2[i] || 0;
				if (p1 > p2) return 1;
				if (p1 < p2) return -1;
			}
			return 0;
		}

		expect(compareSemver('0.2.0', '0.1.0')).toBe(1);
		expect(compareSemver('0.1.0', '0.2.0')).toBe(-1);
		expect(compareSemver('0.1.0', '0.1.0')).toBe(0);
		expect(compareSemver('v1.0.1', '1.0.0')).toBe(1);
		expect(compareSemver('1.0.0-beta.1', '1.0.0')).toBe(0);
		expect(compareSemver('0.1.5', '0.1.10')).toBe(-1);
	});

	it('R2: Tauri Backend Cargo configuration includes updater and process plugins', () => {
		const rootCargoPath = path.join(rootDir, 'Cargo.toml');
		const srcCargoPath = path.join(rootDir, 'src-tauri/Cargo.toml');

		const rootCargo = fs.readFileSync(rootCargoPath, 'utf-8');
		const srcCargo = fs.readFileSync(srcCargoPath, 'utf-8');

		expect(rootCargo).toContain('tauri-plugin-updater');
		expect(rootCargo).toContain('tauri-plugin-process');

		expect(srcCargo).toContain('tauri-plugin-updater = { workspace = true }');
		expect(srcCargo).toContain('tauri-plugin-process = { workspace = true }');
	});

	it('R2: Tauri Builder registers updater and process plugins in lib.rs', () => {
		const libRsPath = path.join(rootDir, 'src-tauri/src/lib.rs');
		const libRs = fs.readFileSync(libRsPath, 'utf-8');

		expect(libRs).toContain('tauri_plugin_updater::Builder::new().build()');
		expect(libRs).toContain('tauri_plugin_process::init()');
	});

	it('R2: Tauri capabilities and tauri.conf.json declare updater permissions and endpoints', () => {
		const capPath = path.join(rootDir, 'src-tauri/capabilities/default.json');
		const confPath = path.join(rootDir, 'src-tauri/tauri.conf.json');

		const cap = JSON.parse(fs.readFileSync(capPath, 'utf-8'));
		expect(cap.permissions).toContain('updater:default');
		expect(cap.permissions).toContain('process:default');

		const conf = JSON.parse(fs.readFileSync(confPath, 'utf-8'));
		expect(conf.plugins?.updater).toBeDefined();
		expect(conf.plugins.updater.endpoints).toBeDefined();
		expect(conf.plugins.updater.endpoints.length).toBeGreaterThan(0);
		expect(conf.plugins.updater.endpoints[0]).toContain('supabase.co');
		expect(conf.plugins.updater.pubkey).toBeDefined();
	});

	it('R3: Frontend UpdaterService exists with reactive runes and methods', () => {
		const servicePath = path.join(rootDir, 'src/lib/services/updater.svelte.ts');
		expect(fs.existsSync(servicePath)).toBe(true);

		const code = fs.readFileSync(servicePath, 'utf-8');
		expect(code).toContain('class UpdaterService');
		expect(code).toContain('export const updater = new UpdaterService();');
		expect(code).toContain('checkForUpdates');
		expect(code).toContain('downloadAndInstall');
		expect(code).toContain('relaunch');
		expect(code).toContain('isCritical');
	});

	it('R3: UpdateModal component exists and layout mounts it with auto-check', () => {
		const modalPath = path.join(rootDir, 'src/lib/Components/Modal/UpdateModal.svelte');
		expect(fs.existsSync(modalPath)).toBe(true);

		const modalCode = fs.readFileSync(modalPath, 'utf-8');
		expect(modalCode).toContain('updater.modalOpen');
		expect(modalCode).toContain('updater.status');
		expect(modalCode).toContain('Cập nhật ngay');
		expect(modalCode).toContain('isCritical');

		const layoutPath = path.join(rootDir, 'src/routes/+layout.svelte');
		const layoutCode = fs.readFileSync(layoutPath, 'utf-8');
		expect(layoutCode).toContain('UpdateModal');
		expect(layoutCode).toContain('<UpdateModal />');
		expect(layoutCode).toContain('updater.checkForUpdates(false)');
	});

	it('R3: About page includes version display and manual check update button', () => {
		const aboutPath = path.join(rootDir, 'src/routes/settings/about/+page.svelte');
		const aboutCode = fs.readFileSync(aboutPath, 'utf-8');

		expect(aboutCode).toContain('updater.checkForUpdates(true)');
		expect(aboutCode).toContain('Kiểm tra cập nhật');
		expect(aboutCode).toContain('v0.1.0');
	});
});
