import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { vite as vidstack } from 'vidstack/plugins';

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	return {
		plugins: [
			tailwindcss(),
			sveltekit(),
			vidstack({ include: /kkPlayer\// })
		],
		define: {
			'process.env.TMDB_READ_ACCESS_TOKEN': JSON.stringify(env.TMDB_READ_ACCESS_TOKEN || ''),
			'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL || ''),
			'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY || '')
		},
		clearScreen: false,
		server: {
			port: 1420,
			strictPort: true,
			host: host || false,
			hmr: host
				? {
						protocol: 'ws',
						host,
						port: 1421
					}
				: undefined,
			watch: {
				ignored: ['**/src-tauri/**']
			}
		}
	};
});
