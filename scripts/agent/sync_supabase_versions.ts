import { createClient } from '@supabase/supabase-js';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Parse .env if variables are not already in process.env
const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
	const envLines = fs.readFileSync(envPath, 'utf-8').split('\n');
	for (const line of envLines) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const eqIndex = trimmed.indexOf('=');
		if (eqIndex > 0) {
			const key = trimmed.slice(0, eqIndex).trim();
			const val = trimmed.slice(eqIndex + 1).trim();
			if (!process.env[key]) {
				process.env[key] = val;
			}
		}
	}
}

const supabaseUrl = process.env.SUPABASE_URL || 'https://nhxgdsanykpnmghtohfz.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
	console.error('SUPABASE_SERVICE_ROLE_KEY is required in .env');
	process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

interface PlatformArtifact {
	signature: string;
	url: string;
}

interface TauriLatestJson {
	version: string;
	notes: string;
	pub_date: string;
	platforms: Record<string, PlatformArtifact>;
}

export async function syncReleaseToSupabase(tag: string) {
	let manifest: TauriLatestJson | null = null;
	const latestJsonUrl = `https://github.com/phimbop/pb-desk/releases/download/${tag}/latest.json`;
	console.log(`Fetching release manifest for ${tag}: ${latestJsonUrl}`);

	const res = await fetch(latestJsonUrl);
	if (res.ok) {
		manifest = (await res.json()) as TauriLatestJson;
	} else {
		console.log(`Tag ${tag} does not have latest.json (status ${res.status}). Checking GitHub Release API...`);
		const ghRes = await fetch(`https://api.github.com/repos/phimbop/pb-desk/releases/tags/${tag}`, {
			headers: { 'User-Agent': 'pb-desk-sync' }
		});
		if (!ghRes.ok) {
			console.warn(`Tag ${tag} release not found on GitHub (status ${ghRes.status}). Skipping.`);
			return false;
		}
		const ghData = (await ghRes.json()) as any;
		const platforms: Record<string, PlatformArtifact> = {};
		for (const asset of ghData.assets || []) {
			const name = asset.name as string;
			const downloadUrl = asset.browser_download_url as string;
			const sig = `electron-${tag}`;
			if (name.endsWith('.AppImage')) {
				platforms['linux-x86_64'] = { url: downloadUrl, signature: sig };
				platforms['linux-x86_64-appimage'] = { url: downloadUrl, signature: sig };
			} else if (name.endsWith('.deb')) {
				platforms['linux-x86_64-deb'] = { url: downloadUrl, signature: sig };
			} else if (name.endsWith('.exe')) {
				platforms['windows-x86_64'] = { url: downloadUrl, signature: sig };
				platforms['windows-x86_64-nsis'] = { url: downloadUrl, signature: sig };
			} else if (name.includes('arm64') && name.endsWith('.dmg')) {
				platforms['darwin-aarch64'] = { url: downloadUrl, signature: sig };
				platforms['darwin-aarch64-app'] = { url: downloadUrl, signature: sig };
			} else if (name.endsWith('.dmg')) {
				platforms['darwin-x86_64'] = { url: downloadUrl, signature: sig };
				platforms['darwin-x86_64-app'] = { url: downloadUrl, signature: sig };
			}
		}
		manifest = {
			version: tag.replace(/^v/, ''),
			notes: ghData.body || `PHIMBOP Desktop ${tag}`,
			pub_date: ghData.published_at || new Date().toISOString(),
			platforms
		};
	}

	const version = manifest.version.replace(/^v/, '');
	const channel = 'stable';
	const releaseNotes = manifest.notes || `PHIMBOP Desktop ${tag}`;
	const publishedAt = manifest.pub_date || new Date().toISOString();

	// Target mapping:
	// Tauri v2 manifests include keys like:
	// darwin-aarch64, darwin-x86_64, linux-x86_64, windows-x86_64-nsis / windows-x86_64
	// Target mappings:
	// 1. All specific platform keys in latest.json
	// 2. Generic OS aliases ('linux', 'windows', 'darwin') for clients querying with {{target}}
	const records: Array<{
		version: string;
		channel: string;
		target: string;
		download_url: string;
		signature: string;
		release_notes: string;
		rollout_percentage: number;
		is_active: boolean;
		is_critical: boolean;
		published_at: string;
	}> = [];

	// Sync all platform keys defined in latest.json
	for (const [platformKey, artifact] of Object.entries(manifest.platforms)) {
		if (artifact && artifact.url && artifact.signature) {
			records.push({
				version,
				channel,
				target: platformKey,
				download_url: artifact.url.trim(),
				signature: artifact.signature.trim(),
				release_notes: releaseNotes,
				rollout_percentage: 100,
				is_active: true,
				is_critical: false,
				published_at: publishedAt,
			});
		}
	}

	// Add generic OS aliases so {{target}} alone matches without failing
	const osAliases: Array<{ alias: string; candidateKeys: string[] }> = [
		{ alias: 'linux', candidateKeys: ['linux-x86_64-appimage', 'linux-x86_64'] },
		{ alias: 'windows', candidateKeys: ['windows-x86_64-nsis', 'windows-x86_64'] },
		{ alias: 'darwin', candidateKeys: ['darwin-aarch64', 'darwin-x86_64'] },
	];

	for (const { alias, candidateKeys } of osAliases) {
		for (const key of candidateKeys) {
			if (manifest.platforms[key]) {
				const artifact = manifest.platforms[key];
				records.push({
					version,
					channel,
					target: alias,
					download_url: artifact.url.trim(),
					signature: artifact.signature.trim(),
					release_notes: releaseNotes,
					rollout_percentage: 100,
					is_active: true,
					is_critical: false,
					published_at: publishedAt,
				});
				break;
			}
		}
	}

	if (records.length === 0) {
		console.warn(`No platform records to sync for ${tag}`);
		return false;
	}

	console.log(`Upserting ${records.length} records for ${tag}...`);
	const { data, error } = await supabase
		.from('app_versions')
		.upsert(records, { onConflict: 'version,channel,target' })
		.select();

	if (error) {
		console.error(`Failed to upsert for ${tag}:`, error);
		return false;
	}

	console.log(`Successfully synced ${records.length} records for ${tag}:`);
	for (const rec of data || []) {
		console.log(`  - [${rec.target}] v${rec.version} -> ${rec.download_url}`);
	}
	return true;
}

async function main() {
	const tags = process.argv.slice(2);
	const tagsToSync = tags.length > 0 ? tags : ['v0.1.1', 'v0.1.2', 'v0.1.3', 'v0.1.4', 'v0.1.5', 'v0.1.6', 'v0.1.7', 'v0.1.8', 'v0.1.9', 'v0.1.10', 'v0.1.11', 'v0.1.12', 'v0.1.13', 'v0.1.14'];

	console.log(`Syncing releases to Supabase: ${tagsToSync.join(', ')}`);
	for (const tag of tagsToSync) {
		await syncReleaseToSupabase(tag);
	}

	console.log('\n--- Current app_versions table ---');
	const { data: allReleases, error } = await supabase
		.from('app_versions')
		.select('*')
		.order('version', { ascending: false });

	if (error) {
		console.error('Failed to fetch app_versions:', error);
	} else {
		console.table(
			allReleases?.map((r) => ({
				version: r.version,
				channel: r.channel,
				target: r.target,
				active: r.is_active,
				url: r.download_url.substring(0, 60) + '...',
				has_sig: Boolean(r.signature && r.signature.length > 30),
			}))
		);
	}
}

if (import.meta.main) {
	main().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
