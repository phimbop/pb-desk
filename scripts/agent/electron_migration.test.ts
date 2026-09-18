import { describe, expect, it } from 'bun:test';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

const rootDir = path.resolve(__dirname, '../..');

describe('Complete Migration from Tauri v2 to Electron with Rust Sidecar', () => {
	it('R1: Tauri directory and dependencies are completely removed', () => {
		// 1. src-tauri directory must NOT exist
		expect(fs.existsSync(path.join(rootDir, 'src-tauri'))).toBe(false);

		// 2. package.json must not have any @tauri-apps dependencies
		const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
		const allDeps = {
			...pkg.dependencies,
			...pkg.devDependencies
		};
		const tauriDeps = Object.keys(allDeps).filter((k) => k.startsWith('@tauri-apps/'));
		expect(tauriDeps).toEqual([]);
		expect(pkg.scripts?.tauri).toBeUndefined();

		// 3. Cargo.toml must not include src-tauri
		const rootCargo = fs.readFileSync(path.join(rootDir, 'Cargo.toml'), 'utf-8');
		expect(rootCargo).not.toContain('src-tauri');
		expect(rootCargo).not.toContain('tauri =');
		expect(rootCargo).not.toContain('tauri-plugin-');
	});

	it('R2: Rust sidecar crate is integrated and executes stdio JSON-RPC protocol', () => {
		// 1. pb_sidecar crate exists in Cargo.toml
		const rootCargo = fs.readFileSync(path.join(rootDir, 'Cargo.toml'), 'utf-8');
		expect(rootCargo).toContain('crates/pb_sidecar');

		const sidecarCargo = fs.readFileSync(path.join(rootDir, 'crates/pb_sidecar/Cargo.toml'), 'utf-8');
		expect(sidecarCargo).toContain('name = "pb_sidecar"');

		// 2. Sidecar binary exists
		const sidecarBin = path.join(rootDir, 'target/release/pb-sidecar');
		expect(fs.existsSync(sidecarBin)).toBe(true);

		// 3. Sidecar responds to --check
		const checkRun = spawnSync(sidecarBin, ['--check'], { encoding: 'utf-8' });
		expect(checkRun.status).toBe(0);
		expect(checkRun.stdout.trim()).toBe('OK');

		// 4. Sidecar responds to ping via stdio
		const pingRun = spawnSync(sidecarBin, [], {
			input: '{"id":1,"method":"ping","params":{}}\n',
			encoding: 'utf-8'
		});
		expect(pingRun.status).toBe(0);
		const pingRes = JSON.parse(pingRun.stdout.trim());
		expect(pingRes.id).toBe(1);
		expect(pingRes.result).toBe('pong');

		// 5. Sidecar handles get_app_settings from SQLite
		const settingsRun = spawnSync(sidecarBin, [], {
			input: '{"id":2,"method":"get_app_settings","params":{}}\n',
			encoding: 'utf-8'
		});
		expect(settingsRun.status).toBe(0);
		const settingsRes = JSON.parse(settingsRun.stdout.trim());
		expect(settingsRes.id).toBe(2);
		expect(settingsRes.result?.autostart).toBe(true);
		expect(settingsRes.result?.minimizeToTray).toBe(true);
	});

	it('R3: Electron main process, preload script, and electron-builder packaging are configured', () => {
		// 1. Electron source files exist
		expect(fs.existsSync(path.join(rootDir, 'electron/main.ts'))).toBe(true);
		expect(fs.existsSync(path.join(rootDir, 'electron/preload.ts'))).toBe(true);

		// 2. Bundled electron dist files exist
		expect(fs.existsSync(path.join(rootDir, 'electron/dist/main.cjs'))).toBe(true);
		expect(fs.existsSync(path.join(rootDir, 'electron/dist/preload.cjs'))).toBe(true);

		// 3. Desktop icons preserved in electron/icons
		expect(fs.existsSync(path.join(rootDir, 'electron/icons/32x32.png'))).toBe(true);
		expect(fs.existsSync(path.join(rootDir, 'electron/icons/128x128.png'))).toBe(true);
		expect(fs.existsSync(path.join(rootDir, 'electron/icons/icon.png'))).toBe(true);
		expect(fs.existsSync(path.join(rootDir, 'electron/icons/icon.icns'))).toBe(true);
		expect(fs.existsSync(path.join(rootDir, 'electron/icons/icon.ico'))).toBe(true);

		// 4. electron-builder.json configured
		const builderPath = path.join(rootDir, 'electron-builder.json');
		expect(fs.existsSync(builderPath)).toBe(true);
		const builderConfig = JSON.parse(fs.readFileSync(builderPath, 'utf-8'));
		expect(builderConfig.appId).toBe('com.phimbop.desktop');
		expect(builderConfig.productName).toBe('PHIMBOP');
		expect(builderConfig.extraResources?.some((r: any) => r.from?.includes('pb-sidecar'))).toBe(true);
		expect(builderConfig.linux?.target).toContain('AppImage');
		expect(builderConfig.mac?.target).toContain('dmg');
		expect(builderConfig.win?.target).toContain('nsis');

		// 5. package.json main entry points to electron dist
		const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
		expect(pkg.main).toBe('electron/dist/main.cjs');
		expect(pkg.devDependencies?.electron).toBeDefined();
		expect(pkg.devDependencies?.['electron-builder']).toBeDefined();
	});

	it('R4: Frontend IPC and Opener communicate via Electron API while maintaining web fallback', () => {
		const ipcContent = fs.readFileSync(path.join(rootDir, 'src/lib/ipc.ts'), 'utf-8');
		expect(ipcContent).toContain('isElectron');
		expect(ipcContent).toContain('electronAPI');
		expect(ipcContent).not.toContain('@tauri-apps/api');
		expect(ipcContent).not.toContain('@tauri-apps/plugin');

		const openerContent = fs.readFileSync(path.join(rootDir, 'src/lib/utils/opener.ts'), 'utf-8');
		expect(openerContent).toContain('openExternal');
		expect(openerContent).not.toContain('@tauri-apps');

		const layoutContent = fs.readFileSync(path.join(rootDir, 'src/routes/+layout.svelte'), 'utf-8');
		expect(layoutContent).toContain('movie-update');
		expect(layoutContent).not.toContain('@tauri-apps');

		const updaterContent = fs.readFileSync(path.join(rootDir, 'src/lib/services/updater.svelte.ts'), 'utf-8');
		expect(updaterContent).toContain('updater');
		expect(updaterContent).not.toContain('@tauri-apps');
	});

	it('R5: Packaged application bundle contains all resources and executable sidecar', () => {
		const unpackedDir = path.join(rootDir, 'dist-electron/linux-unpacked');
		if (fs.existsSync(unpackedDir)) {
			const sidecarResource = path.join(unpackedDir, 'resources/bin/pb-sidecar');
			expect(fs.existsSync(sidecarResource)).toBe(true);

			// Test sidecar in packaged app responds to JSON-RPC ping
			const checkPackaged = spawnSync(sidecarResource, [], {
				input: '{"id":"pkg-test","method":"ping"}\n',
				encoding: 'utf-8'
			});
			expect(checkPackaged.status).toBe(0);
			const parsed = JSON.parse(checkPackaged.stdout.trim());
			expect(parsed.result).toBe('pong');
		}
	});

	it('R6: Sidecar handles complete suite of CRUD methods and state persistence', () => {
		const sidecarBin = path.join(rootDir, 'target/release/pb-sidecar');
		const testDataDir = path.join(rootDir, `target/test_sidecar_data_${Date.now()}`);
		fs.mkdirSync(testDataDir, { recursive: true });

		// 1. Save history & favorite
		const saveBatch = [
			JSON.stringify({ id: 10, method: 'get_installation_id' }),
			JSON.stringify({
				id: 20,
				method: 'save_watch_history',
				params: {
					req: {
						movie_slug: 'audit-test-slug',
						movie_name: 'Audit Test Movie',
						poster_url: 'https://example.com/poster.jpg',
						episode_name: 'Tap 01',
						episode_slug: 'tap-01',
						link_m3u8: 'https://example.com/stream.m3u8',
						duration: 1000,
						current_time: 150,
						progress_percent: 15.0
					}
				}
			}),
			JSON.stringify({
				id: 30,
				method: 'toggle_favorite',
				params: {
					req: {
						movie_slug: 'audit-fav-slug',
						movie_name: 'Audit Favorite Movie',
						origin_name: 'Audit Fav Original',
						poster_url: 'https://example.com/fav.jpg',
						year: 2025,
						quality: 'HD',
						episode_current: 'Tap 1'
					}
				}
			})
		].join('\n') + '\n';

		const run1 = spawnSync(sidecarBin, ['--data-dir', testDataDir], {
			input: saveBatch,
			encoding: 'utf-8'
		});
		expect(run1.status).toBe(0);

		// 2. Query history & favorite
		const queryBatch = [
			JSON.stringify({ id: 21, method: 'get_watch_history', params: { limit: 10 } }),
			JSON.stringify({ id: 31, method: 'is_favorite', params: { movie_slug: 'audit-fav-slug' } }),
			JSON.stringify({ id: 32, method: 'get_favorites', params: { page: 1, limit: 10 } })
		].join('\n') + '\n';

		const run2 = spawnSync(sidecarBin, ['--data-dir', testDataDir], {
			input: queryBatch,
			encoding: 'utf-8'
		});
		expect(run2.status).toBe(0);
		const lines2 = run2.stdout.trim().split('\n').map((l) => JSON.parse(l));

		const historyResp = lines2.find((l) => l.id === 21);
		expect(Array.isArray(historyResp?.result)).toBe(true);
		expect(historyResp?.result?.some((x: any) => x.movie_slug === 'audit-test-slug')).toBe(true);

		const isFavResp = lines2.find((l) => l.id === 31);
		expect(isFavResp?.result).toBe(true);

		const favListResp = lines2.find((l) => l.id === 32);
		expect(favListResp?.result?.items?.some((x: any) => x.movie_slug === 'audit-fav-slug')).toBe(true);

		// 3. Delete and verify deletion
		const runDelete = spawnSync(sidecarBin, ['--data-dir', testDataDir], {
			input: JSON.stringify({ id: 40, method: 'delete_watch_history', params: { movie_slug: 'audit-test-slug' } }) + '\n',
			encoding: 'utf-8'
		});
		expect(runDelete.status).toBe(0);

		const runAfterDelete = spawnSync(sidecarBin, ['--data-dir', testDataDir], {
			input: JSON.stringify({ id: 41, method: 'get_watch_history', params: { limit: 10 } }) + '\n',
			encoding: 'utf-8'
		});
		expect(runAfterDelete.status).toBe(0);
		const lines3 = runAfterDelete.stdout.trim().split('\n').map((l) => JSON.parse(l));
		const afterDelete = lines3.find((l) => l.id === 41);
		expect(afterDelete?.result?.some((x: any) => x.movie_slug === 'audit-test-slug')).toBe(false);

		// Clean up test data dir
		fs.rmSync(testDataDir, { recursive: true, force: true });
	});
});
