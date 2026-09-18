import { describe, expect, it } from 'bun:test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const rootDir = path.resolve(__dirname, '../..');

describe('Production Media Streaming and TMDB Acceptance Tests', () => {
	it('R1: vite.config.ts defines required Supabase and TMDB environment definitions for desktop build', () => {
		const vitePath = path.join(rootDir, 'vite.config.ts');
		expect(fs.existsSync(vitePath)).toBe(true);

		const content = fs.readFileSync(vitePath, 'utf-8');
		expect(content).toContain('TMDB_READ_ACCESS_TOKEN');
		expect(content).toContain('SUPABASE_URL');
		expect(content).toContain('SUPABASE_ANON_KEY');
	});

	it('R2: GitHub Actions release workflow provides TMDB and Supabase credentials during build', () => {
		const workflowPath = path.join(rootDir, '.github/workflows/release.yml');
		expect(fs.existsSync(workflowPath)).toBe(true);

		const content = fs.readFileSync(workflowPath, 'utf-8');
		expect(content).toContain('TMDB_READ_ACCESS_TOKEN');
		expect(content).toContain('SUPABASE_URL');
		expect(content).toContain('SUPABASE_ANON_KEY');
	});

	it('R3: TMDB client code provides fallback token so desktop build never crashes on TMDB API', () => {
		const indexPath = path.join(rootDir, 'src/lib/index.ts');
		const tmdbServicePath = path.join(rootDir, 'src/lib/services/tmdbService.ts');

		expect(fs.existsSync(indexPath)).toBe(true);
		expect(fs.existsSync(tmdbServicePath)).toBe(true);

		const indexContent = fs.readFileSync(indexPath, 'utf-8');
		const tmdbContent = fs.readFileSync(tmdbServicePath, 'utf-8');

		expect(indexContent).toContain('TMDB_READ_ACCESS_TOKEN');
		expect(tmdbContent).toContain('TMDB_READ_ACCESS_TOKEN');

		// Both must have fallback token mechanism
		expect(indexContent).toMatch(/TMDB_READ_ACCESS_TOKEN.*\|\|/);
		expect(tmdbContent).toMatch(/TMDB_READ_ACCESS_TOKEN.*\|\|/);
	});

	it('R4: TabPhimMoi and TabNenXem guard against infinite re-fetch loops when results are empty', () => {
		const tabPhimMoiPath = path.join(rootDir, 'src/lib/Components/Menu/TabPhimMoi.svelte');
		const tabNenXemPath = path.join(rootDir, 'src/lib/Components/Menu/TabNenXem.svelte');

		expect(fs.existsSync(tabPhimMoiPath)).toBe(true);
		expect(fs.existsSync(tabNenXemPath)).toBe(true);

		const phimMoiContent = fs.readFileSync(tabPhimMoiPath, 'utf-8');
		const nenXemContent = fs.readFileSync(tabNenXemPath, 'utf-8');

		// Guard mechanism should prevent repeated fetch calls on same page
		expect(phimMoiContent).toContain('lastFetchedPage');
		expect(nenXemContent).toContain('lastFetchedPage');
	});
});
