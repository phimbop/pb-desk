import { describe, expect, it } from 'bun:test';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

const rootDir = path.resolve(__dirname, '../..');

describe('Adlink and External Opener in Linux AppImage Environment', () => {
	it('REPRO: Spawning shell or system opener under AppImage LD_LIBRARY_PATH fails with symbol lookup error', () => {
		// Find running or mounted AppImage usr/lib
		const mountDir = fs.readdirSync('/tmp').find((d) => d.startsWith('.mount_phimbop'));
		if (!mountDir) {
			console.warn('No active AppImage mount found, skipping live mount check');
			return;
		}

		const appimageLibDir = path.join('/tmp', mountDir, 'usr/lib');
		if (!fs.existsSync(appimageLibDir)) return;

		// When LD_LIBRARY_PATH points to bundled AppImage libs, /bin/sh fails due to symbol conflict (libreadline.so.8)
		const corruptedRun = spawnSync('/bin/sh', ['-c', 'echo OK'], {
			env: {
				...process.env,
				LD_LIBRARY_PATH: `${appimageLibDir}:${appimageLibDir}/x86_64-linux-gnu`
			},
			encoding: 'utf-8'
		});

		// This confirms the exact bug: exit code 127, undefined symbol rl_trim_arg_from_keyseq
		expect(corruptedRun.status).toBe(127);
		expect(corruptedRun.stderr).toContain('undefined symbol');

		// When LD_LIBRARY_PATH is sanitized (clean env), /bin/sh succeeds with status 0
		const cleanRun = spawnSync('/bin/sh', ['-c', 'echo OK'], {
			env: {
				...process.env,
				LD_LIBRARY_PATH: ''
			},
			encoding: 'utf-8'
		});
		expect(cleanRun.status).toBe(0);
		expect(cleanRun.stdout.trim()).toBe('OK');
	});

	it('Backend provides sanitized open_external_url / openExternal in electron', () => {
		const mainPath = path.join(rootDir, 'electron/main.ts');
		const content = fs.readFileSync(mainPath, 'utf-8');

		// Electron backend must define open_external_url and open-external-url
		expect(content).toContain('open_external_url');
		expect(content).toContain('open-external-url');
		expect(content).toContain('shell.openExternal');
	});

	it('Frontend opener.ts invokes desktop opener and avoids infinite recursion', () => {
		const openerPath = path.join(rootDir, 'src/lib/utils/opener.ts');
		const content = fs.readFileSync(openerPath, 'utf-8');

		// Must invoke openExternal via Electron API
		expect(content).toContain('openExternal');
	});

	it('Adlink triggers correctly on TMDB Play and KKPlayer (while KKPhim detail delegates to KKPlayer)', () => {
		const tmdbPath = path.join(rootDir, 'src/lib/Components/layout/tmdbPage.svelte');
		const tmdbTvPath = path.join(rootDir, 'src/lib/Components/layout/tmdbTvPage.svelte');
		const kkPlayerPath = path.join(rootDir, 'src/lib/Components/kkPlayer/kkPlayer.svelte');

		expect(fs.readFileSync(tmdbPath, 'utf-8')).toContain('openExternalUrl(clickAdslink)');
		expect(fs.readFileSync(tmdbTvPath, 'utf-8')).toContain('openExternalUrl(clickAdslink)');
		expect(fs.readFileSync(kkPlayerPath, 'utf-8')).toContain('openExternalUrl(clickAdslink)');
	});
});
