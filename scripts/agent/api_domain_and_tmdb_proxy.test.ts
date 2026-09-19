import { describe, expect, it } from 'bun:test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const rootDir = path.resolve(__dirname, '../..');

describe('Dynamic API Domain, TMDB Reverse Proxy & CORS Adaptation', () => {
	it('R1: crates/pb_storage implements get_app_config and set_app_config on SqliteStorage', () => {
		const sqlitePath = path.join(rootDir, 'crates/pb_storage/src/sqlite.rs');
		expect(fs.existsSync(sqlitePath)).toBe(true);

		const content = fs.readFileSync(sqlitePath, 'utf-8');
		expect(content).toContain('pub fn get_app_config');
		expect(content).toContain('pub fn set_app_config');
		expect(content).toContain("WHERE key = ?1");
		expect(content).toContain("INSERT INTO app_settings");
	});

	it('R1: crates/pb_sidecar resolves api_domain hierarchy on startup and persists on set_api_domain', () => {
		const mainPath = path.join(rootDir, 'crates/pb_sidecar/src/main.rs');
		expect(fs.existsSync(mainPath)).toBe(true);

		const content = fs.readFileSync(mainPath, 'utf-8');
		expect(content).toContain('get_app_config("api_domain")');
		expect(content).toContain('set_app_config("api_domain"');
		expect(content).toContain('"get_api_domain"');
		expect(content).toContain('"set_api_domain"');
	});

	it('R2: src/lib/index.ts routes TMDB requests through reverse proxy via getWebsiteUrl() and avoids CORS preflight', () => {
		const indexPath = path.join(rootDir, 'src/lib/index.ts');
		expect(fs.existsSync(indexPath)).toBe(true);

		const content = fs.readFileSync(indexPath, 'utf-8');
		expect(content).toContain('/api/tmdb/');
		expect(content).toContain('getWebsiteUrl()');
		expect(content).toContain('https://api.themoviedb.org/3/');
		expect(content).toContain('isDirectTmdb');
		expect(content).toContain("accept: 'application/json'");
	});

	it('R3: electron/main.ts dynamically injects CORS headers, overrides OPTIONS status, and strips proxy auth', () => {
		const mainPath = path.join(rootDir, 'electron/main.ts');
		expect(fs.existsSync(mainPath)).toBe(true);

		const content = fs.readFileSync(mainPath, 'utf-8');
		expect(content).toContain('access-control-allow-origin');
		expect(content).toContain('access-control-allow-methods');
		expect(content).toContain('access-control-allow-headers');
		expect(content).toContain('activeApiDomain');
		expect(content).toContain('set_api_domain');
		expect(content).toContain('onBeforeSendHeaders');
		expect(content).toContain("delete requestHeaders['Authorization']");
		expect(content).toContain("details.method === 'OPTIONS'");
		expect(content).toContain("statusLine: 'HTTP/1.1 200 OK'");
	});

	it('R4: crates/pb_service/src/auth_service.rs forwards auth and user requests directly to remote API', () => {
		const authPath = path.join(rootDir, 'crates/pb_service/src/auth_service.rs');
		expect(fs.existsSync(authPath)).toBe(true);

		const content = fs.readFileSync(authPath, 'utf-8');
		expect(content).toContain('forward_remote');
		// forward_request should delegate to forward_remote
		expect(content).toMatch(/pub async fn forward_request[\s\S]*?forward_remote/);
		// Should not intercept favorites or login into surreal_client
		expect(content).not.toContain('self.surreal_client.add_user_favorite');
		expect(content).not.toContain('self.surreal_client.get_user_favorites');
	});

	it('R4: crates/pb_service/src/movie_service.rs gracefully handles SurrealDB errors without crashing client with 403', () => {
		const moviePath = path.join(rootDir, 'crates/pb_service/src/movie_service.rs');
		expect(fs.existsSync(moviePath)).toBe(true);

		const content = fs.readFileSync(moviePath, 'utf-8');
		expect(content).toContain('pub async fn get_adult_movies');
		expect(content).toContain('pub async fn get_leaderboards');
		// Verify error handlers return Ok fallback instead of bubbling up 403 error
		expect(content).toMatch(/get_adult_movies[\s\S]*?Ok\(Vec::new\(\)\)/);
		expect(content).toMatch(/get_leaderboards[\s\S]*?Ok\(Leaderboards::default\(\)\)/);
	});

	it('R5: movieStore.svelte.ts provides resilient fallback to direct TMDB API if proxy fails', () => {
		const movieStorePath = path.join(rootDir, 'src/lib/runes/movieStore.svelte.ts');
		expect(fs.existsSync(movieStorePath)).toBe(true);

		const content = fs.readFileSync(movieStorePath, 'utf-8');
		expect(content).toContain('https://api.themoviedb.org/3/movie/${listMovieType}');
		expect(content).toContain('https://api.themoviedb.org/3/movie/top_rated');
		expect(content).toContain('retrying direct TMDB');
	});
});
