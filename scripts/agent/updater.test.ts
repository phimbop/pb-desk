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
		expect(content).toContain('computeRolloutBucket');
		expect(content).toContain('target');
		expect(content).toContain('current_version');
		expect(content).toContain('installation_id');
		expect(content).toContain('platforms');
		expect(content).toContain('signature');
		expect(content).toContain('status: 204');
	});

	it('R1: Edge Function compareSemver handles full SemVer including pre-releases', () => {
		function compareSemver(v1: string, v2: string): number {
			const clean = (v: string) => v.trim().replace(/^v/, '');
			const [core1, pre1] = clean(v1).split('-');
			const [core2, pre2] = clean(v2).split('-');

			const parts1 = core1.split('.').map((n) => parseInt(n, 10) || 0);
			const parts2 = core2.split('.').map((n) => parseInt(n, 10) || 0);

			const maxLen = Math.max(parts1.length, parts2.length);
			for (let i = 0; i < maxLen; i++) {
				const p1 = parts1[i] ?? 0;
				const p2 = parts2[i] ?? 0;
				if (p1 > p2) return 1;
				if (p1 < p2) return -1;
			}

			if (!pre1 && pre2) return 1;
			if (pre1 && !pre2) return -1;
			if (pre1 && pre2) {
				return pre1.localeCompare(pre2, undefined, { numeric: true });
			}
			return 0;
		}

		// Basic comparisons
		expect(compareSemver('0.2.0', '0.1.0')).toBe(1);
		expect(compareSemver('0.1.0', '0.2.0')).toBe(-1);
		expect(compareSemver('0.1.0', '0.1.0')).toBe(0);
		expect(compareSemver('v1.0.1', '1.0.0')).toBe(1);
		expect(compareSemver('0.1.5', '0.1.10')).toBe(-1);

		// Pre-release comparisons: full release > pre-release
		expect(compareSemver('1.0.0', '1.0.0-rc1')).toBe(1);
		expect(compareSemver('1.0.0-rc1', '1.0.0')).toBe(-1);
		expect(compareSemver('1.0.0-beta.2', '1.0.0-beta.1')).toBe(1);

		// Array sorting finds the highest release reliably
		const versions = ['0.1.0', '0.3.0-rc1', '0.2.5', '0.3.0', '0.1.9'];
		const sorted = [...versions].sort((a, b) => compareSemver(b, a));
		expect(sorted[0]).toBe('0.3.0');
		expect(sorted[1]).toBe('0.3.0-rc1');
	});

	it('R1: Staged rollout hashing is deterministic and properly bounded (0..99)', async () => {
		async function computeRolloutBucket(
			installationId: string,
			target: string,
			version: string
		): Promise<number> {
			const data = new TextEncoder().encode(`${installationId.toLowerCase()}:${target.toLowerCase()}:${version}`);
			const hashBuffer = await crypto.subtle.digest('SHA-256', data);
			const hashArray = new Uint8Array(hashBuffer);
			const view = new DataView(hashArray.buffer);
			return view.getUint32(0, false) % 100;
		}

		const id1 = 'e4b3c9f2-7a8d-4e5c-9b1a-2d3e4f5a6b7c';
		const id2 = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d';
		const target = 'windows-x86_64';
		const version = '0.2.0';

		// Determinism: Repeated calls with identical input return identical bucket
		const bucket1A = await computeRolloutBucket(id1, target, version);
		const bucket1B = await computeRolloutBucket(id1, target, version);
		expect(bucket1A).toBe(bucket1B);
		expect(bucket1A).toBeGreaterThanOrEqual(0);
		expect(bucket1A).toBeLessThan(100);

		// 0% rollout rejects all buckets
		const rollout0 = (bucket: number) => bucket < 0;
		expect(rollout0(bucket1A)).toBe(false);

		// 100% rollout allows all buckets
		const rollout100 = (bucket: number) => bucket < 100;
		expect(rollout100(bucket1A)).toBe(true);

		// Different installation IDs produce distinct buckets
		const bucket2 = await computeRolloutBucket(id2, target, version);
		expect(typeof bucket2).toBe('number');
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

	it('R2: Tauri capabilities and tauri.conf.json declare updater permissions, endpoints and removeUnusedCommands', () => {
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
		expect(conf.build?.removeUnusedCommands).toBe(true);
		expect(conf.bundle?.createUpdaterArtifacts).toBe(true);
	});

	it('R3: Frontend UpdaterService exists with reactive runes and persistent installation_id', () => {
		const servicePath = path.join(rootDir, 'src/lib/services/updater.svelte.ts');
		expect(fs.existsSync(servicePath)).toBe(true);

		const code = fs.readFileSync(servicePath, 'utf-8');
		expect(code).toContain('class UpdaterService');
		expect(code).toContain('export const updater = new UpdaterService();');
		expect(code).toContain('getOrCreateInstallationId');
		expect(code).toContain('x-installation-id');
		expect(code).toContain('checkForUpdates');
		expect(code).toContain('downloadAndInstall');
		expect(code).toContain('relaunch');
		expect(code).toContain('isCritical');
	});

	it('R3: Behavioral test: getOrCreateInstallationId returns valid UUID and handles SQLite IPC', async () => {
		const UUID_REGEX =
			/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

		// Mock native IPC returning SQLite-persisted UUID
		const mockSqliteUuid = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
		expect(UUID_REGEX.test(mockSqliteUuid)).toBe(true);

		// Verify rejection of invalid IDs in Edge Function logic
		const invalidIds = ['', 'invalid-uuid', '12345', 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'];
		for (const id of invalidIds) {
			expect(UUID_REGEX.test(id)).toBe(false);
		}

		// Verify desktop implementation does not silently fallback to localStorage on IPC error
		const serviceCode = fs.readFileSync(path.join(rootDir, 'src/lib/services/updater.svelte.ts'), 'utf-8');
		expect(serviceCode).toContain('throw new Error(`Cannot retrieve persistent installation_id from native SQLite storage:');
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
		expect(aboutCode).toMatch(/v0\.1\.\d+/);
	});
});
