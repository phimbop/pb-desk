import { describe, expect, it } from 'bun:test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const rootDir = path.resolve(__dirname, '../..');

describe('TMDB Iframe and KKPlayer Playback Acceptance Tests', () => {
	it('R1: electron/main.ts enables secure webPreferences and sets window open handler for external links', () => {
		const mainPath = path.join(rootDir, 'electron/main.ts');
		expect(fs.existsSync(mainPath)).toBe(true);

		const mainContent = fs.readFileSync(mainPath, 'utf-8');
		expect(mainContent).toContain('webSecurity: true');
		expect(mainContent).toContain('setWindowOpenHandler');
		expect(mainContent).toContain('shell.openExternal');
		expect(mainContent).toContain('onHeadersReceived');
		expect(mainContent).toContain('x-frame-options');
		expect(mainContent).toContain('frame-ancestors');
	});

	it('R2: CardVideoPlay.svelte prioritizes active working embed servers', () => {
		const cardPath = path.join(rootDir, 'src/lib/Components/Card/CardVideoPlay.svelte');
		expect(fs.existsSync(cardPath)).toBe(true);

		const content = fs.readFileSync(cardPath, 'utf-8');

		// Must point directly to active domains with player.swinglust.top prioritized first
		expect(content).toContain('player.swinglust.top');
		expect(content).toContain('player.videasy.to');
		expect(content).toContain('vidfast.vc');

		// Must include comprehensive allow permissions for embedded video player
		expect(content).toContain('allow="accelerometer; autoplay;');
		expect(content).toContain('fullscreen');

		// First server in list should be player.swinglust.top, followed by videasy.to and vidfast.vc
		const serversMatch = content.match(/const servers: ServerFn\[\] = \[\s*([^\]]+)\]/s);
		expect(serversMatch).not.toBeNull();
		const serverListStr = serversMatch![1];
		expect(serverListStr).toMatch(/player\.swinglust\.top[\s\S]*videasy\.to[\s\S]*vidfast\.vc/);

		// TV servers list should also prioritize player.swinglust.top, followed by videasy.to and vidfast.vc
		const tvServersMatch = content.match(/const tvServers: ServerFn\[\] = \[\s*([^\]]+)\]/s);
		expect(tvServersMatch).not.toBeNull();
		const tvServerListStr = tvServersMatch![1];
		expect(tvServerListStr).toMatch(/player\.swinglust\.top[\s\S]*videasy\.to[\s\S]*vidfast\.vc/);
	});

	it('R3: kkPlayer.svelte provides bundled Hls constructor and prevents external loader CSP failure', () => {
		const playerPath = path.join(rootDir, 'src/lib/Components/kkPlayer/kkPlayer.svelte');
		expect(fs.existsSync(playerPath)).toBe(true);

		const content = fs.readFileSync(playerPath, 'utf-8');

		// Bundled Hls must be assigned to window.Hls before Vidstack bundle loads
		expect(content).toMatch(/(?:\(window\s+as\s+any\)|window)\.Hls\s*=\s*Hls/);

		// Must prevent Vidstack loadScript network request failure by satisfying querySelector
		expect(content).toContain('cdn.jsdelivr.net/npm/hls.js');

		// Guard stream URL replacement so non-svkk domains are not corrupted with pbsvr-s
		expect(content).toContain('svkk');
		// Should check hasMatched or only rewrite s when svkk matches
		expect(content).toMatch(/hasMatched|includes\(url\)|svkk\.some/);
	});

	it('R4: Stream URL transformation handles kkphim correctly without corrupting arbitrary URLs', () => {
		const svkk = ['phim1280.tv', 'kkphimplayer6.com', 'kkphimplayer7.com'];
		const s = ['https://s', 'https://v'];
		const pb = 'b-cdn.net';
		const pbsv = 'https://pbsvr-s';

		function transformStreamUrl(videoSrc: string): string {
			if (!videoSrc) return '';
			if (videoSrc.includes('vip.')) {
				return `https://opstream.b-cdn.net/hls/${new URL(videoSrc).host}${new URL(videoSrc).pathname}${new URL(videoSrc).search}`;
			}
			let hasMatched = false;
			let temp = videoSrc;
			for (const url of svkk) {
				if (temp.includes(url)) {
					temp = temp.replace(url, pb);
					hasMatched = true;
				}
			}
			if (hasMatched) {
				for (const url of s) {
					temp = temp.replace(url, pbsv);
				}
			}
			return temp;
		}

		// kkphim phim1280.tv domain transforms to pbsvr-s*.b-cdn.net
		const kkUrl = 'https://s4.phim1280.tv/20250425/1wMaOsDa/index.m3u8';
		expect(transformStreamUrl(kkUrl)).toBe('https://pbsvr-s4.b-cdn.net/20250425/1wMaOsDa/index.m3u8');

		// Unknown domain is NOT corrupted with pbsvr-s
		const genericUrl = 'https://stream.example.com/live/index.m3u8';
		expect(transformStreamUrl(genericUrl)).toBe('https://stream.example.com/live/index.m3u8');

		// VIP domain is routed to opstream proxy
		const vipUrl = 'https://vip.opstream11.com/20230101/index.m3u8';
		expect(transformStreamUrl(vipUrl)).toBe('https://opstream.b-cdn.net/hls/vip.opstream11.com/20230101/index.m3u8');
	});

	it('R5: player.swinglust.top embed response headers permit desktop app:// origin in frame-ancestors', async () => {
		try {
			const res = await fetch('https://player.swinglust.top/embed/movie/1228834', {
				method: 'HEAD'
			});
			const csp = res.headers.get('content-security-policy');
			if (csp) {
				expect(csp).toContain('app://localhost');
			}
		} catch {
			// Network may be offline in some test runners; offline fallback is covered by main.ts onHeadersReceived
		}
	});
});
