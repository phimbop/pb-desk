import { describe, test, expect } from "bun:test";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "../..");

describe("pb-desk Application Security Gates", () => {
	test("R1: Auto-Updater in electron/main.ts enforces strict HTTPS, origin whitelisting, and extension checks", () => {
		const mainContent = readFileSync(resolve(root, "electron/main.ts"), "utf8");
		expect(mainContent).toContain("isTrustedUpdateUrl");
		expect(mainContent).toContain("parsed.protocol !== 'https:'");
		expect(mainContent).toContain("/phimbop/pb-desk/releases/download/");
		expect(mainContent).toContain("objects.githubusercontent.com");
		expect(mainContent).toContain("Untrusted update download URL");
		expect(mainContent).toContain("isValidExtension");
		expect(mainContent).toContain("Invalid update file extension or name");
	});

	test("R2: Electron BrowserWindow enforces Chromium sandbox, contextIsolation, and disables nodeIntegration", () => {
		const mainContent = readFileSync(resolve(root, "electron/main.ts"), "utf8");
		expect(mainContent).toContain("sandbox: true");
		expect(mainContent).toContain("contextIsolation: true");
		expect(mainContent).toContain("nodeIntegration: false");
		expect(mainContent).toContain("webSecurity: true");
	});

	test("R3: src/lib/index.ts does not contain hardcoded TMDB JWT token", () => {
		const indexContent = readFileSync(resolve(root, "src/lib/index.ts"), "utf8");
		expect(indexContent).not.toContain("S4fccGjfoALSIX9ra2YBljhPwCI5_8sQcdx_iQjC_gs");
		expect(indexContent).not.toMatch(/TMDB_READ_ACCESS_TOKEN_FALLBACK\s*=\s*['"]ey/);
		expect(indexContent).toContain("TMDB_READ_ACCESS_TOKEN_FALLBACK =");
		expect(indexContent).toContain("process.env?.TMDB_READ_ACCESS_TOKEN");
	});

	test("R3: No source files under src/ contain leaked TMDB JWT token", () => {
		const proc = Bun.spawnSync(["git", "grep", "-i", "S4fccGjfoALSIX9ra2YBljhPwCI5_8sQcdx_iQjC_gs", "src/"], { cwd: root });
		expect(proc.exitCode).toBe(1); // exitCode 1 means no match found
	});

	test("R4: crates/pb_service/src/keydb_client.rs routes watching logic via Backend HTTP API using PUBLIC_WEBSITE_URL", () => {
		const keydbClientContent = readFileSync(resolve(root, "crates/pb_service/src/keydb_client.rs"), "utf8");
		expect(keydbClientContent).not.toContain("keydb2.swinglust.top");
		expect(keydbClientContent).not.toContain("6379");
		expect(keydbClientContent).not.toContain("Login@123");
		expect(keydbClientContent).toContain('load_env_var_or_file("PUBLIC_WEBSITE_URL")');
		expect(keydbClientContent).toContain("/api/watching/list");
		expect(keydbClientContent).toContain("/api/watching/heartbeat");
		expect(keydbClientContent).toContain("set_base_url");
	});

	test("R4: src/lib/index.ts and src/lib/ipc.ts use dynamic PUBLIC_WEBSITE_URL and getApiUrl", () => {
		const indexContent = readFileSync(resolve(root, "src/lib/index.ts"), "utf8");
		expect(indexContent).toContain("process.env?.PUBLIC_WEBSITE_URL");
		expect(indexContent).toContain("getApiUrl =");

		const ipcContent = readFileSync(resolve(root, "src/lib/ipc.ts"), "utf8");
		expect(ipcContent).toContain("getApiUrl('/api/watching/list')");
		expect(ipcContent).toContain("getApiUrl('/api/watching/heartbeat')");
		expect(ipcContent).toContain("getApiUrl('/api/auth/login')");
		expect(ipcContent).not.toContain("'https://v3.phimbop.cfd/api/watching/list'");
		expect(ipcContent).not.toContain("'https://v3.phimbop.cfd/api/watching/heartbeat'");
	});

	test("R5: src/lib/ipc.ts does not contain hardcoded Basic cm9vdDpyb290", () => {
		const ipcContent = readFileSync(resolve(root, "src/lib/ipc.ts"), "utf8");
		expect(ipcContent).not.toContain("cm9vdDpyb290");
		expect(ipcContent).not.toContain("Basic root:root");
		expect(ipcContent).toContain("getSurrealHeaders");
	});

	test("R5: No source files under src/ contain hardcoded root base64 credentials", () => {
		const proc = Bun.spawnSync(["git", "grep", "-i", "cm9vdDpyb290", "src/"], { cwd: root });
		expect(proc.exitCode).toBe(1); // exitCode 1 means no match found
	});

	test("R5: crates/pb_service/src/surreal_client.rs does not fall back to root credentials and sanitizes IDs", () => {
		const surrealClientContent = readFileSync(resolve(root, "crates/pb_service/src/surreal_client.rs"), "utf8");
		expect(surrealClientContent).not.toContain('.unwrap_or_else(|| "root".to_string())');
		expect(surrealClientContent).toContain("apply_auth");
		expect(surrealClientContent).toContain("sanitize_id");
		expect(surrealClientContent).toContain("normalize_user_id");
	});

	test("R6: Supabase app_configs migration exists and sets up remote key-value config table", () => {
		const migrationPath = resolve(root, "supabase/migrations/20260918_app_configs.sql");
		expect(existsSync(migrationPath)).toBe(true);
		const sqlContent = readFileSync(migrationPath, "utf8");
		expect(sqlContent).toContain("create table if not exists public.app_configs");
		expect(sqlContent).toContain("key text primary key");
		expect(sqlContent).toContain("value text not null");
		expect(sqlContent).toContain("api_domain");
	});

	test("R6: Dynamic domain discovery in supabase.ts, index.ts, and pb_sidecar set_api_domain IPC", () => {
		const supabaseContent = readFileSync(resolve(root, "src/lib/services/supabase.ts"), "utf8");
		expect(supabaseContent).toContain("getRemoteApiDomain");
		expect(supabaseContent).toContain("app_configs");
		expect(supabaseContent).toContain("api_domain");

		const indexContent = readFileSync(resolve(root, "src/lib/index.ts"), "utf8");
		expect(indexContent).toContain("syncRemoteApiDomain");
		expect(indexContent).toContain("setWebsiteUrl");
		expect(indexContent).toContain("getWebsiteUrl");
		expect(indexContent).toContain("pb_remote_api_domain");

		const sidecarContent = readFileSync(resolve(root, "crates/pb_sidecar/src/main.rs"), "utf8");
		expect(sidecarContent).toContain('"set_api_domain"');
		expect(sidecarContent).toContain("set_api_domain(domain)");
	});
});
