import { tmdbEndpoint, tmdbOptionApi, getTmdbUrl, getTmdbHeaders } from '$lib';
import type { TmdbTvStoreType } from '../../types/Tmdb';
import { useSurrealDB } from './createStore.svelte';

export let tmdbTvStore = useSurrealDB<TmdbTvStoreType[]>('tmdb', 'tmdbTv', []);
export let tmdbTvSeasonNumber: { value: string } = $state({ value: '' });
export const tmdbTvHandler = {
	getTvPopular: async (page: number, lang = 'vi-VN') => {
		try {
			const result = await fetch(
				getTmdbUrl(`tv/popular?language=${lang}&page=${page}`),
				{ headers: getTmdbHeaders() }
			);
			const data = await result.json();
			return data;
		} catch (error) {
			console.error(error);
		}
	},
	getTvDetail: async (tv_id: number, lang = 'vi-VN') => {
		try {
			const result = await fetch(
				getTmdbUrl(`tv/${tv_id}?language=${lang}&append_to_response=external_ids,credits,videos,seasons,images&include_image_language=en,null`),
				{ headers: getTmdbHeaders() }
			);
			const data = await result.json();
			return data;
		} catch (error) {
			console.error(error);
		}
	},
	getTvSeasonDetail: async (tv_id: number, season_number: number, lang = 'vi-VN') => {
		try {
			const result = await fetch(
				getTmdbUrl(`tv/${tv_id}/season/${season_number}?language=${lang}`),
				{ headers: getTmdbHeaders() }
			);
			const data = await result.json();
			return data;
		} catch (error) {
			console.error(error);
		}
	},
	getTvSimilar: async (tv_id: number, page: number, lang = 'vi-VN') => {
		try {
			const result = await fetch(
				getTmdbUrl(`tv/${tv_id}/similar?language=${lang}&page=${page}`),
				{ headers: getTmdbHeaders() }
			);
			const data = await result.json();
			return data;
		} catch (error) {
			console.error(error);
		}
	},
	searchTv: async (query: string, page: number, lang = 'vi-VN') => {
		if (query === '') return;
		try {
			const result = await fetch(
				getTmdbUrl(`search/tv?query=${encodeURIComponent(query)}&language=${lang}&page=${page}`),
				{ headers: getTmdbHeaders() }
			);
			const data = await result.json();
			return data;
		} catch (error) {
			console.error(error);
		}
	},
	getMoviePopularByNetwork: async (
		type: 'tv' | 'movie',
		network: string,
		page: number,
		lang: string,
		country: string
	) => {
		try {
			const result = await fetch(
				getTmdbUrl(`discover/${type}?include_adult=false&include_video=true&language=${lang}&page=${page}&sort_by=popularity.desc&with_watch_providers=${network}&watch_region=${country}`),
				{ headers: getTmdbHeaders() }
			);
			const data = await result.json();
			return data;
		} catch (error) {
			console.error(error);
		}
	}
};
