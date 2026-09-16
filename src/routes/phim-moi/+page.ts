import type { PageLoad } from './$types';
import { moviesHandler } from '$lib/runes/movieStore.svelte';
import { getNewAddedMovies } from '$lib/services/supabase';
import { getLocale } from '$lib/paraglide/runtime';

export const load: PageLoad = async () => {
	try {
		const randomPage: number = Math.floor(Math.random() * 400) + 1;
		const locale = getLocale();
		const [tmdbPopular, moviesAddedNew, topRatedMovies] = await Promise.all([
			moviesHandler.tmdbGetMovies('popular', 1, locale).catch((err) => {
				console.error('[Phim-moi Load Error] tmdbPopular:', err);
				return null;
			}),
			getNewAddedMovies().catch((err) => {
				console.error('[Phim-moi Load Error] supabase_new_added:', err);
				return [];
			}),
			moviesHandler.tmdbGetTopRateMovies(randomPage, locale).catch((err) => {
				console.error('[Phim-moi Load Error] topRatedMovies:', err);
				return null;
			})
		]);

		return {
			moviesAddedNew: moviesAddedNew ?? [],
			tmdbPopular: tmdbPopular ?? { page: 1, results: [], total_pages: 0, total_results: 0 },
			topRatedMovies: topRatedMovies ?? { page: 1, results: [], total_pages: 0, total_results: 0 }
		};
	} catch (error) {
		console.error('Error loading phim-moi page data:', error);
		return {
			moviesAddedNew: [],
			tmdbPopular: { page: 1, results: [], total_pages: 0, total_results: 0 },
			topRatedMovies: { page: 1, results: [], total_pages: 0, total_results: 0 }
		};
	}
};
