import { describe, expect, it } from 'bun:test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const rootDir = path.resolve(__dirname, '../..');

describe('Production Blockers Remediation Tests (Union Alpha Audit)', () => {
	it('R1: src-tauri/src/lib.rs explicitly handles persistent SQLite storage without silent RAM fallback', () => {
		const libRsPath = path.join(rootDir, 'src-tauri/src/lib.rs');
		expect(fs.existsSync(libRsPath)).toBe(true);

		const content = fs.readFileSync(libRsPath, 'utf-8');

		// Must NOT contain silent fallback to in-memory storage
		expect(content).not.toContain('SqliteStorage::new_in_memory()');
		expect(content).not.toContain('.or_else(|_| SqliteStorage::new_in_memory())');

		// Must explicitly handle SQLite database path and open error
		expect(content).toContain('SqliteStorage::new(&db_path)');
		expect(content).toContain('Failed to open persistent SQLite database');
	});

	it('R2: src-tauri/tauri.conf.json enables bundle.createUpdaterArtifacts for Tauri v2 releases', () => {
		const confPath = path.join(rootDir, 'src-tauri/tauri.conf.json');
		expect(fs.existsSync(confPath)).toBe(true);

		const conf = JSON.parse(fs.readFileSync(confPath, 'utf-8'));
		expect(conf.bundle?.createUpdaterArtifacts).toBe(true);
		expect(conf.plugins?.updater?.pubkey).toBeDefined();
		expect(conf.plugins?.updater?.endpoints?.length).toBeGreaterThan(0);

		// Verify CI workflow specifies signing key
		const releaseWorkflowPath = path.join(rootDir, '.github/workflows/release.yml');
		expect(fs.existsSync(releaseWorkflowPath)).toBe(true);
		const workflowContent = fs.readFileSync(releaseWorkflowPath, 'utf-8');
		expect(workflowContent).toContain('TAURI_SIGNING_PRIVATE_KEY');
		expect(workflowContent).toContain('TAURI_SIGNING_PRIVATE_KEY_PASSWORD');
	});

	it('R3: src-tauri/tauri.conf.json configures frame-src with minimal allowlist matching CardVideoPlay.svelte', () => {
		const confPath = path.join(rootDir, 'src-tauri/tauri.conf.json');
		const conf = JSON.parse(fs.readFileSync(confPath, 'utf-8'));

		const csp = conf.app?.security?.csp;
		const devCsp = conf.app?.security?.devCsp;

		expect(csp).toBeDefined();
		expect(devCsp).toBeDefined();

		// Check required iframe origins
		const requiredOrigins = [
			'https://player.phimbop.top',
			'https://player.videasy.net',
			'https://vidfast.pro'
		];

		for (const origin of requiredOrigins) {
			expect(csp).toContain(origin);
			expect(devCsp).toContain(origin);
		}

		// Check frame-src directive exists and does not use wildcard
		expect(csp).toContain('frame-src');
		expect(devCsp).toContain('frame-src');

		// Extract frame-src directive to check strictness
		const cspMatch = csp.match(/frame-src\s+([^;]+)/);
		expect(cspMatch).not.toBeNull();
		const frameSrcDirective = cspMatch[1];

		// Must NOT contain wildcard *
		expect(frameSrcDirective.split(/\s+/)).not.toContain('*');
		// Must NOT grant ipc: to frame-src
		expect(frameSrcDirective.split(/\s+/)).not.toContain('ipc:');
	});
});
