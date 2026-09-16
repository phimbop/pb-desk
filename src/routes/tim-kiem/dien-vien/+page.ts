import type { PageLoad } from './$types';
import { tmdbService } from '$lib/services/tmdbService';

export const load: PageLoad = async () => {
	try {
		const popularActors = await tmdbService.getPopularActors(1, 'vi-VN');
		return {
			popularActors: popularActors ?? { page: 1, results: [], total_pages: 0, total_results: 0 }
		};
	} catch (error) {
		console.error('Error loading popular actors search page:', error);
		return {
			popularActors: { page: 1, results: [], total_pages: 0, total_results: 0 }
		};
	}
};
