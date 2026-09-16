import type { PageLoad } from './$types';
import { tmdbService } from '$lib/services/tmdbService';
import { getNewAddedMovies } from '$lib/services/supabase';

export const load: PageLoad = async ({ fetch }) => {
	try {
		const [
			singleRes,
			seriesRes,
			tmdbPopular,
			topRatedMovies,
			popularActors,
			vnRes,
			krRes,
			cnRes,
			moviesAddedNew
		] = await Promise.all([
			fetch('https://phimapi.com/v1/api/danh-sach/phim-le?page=1&limit=10')
				.then((r) => r.json())
				.catch(() => null),
			fetch('https://phimapi.com/v1/api/danh-sach/phim-bo?page=1&limit=10')
				.then((r) => r.json())
				.catch(() => null),
			tmdbService.getPopularMovies(1, 'vi-VN').catch(() => ({ results: [] })),
			tmdbService.getTopRatedMovies(1, 'vi-VN').catch(() => ({ results: [] })),
			tmdbService.getPopularActors(1).catch(() => ({ results: [] })),
			fetch('https://phimapi.com/v1/api/quoc-gia/viet-nam?page=1&limit=3')
				.then((r) => r.json())
				.catch(() => null),
			fetch('https://phimapi.com/v1/api/quoc-gia/han-quoc?page=1&limit=3')
				.then((r) => r.json())
				.catch(() => null),
			fetch('https://phimapi.com/v1/api/quoc-gia/trung-quoc?page=1&limit=3')
				.then((r) => r.json())
				.catch(() => null),
			getNewAddedMovies().catch(() => [])
		]);

		const KkPhimle = singleRes || { status: 'success', data: { items: [] } };
		const kkPhimbo = seriesRes || { status: 'success', data: { items: [] } };

		const allItems = [
			...(KkPhimle?.data?.items || []),
			...(kkPhimbo?.data?.items || [])
		];

		const topMoviesList = [
			allItems.slice(0, 10).map((m: any) => ({ movie: m })),
			allItems.slice(2, 12).map((m: any) => ({ movie: m })),
			allItems.slice(4, 14).map((m: any) => ({ movie: m }))
		];

		return {
			KkPhimle,
			kkPhimbo,
			popularActors: popularActors ?? { results: [] },
			tmdbPopular: tmdbPopular ?? { results: [] },
			topRatedMovies: topRatedMovies ?? { results: [] },
			vnMovies: vnRes,
			koreaMovies: krRes,
			chinaMovies: cnRes,
			topMoviesList,
			moviesAddedNew: moviesAddedNew ?? []
		};
	} catch (error) {
		console.error('Error loading home page data:', error);
		return {
			KkPhimle: { data: { items: [] } },
			kkPhimbo: { data: { items: [] } },
			popularActors: { results: [] },
			tmdbPopular: { results: [] },
			topRatedMovies: { results: [] },
			vnMovies: null,
			koreaMovies: null,
			chinaMovies: null,
			topMoviesList: [[], [], []],
			moviesAddedNew: []
		};
	}
};
