import type { PageLoad } from './$types';
import { tmdbService } from '$lib/services/tmdbService';

export const load: PageLoad = async () => {
	try {
		const tmdbPopular = await tmdbService.getPopularMovies(1, 'vi-VN');
		return {
			tmdbPopular: tmdbPopular ?? { results: [], total_pages: 0 }
		};
	} catch (error) {
		console.error('Error loading popular movies search page:', error);
		return {
			tmdbPopular: { results: [], total_pages: 0 }
		};
	}
};
