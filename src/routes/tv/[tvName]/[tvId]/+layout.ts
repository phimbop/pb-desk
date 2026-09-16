import { tmdbTvHandler } from '$lib/runes/tmdbTv.svelte';
import { getLocale } from '$lib/paraglide/runtime';
import { myListMoviesStore, playedListStore } from '$lib/runes/movieStore.svelte';
import { tmdbTvStore } from '$lib/runes/tmdbTv.svelte';
import type { TvSeriesDetail } from '../../../../types/Tmdb';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ params }) => {
	try {
		await tmdbTvStore.load();
		await playedListStore.load();
		await myListMoviesStore.load();
		const tvId = parseInt(params.tvId);
		const locale = getLocale() || 'vi-VN';
		const tvDetail: TvSeriesDetail = await tmdbTvHandler.getTvDetail(tvId, locale);

		const rating = { avgScore: 0, totalRatings: 0, userScore: null };

		return {
			tvDetail,
			rating
		};
	} catch (err) {
		console.error('Error loading TV series detail layout data:', err);
		return {
			tvDetail: {
				id: parseInt(params.tvId) || 0,
				name: '',
				original_name: '',
				overview: '',
				first_air_date: '',
				seasons: [],
				vote_average: 0,
				vote_count: 0,
				genres: [],
				production_companies: []
			} as any,
			rating: { avgScore: 0, totalRatings: 0, userScore: null }
		};
	}
};
