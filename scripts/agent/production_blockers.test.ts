import { describe, expect, it } from 'bun:test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const rootDir = path.resolve(__dirname, '../..');

describe('Production Blockers Remediation Tests (Union Alpha Audit)', () => {
	it('R1: crates/pb_sidecar/src/main.rs explicitly handles persistent SQLite storage without silent RAM fallback', () => {
		const sidecarRsPath = path.join(rootDir, 'crates/pb_sidecar/src/main.rs');
		expect(fs.existsSync(sidecarRsPath)).toBe(true);

		const content = fs.readFileSync(sidecarRsPath, 'utf-8');

		// Must NOT contain silent fallback to in-memory storage
		expect(content).not.toContain('SqliteStorage::new_in_memory()');
		expect(content).not.toContain('.or_else(|_| SqliteStorage::new_in_memory())');

		// Must explicitly handle SQLite database path and open error
		expect(content).toContain('SqliteStorage::new(&db_path)');
		expect(content).toContain('Failed to open persistent SQLite database');
	});

	it('R2: electron-builder.json enables multiplatform targets and extraResources for pb-sidecar', () => {
		const confPath = path.join(rootDir, 'electron-builder.json');
		expect(fs.existsSync(confPath)).toBe(true);

		const conf = JSON.parse(fs.readFileSync(confPath, 'utf-8'));
		expect(conf.extraResources?.some((r: any) => r.from?.includes('pb-sidecar'))).toBe(true);
		expect(conf.linux?.target).toContain('AppImage');
		expect(conf.appId).toBe('com.phimbop.desktop');
	});

	it('R3: CardVideoPlay.svelte configures verified minimal player origins', () => {
		const cardPath = path.join(rootDir, 'src/lib/Components/Card/CardVideoPlay.svelte');
		expect(fs.existsSync(cardPath)).toBe(true);
		const content = fs.readFileSync(cardPath, 'utf-8');

		const requiredOrigins = [
			'player.swinglust.top',
			'player.videasy.to',
			'vidfast.vc'
		];

		for (const origin of requiredOrigins) {
			expect(content).toContain(origin);
		}
	});
});
