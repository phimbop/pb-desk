import type { LayoutLoad } from './$types';
import { moviesHandler } from '$lib/runes/movieStore.svelte';

export const load: LayoutLoad = async ({ params }) => {
	try {
		const kkPhimHoatHinhDetail: kkPhimboDetailType = await moviesHandler.kkPhimboGetMovieDetail(params.tenPhim);
		const rating = { avgScore: 0, totalRatings: 0, userScore: null };
		return {
			kkPhimHoatHinhDetail,
			rating
		};
	} catch (err) {
		console.error('Error loading kkPhimHoatHinhDetail:', err);
		return {
			kkPhimHoatHinhDetail: {
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
			rating: { avgScore: 0, totalRatings: 0, userScore: null }
		};
	}
};
