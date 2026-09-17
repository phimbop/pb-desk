import { describe, expect, it } from 'bun:test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const rootDir = path.resolve(__dirname, '../..');

describe('Linux AppImage Media Framework and v0.1.7 Consistency', () => {
	it('R1: tauri.conf.json enables bundleMediaFramework for Linux AppImage', () => {
		const confPath = path.join(rootDir, 'src-tauri/tauri.conf.json');
		expect(fs.existsSync(confPath)).toBe(true);

		const conf = JSON.parse(fs.readFileSync(confPath, 'utf-8'));
		expect(conf.bundle?.linux?.appimage?.bundleMediaFramework).toBe(true);
		expect(conf.version).toBe('0.1.7');
	});

	it('R1: release.yml installs full GStreamer codecs for Ubuntu runner', () => {
		const workflowPath = path.join(rootDir, '.github/workflows/release.yml');
		expect(fs.existsSync(workflowPath)).toBe(true);

		const content = fs.readFileSync(workflowPath, 'utf-8');
		expect(content).toContain('gstreamer1.0-plugins-base');
		expect(content).toContain('gstreamer1.0-plugins-good');
		expect(content).toContain('gstreamer1.0-plugins-bad');
		expect(content).toContain('gstreamer1.0-plugins-ugly');
		expect(content).toContain('gstreamer1.0-libav');
	});

	it('R2: All Cargo crate manifests and package.json are bumped to 0.1.7', () => {
		const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
		expect(pkg.version).toBe('0.1.7');

		const cargoFiles = [
			'src-tauri/Cargo.toml',
			'crates/pb_core/Cargo.toml',
			'crates/pb_ipc/Cargo.toml',
			'crates/pb_service/Cargo.toml',
			'crates/pb_storage/Cargo.toml'
		];

		for (const file of cargoFiles) {
			const content = fs.readFileSync(path.join(rootDir, file), 'utf-8');
			expect(content).toMatch(/version\s*=\s*"0\.1\.7"/);
		}
	});

	it('R2 & R3: UI about page, updater service, and sync script reference 0.1.7', () => {
		const aboutPath = path.join(rootDir, 'src/routes/settings/about/+page.svelte');
		const aboutContent = fs.readFileSync(aboutPath, 'utf-8');
		expect(aboutContent).toContain('v0.1.7');

		const updaterPath = path.join(rootDir, 'src/lib/services/updater.svelte.ts');
		const updaterContent = fs.readFileSync(updaterPath, 'utf-8');
		expect(updaterContent).toContain("const currentVersion = '0.1.7'");

		const syncScriptPath = path.join(rootDir, 'scripts/agent/sync_supabase_versions.ts');
		const syncContent = fs.readFileSync(syncScriptPath, 'utf-8');
		expect(syncContent).toContain('v0.1.7');
	});
});
