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
	const latestJsonUrl = `https://github.com/phimbop/pb-desk/releases/download/${tag}/latest.json`;
	console.log(`Fetching release manifest for ${tag}: ${latestJsonUrl}`);

	const res = await fetch(latestJsonUrl);
	if (!res.ok) {
		console.warn(`Tag ${tag} does not have latest.json yet (status ${res.status}). Skipping.`);
		return false;
	}

	const manifest = (await res.json()) as TauriLatestJson;
	const version = manifest.version.replace(/^v/, '');
	const channel = 'stable';
	const releaseNotes = manifest.notes || `PHIMBOP Desktop ${tag}`;
	const publishedAt = manifest.pub_date || new Date().toISOString();

	// Target mapping:
	// Tauri v2 manifests include keys like:
	// darwin-aarch64, darwin-x86_64, linux-x86_64, windows-x86_64-nsis / windows-x86_64
	const targetMappings: Array<{
		target: string;
		keys: string[];
	}> = [
		{ target: 'windows-x86_64', keys: ['windows-x86_64-nsis', 'windows-x86_64', 'windows-x86_64-msi'] },
		{ target: 'darwin-aarch64', keys: ['darwin-aarch64', 'darwin-aarch64-app'] },
		{ target: 'darwin-x86_64', keys: ['darwin-x86_64', 'darwin-x86_64-app'] },
		{ target: 'linux-x86_64', keys: ['linux-x86_64', 'linux-x86_64-appimage'] },
	];

	const records = [];

	for (const mapping of targetMappings) {
		let artifact: PlatformArtifact | undefined;
		for (const key of mapping.keys) {
			if (manifest.platforms[key]) {
				artifact = manifest.platforms[key];
				break;
			}
		}

		if (artifact) {
			records.push({
				version,
				channel,
				target: mapping.target,
				download_url: artifact.url.trim(),
				signature: artifact.signature.trim(),
				release_notes: releaseNotes,
				rollout_percentage: 100,
				is_active: true,
				is_critical: false,
				published_at: publishedAt,
			});
		} else {
			console.warn(`No artifact found for target ${mapping.target} in ${tag}`);
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
	const tagsToSync = tags.length > 0 ? tags : ['v0.1.1', 'v0.1.2', 'v0.1.3'];

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
