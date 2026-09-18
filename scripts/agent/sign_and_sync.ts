import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { syncReleaseToSupabase } from './sync_supabase_versions';

async function main() {
	const tag = process.argv[2] || 'v0.1.13';
	const privateKey = process.env.TAURI_SIGNING_PRIVATE_KEY;
	const password = process.env.TAURI_SIGNING_PRIVATE_KEY_PASSWORD || '';

	if (!privateKey) {
		console.error('TAURI_SIGNING_PRIVATE_KEY is not set in environment.');
		process.exit(1);
	}

	const workDir = path.resolve(process.cwd(), 'release-assets');
	fs.mkdirSync(workDir, { recursive: true });

	console.log(`[Signer] Downloading release assets for ${tag} into ${workDir}...`);
	const dl = spawnSync(
		'gh',
		[
			'release',
			'download',
			tag,
			'--dir',
			workDir,
			'--pattern',
			'*.AppImage',
			'--pattern',
			'*.deb',
			'--pattern',
			'*.exe',
			'--pattern',
			'*.dmg',
			'--pattern',
			'*.zip',
			'--clobber'
		],
		{ stdio: 'inherit' }
	);

	if (dl.status !== 0) {
		console.error(`[Signer] Failed to download release assets for ${tag}`);
		process.exit(1);
	}

	const files = fs.readdirSync(workDir);
	console.log(`[Signer] Found ${files.length} assets to sign:`, files);

	const signatures: Record<string, string> = {};

	for (const file of files) {
		if (file.endsWith('.sig') || file.endsWith('.json') || file.endsWith('.blockmap')) continue;
		const fullPath = path.join(workDir, file);
		console.log(`[Signer] Signing ${file}...`);

		const args = ['signer', 'sign', '-k', privateKey];
		if (password) {
			args.push('-p', password);
		}
		args.push(fullPath);

		const signRes = spawnSync('bunx', ['@tauri-apps/cli', ...args], {
			stdio: ['ignore', 'pipe', 'pipe']
		});

		if (signRes.status !== 0) {
			console.error(`[Signer] Error signing ${file}:`, signRes.stderr.toString());
			process.exit(1);
		}

		const sigPath = `${fullPath}.sig`;
		if (fs.existsSync(sigPath)) {
			const sigContent = fs.readFileSync(sigPath, 'utf-8').trim();
			signatures[file] = sigContent;
			console.log(`[Signer] Successfully signed ${file}`);
		} else {
			console.error(`[Signer] Expected sig file not found: ${sigPath}`);
			process.exit(1);
		}
	}

	// Construct latest.json
	const baseUrl = `https://github.com/phimbop/pb-desk/releases/download/${tag}`;
	const platforms: Record<string, { signature: string; url: string }> = {};

	for (const [file, sig] of Object.entries(signatures)) {
		const downloadUrl = `${baseUrl}/${file}`;
		if (file.endsWith('.AppImage')) {
			platforms['linux-x86_64'] = { signature: sig, url: downloadUrl };
			platforms['linux-x86_64-appimage'] = { signature: sig, url: downloadUrl };
		} else if (file.endsWith('.deb')) {
			platforms['linux-x86_64-deb'] = { signature: sig, url: downloadUrl };
		} else if (file.includes('Setup') && file.endsWith('.exe')) {
			platforms['windows-x86_64'] = { signature: sig, url: downloadUrl };
			platforms['windows-x86_64-nsis'] = { signature: sig, url: downloadUrl };
		} else if (file.includes('arm64') && file.endsWith('.dmg')) {
			platforms['darwin-aarch64'] = { signature: sig, url: downloadUrl };
			platforms['darwin-aarch64-app'] = { signature: sig, url: downloadUrl };
		} else if (file.endsWith('.dmg')) {
			platforms['darwin-x86_64'] = { signature: sig, url: downloadUrl };
			platforms['darwin-x86_64-app'] = { signature: sig, url: downloadUrl };
		}
	}

	const version = tag.replace(/^v/, '');
	const latestJson = {
		version,
		notes: `## PHIMBOP Desktop ${tag}\n\nỨng dụng xem phim desktop đa nền tảng.\n`,
		pub_date: new Date().toISOString(),
		platforms
	};

	const latestJsonPath = path.join(workDir, 'latest.json');
	fs.writeFileSync(latestJsonPath, JSON.stringify(latestJson, null, 2), 'utf-8');
	console.log(`[Signer] Generated latest.json with ${Object.keys(platforms).length} platform signatures`);

	// Upload .sig files and latest.json to GitHub Release
	const uploadFiles = fs
		.readdirSync(workDir)
		.filter((f) => f.endsWith('.sig') || f === 'latest.json')
		.map((f) => path.join(workDir, f));

	console.log(`[Signer] Uploading ${uploadFiles.length} signature files to release ${tag}...`);
	const up = spawnSync('gh', ['release', 'upload', tag, ...uploadFiles, '--clobber'], {
		stdio: 'inherit'
	});

	if (up.status !== 0) {
		console.error(`[Signer] Failed to upload signatures to release ${tag}`);
		process.exit(1);
	}

	console.log(`[Signer] Upload completed. Now syncing latest.json to Supabase...`);
	const syncOk = await syncReleaseToSupabase(tag);
	if (!syncOk) {
		console.error(`[Signer] Failed to sync to Supabase`);
		process.exit(1);
	}

	console.log(`[Signer] ALL DONE! Release ${tag} is now fully signed and synced.`);
}

main().catch((err) => {
	console.error('[Signer] Unhandled error:', err);
	process.exit(1);
});
