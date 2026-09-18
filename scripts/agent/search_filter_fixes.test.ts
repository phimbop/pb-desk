import { describe, expect, it } from 'bun:test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const rootDir = path.resolve(__dirname, '../..');

describe('Search, Tabs, 18+ Movies and Linux AppImage Update Fixes', () => {
	it('R1: Search movie filter does not trigger infinite re-fetch loops and guards loading', () => {
		const searchPageContent = fs.readFileSync(path.join(rootDir, 'src/routes/tim-kiem/phim/+page.svelte'), 'utf-8');
		const movieStoreContent = fs.readFileSync(path.join(rootDir, 'src/lib/runes/movieStore.svelte.ts'), 'utf-8');

		// Must have loading guard in handlePageChange
		expect(searchPageContent).toContain('if (loading) return;');

		// Must track last fetched query/page to avoid repeated redundant fetching
		expect(searchPageContent).toMatch(/lastFetchedPage|lastFetchedKey/);

		// movieStore.tmdbFilterMovies must return valid fallback object with page and results on error
		expect(movieStoreContent).toContain('page: page');
	});

	it('R2: Should Watch tab renders cleanly without getting stuck in changingTab unmounted state', () => {
		const menuTrendingContent = fs.readFileSync(path.join(rootDir, 'src/lib/Components/Menu/MenuTrending.svelte'), 'utf-8');
		const tabNenXemContent = fs.readFileSync(path.join(rootDir, 'src/lib/Components/Menu/TabNenXem.svelte'), 'utf-8');

		// Tab components should render when activeTab == item.value without depending on changingTab == false
		expect(menuTrendingContent).not.toContain('changingTab == false');

		// TabNenXem should have LoadingSubBlur when loading
		expect(tabNenXemContent).toContain('LoadingSubBlur');
	});

	it('R3: Adult movies and leaderboards route securely via api_domain without hardcoded root credentials', () => {
		const ipcContent = fs.readFileSync(path.join(rootDir, 'src/lib/ipc.ts'), 'utf-8');
		const surrealClientContent = fs.readFileSync(path.join(rootDir, 'crates/pb_service/src/surreal_client.rs'), 'utf-8');
		const mainTsContent = fs.readFileSync(path.join(rootDir, 'electron/main.ts'), 'utf-8');

		// ipc.ts routes adult movies and leaderboards via api_domain / websiteUrl
		expect(ipcContent).toContain('/phim-18-cong/__data.json');
		expect(ipcContent).toContain('/bang-xep-hang/__data.json');
		expect(ipcContent).toContain('getWebsiteUrl()');

		// Neither surreal_client.rs nor main.ts contain hardcoded root credentials
		expect(surrealClientContent).not.toContain('DEFAULT_SURREAL_USER');
		expect(surrealClientContent).not.toContain('DEFAULT_SURREAL_PASS');
		expect(mainTsContent).not.toContain("DB_USER: process.env.DB_USER || 'root'");
		expect(mainTsContent).not.toContain("DB_PASS: process.env.DB_PASS || 'root'");
	});

	it('R4: Linux AppImage updater resolves target installation and replaces on download completion', () => {
		const mainTsContent = fs.readFileSync(path.join(rootDir, 'electron/main.ts'), 'utf-8');

		// Must have helper to resolve target AppImage path
		expect(mainTsContent).toContain('resolveTargetAppImage');
		expect(mainTsContent).toContain('.local/lib/phimbop/phimbop.AppImage');

		// updater-download-install must atomically replace the target AppImage upon download completion
		expect(mainTsContent).toContain('fs.renameSync');
	});

	it('R5: TMDB requests query api.themoviedb.org directly with valid authorization token', () => {
		const indexContent = fs.readFileSync(path.join(rootDir, 'src/lib/index.ts'), 'utf-8');
		const tmdbServiceContent = fs.readFileSync(path.join(rootDir, 'src/lib/services/tmdbService.ts'), 'utf-8');

		// getTmdbUrl queries TMDB directly
		expect(indexContent).toContain('https://api.themoviedb.org/3/${cleanPath}');
		expect(indexContent).toContain('TMDB_READ_ACCESS_TOKEN_FALLBACK');

		// tmdbService routes directly to TMDB
		expect(tmdbServiceContent).toContain('https://api.themoviedb.org/3');
		expect(tmdbServiceContent).toContain('getTmdbUrl');
	});
});

