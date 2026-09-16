import type { LayoutLoad } from './$types';
import { moviesHandler } from '$lib/runes/movieStore.svelte';
import { KkphimHandler } from '$lib/runes/kkPhimStore.svelte';

export const load: LayoutLoad = async ({ params }) => {
	try {
		const kkPhimleDetail: kkPhimboDetailType = await moviesHandler.kkPhimboGetMovieDetail(params.tenPhim);
		const category = kkPhimleDetail?.movie?.category?.[0]?.slug ?? 'hanh-dong';
		const relativeMovies = await KkphimHandler.kkGetMovieCategory(category, 1);

		const rating = { avgScore: 0, totalRatings: 0, userScore: null };

		return {
			kkPhimleDetail,
			relativeMovies,
			rating
		};
	} catch (err) {
		console.error('Error loading kkPhimleDetail layout data:', err);
		return {
			kkPhimleDetail: {
				status: false,
				msg: '',
				movie: {
					_id: '',
					name: params.tenPhim,
					origin_name: '',
					slug: params.tenPhim,
					thumb_url: '',
					poster_url: '',
					content: '',
					type: '',
					status: '',
					time: '',
					episode_current: '',
					episode_total: '',
					quality: '',
					lang: '',
					notify: '',
					showtimes: '',
					year: 0,
					view: 0,
					actor: [],
					director: [],
					category: [{ name: '', slug: '' }],
					country: [{ name: '', slug: '' }]
				},
				episodes: [
					{
						server_name: '',
						server_data: []
					}
				]
			} as any,
			relativeMovies: {
				status: 'success',
				data: {
					items: [],
					params: {
						pagination: {
							totalItems: 0,
							totalItemsPerPage: 20,
							currentPage: 1,
							totalPages: 0
						}
					}
				}
			},
			rating: { avgScore: 0, totalRatings: 0, userScore: null }
		};
	}
};
