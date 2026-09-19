import { tmdbEndpoint, tmdbOptionApi, getTmdbUrl, getTmdbHeaders } from '$lib';
import type { TmdbTvStoreType } from '../../types/Tmdb';
import { useSurrealDB } from './createStore.svelte';

export let tmdbTvStore = useSurrealDB<TmdbTvStoreType[]>('tmdb', 'tmdbTv', []);
export let tmdbTvSeasonNumber: { value: string } = $state({ value: '' });
export const tmdbTvHandler = {
	getTvPopular: async (page: number, lang = 'vi-VN') => {
		const primaryUrl = getTmdbUrl(`tv/popular?language=${lang}&page=${page}`);
		try {
			const result = await fetch(primaryUrl, { headers: getTmdbHeaders(primaryUrl) });
			if (result.ok) {
				const data = await result.json();
				return data;
			}
			throw new Error(`Failed to fetch tv popular: ${result.status}`);
		} catch (error) {
			console.warn('[tmdbTv] getTvPopular primary failed, retrying direct TMDB:', error);
			try {
				const directUrl = `https://api.themoviedb.org/3/tv/popular?language=${lang}&page=${page}`;
				const directResult = await fetch(directUrl, { headers: getTmdbHeaders(directUrl) });
				if (directResult.ok) {
					return await directResult.json();
				}
			} catch (fallbackError) {
				console.error('[tmdbTv] getTvPopular direct fallback failed:', fallbackError);
			}
			return { page, results: [], total_pages: 0, total_results: 0 };
		}
	},
	getTvDetail: async (tv_id: number, lang = 'vi-VN') => {
		const path = `tv/${tv_id}?language=${lang}&append_to_response=external_ids,credits,videos,seasons,images&include_image_language=en,null`;
		const primaryUrl = getTmdbUrl(path);
		try {
			const result = await fetch(primaryUrl, { headers: getTmdbHeaders(primaryUrl) });
			if (result.ok) {
				return await result.json();
			}
			throw new Error(`Failed to fetch tv detail: ${result.status}`);
		} catch (error) {
			console.warn('[tmdbTv] getTvDetail primary failed, retrying direct TMDB:', error);
			try {
				const directUrl = `https://api.themoviedb.org/3/${path}`;
				const directResult = await fetch(directUrl, { headers: getTmdbHeaders(directUrl) });
				if (directResult.ok) {
					return await directResult.json();
				}
			} catch (fallbackError) {
				console.error('[tmdbTv] getTvDetail direct fallback failed:', fallbackError);
			}
			throw error;
		}
	},
	getTvSeasonDetail: async (tv_id: number, season_number: number, lang = 'vi-VN') => {
		const path = `tv/${tv_id}/season/${season_number}?language=${lang}`;
		const primaryUrl = getTmdbUrl(path);
		try {
			const result = await fetch(primaryUrl, { headers: getTmdbHeaders(primaryUrl) });
			if (result.ok) {
				return await result.json();
			}
			throw new Error(`Failed to fetch tv season detail: ${result.status}`);
		} catch (error) {
			console.warn('[tmdbTv] getTvSeasonDetail primary failed, retrying direct TMDB:', error);
			try {
				const directUrl = `https://api.themoviedb.org/3/${path}`;
				const directResult = await fetch(directUrl, { headers: getTmdbHeaders(directUrl) });
				if (directResult.ok) {
					return await directResult.json();
				}
			} catch (fallbackError) {
				console.error('[tmdbTv] getTvSeasonDetail direct fallback failed:', fallbackError);
			}
			throw error;
		}
	},
	getTvSimilar: async (tv_id: number, page: number, lang = 'vi-VN') => {
		const path = `tv/${tv_id}/similar?language=${lang}&page=${page}`;
		const primaryUrl = getTmdbUrl(path);
		try {
			const result = await fetch(primaryUrl, { headers: getTmdbHeaders(primaryUrl) });
			if (result.ok) {
				return await result.json();
			}
			throw new Error(`Failed to fetch tv similar: ${result.status}`);
		} catch (error) {
			console.warn('[tmdbTv] getTvSimilar primary failed, retrying direct TMDB:', error);
			try {
				const directUrl = `https://api.themoviedb.org/3/${path}`;
				const directResult = await fetch(directUrl, { headers: getTmdbHeaders(directUrl) });
				if (directResult.ok) {
					return await directResult.json();
				}
			} catch (fallbackError) {
				console.error('[tmdbTv] getTvSimilar direct fallback failed:', fallbackError);
			}
			return { results: [], total_pages: 0 };
		}
	},
	searchTv: async (query: string, page: number, lang = 'vi-VN') => {
		if (query === '') return;
		const path = `search/tv?query=${encodeURIComponent(query)}&language=${lang}&page=${page}`;
		const primaryUrl = getTmdbUrl(path);
		try {
			const result = await fetch(primaryUrl, { headers: getTmdbHeaders(primaryUrl) });
			if (result.ok) {
				return await result.json();
			}
			throw new Error(`Failed to search tv: ${result.status}`);
		} catch (error) {
			console.warn('[tmdbTv] searchTv primary failed, retrying direct TMDB:', error);
			try {
				const directUrl = `https://api.themoviedb.org/3/${path}`;
				const directResult = await fetch(directUrl, { headers: getTmdbHeaders(directUrl) });
				if (directResult.ok) {
					return await directResult.json();
				}
			} catch (fallbackError) {
				console.error('[tmdbTv] searchTv direct fallback failed:', fallbackError);
			}
			throw error;
		}
	},
	getMoviePopularByNetwork: async (
		type: 'tv' | 'movie',
		network: string,
		page: number,
		lang: string,
		country: string
	) => {
		const path = `discover/${type}?include_adult=false&include_video=true&language=${lang}&page=${page}&sort_by=popularity.desc&with_watch_providers=${network}&watch_region=${country}`;
		const primaryUrl = getTmdbUrl(path);
		try {
			const result = await fetch(primaryUrl, { headers: getTmdbHeaders(primaryUrl) });
			if (result.ok) {
				return await result.json();
			}
			throw new Error(`Failed to discover by network: ${result.status}`);
		} catch (error) {
			console.warn('[tmdbTv] getMoviePopularByNetwork primary failed, retrying direct TMDB:', error);
			try {
				const directUrl = `https://api.themoviedb.org/3/${path}`;
				const directResult = await fetch(directUrl, { headers: getTmdbHeaders(directUrl) });
				if (directResult.ok) {
					return await directResult.json();
				}
			} catch (fallbackError) {
				console.error('[tmdbTv] getMoviePopularByNetwork direct fallback failed:', fallbackError);
			}
			throw error;
		}
	}
};
