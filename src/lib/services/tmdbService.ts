export const DOMAIN_TMDB_IMAGE = 'https://pbtmdbsvr.b-cdn.net';
export const DOMAIN_TMDB_IMAGE_ORIGINAL = 'https://pbtmdbsvr.b-cdn.net/t/p/original';

export interface TmdbActor {
	id: number;
	name: string;
	profile_path: string | null;
	known_for_department?: string;
	popularity?: number;
	known_for?: Array<{
		id: number;
		title?: string;
		name?: string;
		original_title?: string;
		original_name?: string;
		media_type?: string;
		first_air_date?: string;
		release_date?: string;
		poster_path?: string;
	}>;
}

export interface TmdbActorDetail {
	id: number;
	name: string;
	biography: string;
	birthday?: string | null;
	deathday?: string | null;
	place_of_birth?: string | null;
	profile_path?: string | null;
	gender?: number;
	also_known_as?: string[];
	external_ids?: {
		imdb_id?: string | null;
		facebook_id?: string | null;
		instagram_id?: string | null;
		twitter_id?: string | null;
		tiktok_id?: string | null;
		youtube_id?: string | null;
	};
	movie_credits?: {
		cast: any[];
		crew: any[];
	};
	tv_credits?: {
		cast: any[];
		crew: any[];
	};
}

import { getTmdbUrl, getTmdbHeaders, getWebsiteUrl, TMDB_READ_ACCESS_TOKEN_FALLBACK } from '$lib';

export const DOMAIN_TMDB = 'https://api.themoviedb.org/3';

export const getToken = (): string => {
	return (
		(typeof process !== 'undefined' && process.env?.TMDB_READ_ACCESS_TOKEN) ||
		TMDB_READ_ACCESS_TOKEN_FALLBACK ||
		''
	);
};

export const tmdbService = {
	async getPopularActors(page = 1, language = 'vi-VN'): Promise<{ page: number; results: TmdbActor[]; total_pages: number; total_results: number }> {
		const path = `person/popular?language=${language}&page=${page}`;
		const primaryUrl = getTmdbUrl(path);
		try {
			const res = await fetch(primaryUrl, {
				headers: getTmdbHeaders(primaryUrl)
			});
			if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
			return await res.json();
		} catch (err) {
			console.warn('[tmdbService] Primary getPopularActors failed, retrying direct TMDB:', err);
			try {
				const directUrl = `https://api.themoviedb.org/3/${path}`;
				const directRes = await fetch(directUrl, { headers: getTmdbHeaders(directUrl) });
				if (directRes.ok) return await directRes.json();
			} catch (fallbackErr) {
				console.error('[tmdbService] Direct fallback failed:', fallbackErr);
			}
			return { page: 1, results: [], total_pages: 1, total_results: 0 };
		}
	},

	async searchActors(query: string, page = 1, language = 'vi-VN'): Promise<{ page: number; results: TmdbActor[]; total_pages: number; total_results: number }> {
		if (!query.trim()) return this.getPopularActors(page, language);
		const path = `search/person?query=${encodeURIComponent(query)}&language=${language}&include_adult=false&page=${page}`;
		const primaryUrl = getTmdbUrl(path);
		try {
			const res = await fetch(primaryUrl, { headers: getTmdbHeaders(primaryUrl) });
			if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
			return await res.json();
		} catch (err) {
			console.warn('[tmdbService] Primary searchActors failed, retrying direct TMDB:', err);
			try {
				const directUrl = `https://api.themoviedb.org/3/${path}`;
				const directRes = await fetch(directUrl, { headers: getTmdbHeaders(directUrl) });
				if (directRes.ok) return await directRes.json();
			} catch (fallbackErr) {
				console.error('[tmdbService] Direct fallback failed:', fallbackErr);
			}
			return { page: 1, results: [], total_pages: 1, total_results: 0 };
		}
	},

	async getActorDetail(actorId: string | number, language = 'vi-VN'): Promise<TmdbActorDetail | null> {
		const path = `person/${actorId}?append_to_response=external_ids,movie_credits,tv_credits&language=${language}`;
		const primaryUrl = getTmdbUrl(path);
		try {
			const res = await fetch(primaryUrl, { headers: getTmdbHeaders(primaryUrl) });
			if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
			return await res.json();
		} catch (err) {
			console.warn('[tmdbService] Primary getActorDetail failed, retrying direct TMDB:', err);
			try {
				const directUrl = `https://api.themoviedb.org/3/${path}`;
				const directRes = await fetch(directUrl, { headers: getTmdbHeaders(directUrl) });
				if (directRes.ok) return await directRes.json();
			} catch (fallbackErr) {
				console.error('[tmdbService] Direct fallback failed:', fallbackErr);
			}
			return null;
		}
	},

	async getMoviesByNetwork(
		type: 'movie' | 'tv',
		networkId: string | number,
		page = 1,
		language = 'vi-VN'
	): Promise<{ page: number; results: any[]; total_pages: number; total_results: number }> {
		const filterKey = type === 'tv' ? 'with_networks' : 'with_watch_providers';
		const path = `discover/${type}?${filterKey}=${networkId}&language=${language}&page=${page}&sort_by=popularity.desc`;
		const primaryUrl = getTmdbUrl(path);
		try {
			const res = await fetch(primaryUrl, { headers: getTmdbHeaders(primaryUrl) });
			if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
			return await res.json();
		} catch (err) {
			console.warn('[tmdbService] Primary getMoviesByNetwork failed, retrying direct TMDB:', err);
			try {
				const directUrl = `https://api.themoviedb.org/3/${path}`;
				const directRes = await fetch(directUrl, { headers: getTmdbHeaders(directUrl) });
				if (directRes.ok) return await directRes.json();
			} catch (fallbackErr) {
				console.error('[tmdbService] Direct fallback failed:', fallbackErr);
			}
			return { page: 1, results: [], total_pages: 1, total_results: 0 };
		}
	},

	async getMovieDetails(movieId: string | number, language = 'vi-VN'): Promise<any | null> {
		const path = `movie/${movieId}?append_to_response=credits,recommendations,similar,videos&language=${language}`;
		const primaryUrl = getTmdbUrl(path);
		try {
			const res = await fetch(primaryUrl, { headers: getTmdbHeaders(primaryUrl) });
			if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
			return await res.json();
		} catch (err) {
			console.warn('[tmdbService] Primary getMovieDetails failed, retrying direct TMDB:', err);
			try {
				const directUrl = `https://api.themoviedb.org/3/${path}`;
				const directRes = await fetch(directUrl, { headers: getTmdbHeaders(directUrl) });
				if (directRes.ok) return await directRes.json();
			} catch (fallbackErr) {
				console.error('[tmdbService] Direct fallback failed:', fallbackErr);
			}
			return null;
		}
	},

	async getTvDetails(tvId: string | number, language = 'vi-VN'): Promise<any | null> {
		const path = `tv/${tvId}?append_to_response=credits,recommendations,similar,videos&language=${language}`;
		const primaryUrl = getTmdbUrl(path);
		try {
			const res = await fetch(primaryUrl, { headers: getTmdbHeaders(primaryUrl) });
			if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
			return await res.json();
		} catch (err) {
			console.warn('[tmdbService] Primary getTvDetails failed, retrying direct TMDB:', err);
			try {
				const directUrl = `https://api.themoviedb.org/3/${path}`;
				const directRes = await fetch(directUrl, { headers: getTmdbHeaders(directUrl) });
				if (directRes.ok) return await directRes.json();
			} catch (fallbackErr) {
				console.error('[tmdbService] Direct fallback failed:', fallbackErr);
			}
			return null;
		}
	},

	async getTvPopular(page = 1, language = 'vi-VN'): Promise<{ page: number; results: any[]; total_pages: number; total_results: number }> {
		const path = `tv/popular?language=${language}&page=${page}`;
		const primaryUrl = getTmdbUrl(path);
		try {
			const res = await fetch(primaryUrl, {
				headers: getTmdbHeaders(primaryUrl)
			});
			if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
			return await res.json();
		} catch (err) {
			console.warn('[tmdbService] Primary getTvPopular failed, retrying direct TMDB:', err);
			try {
				const directUrl = `https://api.themoviedb.org/3/${path}`;
				const directRes = await fetch(directUrl, { headers: getTmdbHeaders(directUrl) });
				if (directRes.ok) return await directRes.json();
			} catch (fallbackErr) {
				console.error('[tmdbService] Direct fallback failed:', fallbackErr);
			}
			return { page: 1, results: [], total_pages: 1, total_results: 0 };
		}
	},

	async getPopularMovies(page = 1, language = 'en-US'): Promise<{ page: number; results: any[]; total_pages: number; total_results: number }> {
		const path = `movie/popular?language=${language}&page=${page}`;
		const primaryUrl = getTmdbUrl(path);
		try {
			const res = await fetch(primaryUrl, {
				headers: getTmdbHeaders(primaryUrl)
			});
			if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
			return await res.json();
		} catch (err) {
			console.warn('[tmdbService] Primary getPopularMovies failed, retrying direct TMDB:', err);
			try {
				const directUrl = `https://api.themoviedb.org/3/${path}`;
				const directRes = await fetch(directUrl, { headers: getTmdbHeaders(directUrl) });
				if (directRes.ok) return await directRes.json();
			} catch (fallbackErr) {
				console.error('[tmdbService] Direct fallback failed:', fallbackErr);
			}
			return { page: 1, results: [], total_pages: 1, total_results: 0 };
		}
	},

	async getTopRatedMovies(page = 1, language = 'vi-VN'): Promise<{ page: number; results: any[]; total_pages: number; total_results: number }> {
		const path = `movie/top_rated?language=${language}&page=${page}`;
		const primaryUrl = getTmdbUrl(path);
		try {
			const res = await fetch(primaryUrl, {
				headers: getTmdbHeaders(primaryUrl)
			});
			if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
			return await res.json();
		} catch (err) {
			console.warn('[tmdbService] Primary getTopRatedMovies failed, retrying direct TMDB:', err);
			try {
				const directUrl = `https://api.themoviedb.org/3/${path}`;
				const directRes = await fetch(directUrl, { headers: getTmdbHeaders(directUrl) });
				if (directRes.ok) return await directRes.json();
			} catch (fallbackErr) {
				console.error('[tmdbService] Direct fallback failed:', fallbackErr);
			}
			return { page: 1, results: [], total_pages: 1, total_results: 0 };
		}
	}
};
