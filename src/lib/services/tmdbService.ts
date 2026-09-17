export const DOMAIN_TMDB = 'https://api.themoviedb.org/3';
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

import { TMDB_READ_ACCESS_TOKEN_FALLBACK } from '$lib';

const getToken = (): string => {
	return (
		(typeof process !== 'undefined' && process.env?.TMDB_READ_ACCESS_TOKEN) ||
		TMDB_READ_ACCESS_TOKEN_FALLBACK
	);
};

const getHeaders = () => {
	const token = getToken();
	return {
		accept: 'application/json',
		...(token ? { Authorization: `Bearer ${token}` } : {})
	};
};

export const tmdbService = {
	async getPopularActors(page = 1, language = 'vi-VN'): Promise<{ page: number; results: TmdbActor[]; total_pages: number; total_results: number }> {
		try {
			const res = await fetch(`${DOMAIN_TMDB}/person/popular?language=${language}&page=${page}`, {
				headers: getHeaders()
			});
			if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
			return await res.json();
		} catch (err) {
			console.error('Failed to get popular actors from TMDB:', err);
			return { page: 1, results: [], total_pages: 1, total_results: 0 };
		}
	},

	async searchActors(query: string, page = 1, language = 'vi-VN'): Promise<{ page: number; results: TmdbActor[]; total_pages: number; total_results: number }> {
		if (!query.trim()) return this.getPopularActors(page, language);
		try {
			const res = await fetch(
				`${DOMAIN_TMDB}/search/person?query=${encodeURIComponent(query)}&language=${language}&include_adult=false&page=${page}`,
				{ headers: getHeaders() }
			);
			if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
			return await res.json();
		} catch (err) {
			console.error('Failed to search actors from TMDB:', err);
			return { page: 1, results: [], total_pages: 1, total_results: 0 };
		}
	},

	async getActorDetail(actorId: string | number, language = 'vi-VN'): Promise<TmdbActorDetail | null> {
		try {
			const res = await fetch(
				`${DOMAIN_TMDB}/person/${actorId}?append_to_response=external_ids,movie_credits,tv_credits&language=${language}`,
				{ headers: getHeaders() }
			);
			if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
			return await res.json();
		} catch (err) {
			console.error('Failed to get actor detail from TMDB:', err);
			return null;
		}
	},

	async getMoviesByNetwork(
		type: 'movie' | 'tv',
		networkId: string | number,
		page = 1,
		language = 'vi-VN'
	): Promise<{ page: number; results: any[]; total_pages: number; total_results: number }> {
		try {
			const filterKey = type === 'tv' ? 'with_networks' : 'with_watch_providers';
			const res = await fetch(
				`${DOMAIN_TMDB}/discover/${type}?${filterKey}=${networkId}&language=${language}&page=${page}&sort_by=popularity.desc`,
				{ headers: getHeaders() }
			);
			if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
			return await res.json();
		} catch (err) {
			console.error('Failed to get network movies from TMDB:', err);
			return { page: 1, results: [], total_pages: 1, total_results: 0 };
		}
	},

	async getMovieDetails(movieId: string | number, language = 'vi-VN'): Promise<any | null> {
		try {
			const res = await fetch(
				`${DOMAIN_TMDB}/movie/${movieId}?append_to_response=credits,recommendations,similar,videos&language=${language}`,
				{ headers: getHeaders() }
			);
			if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
			return await res.json();
		} catch (err) {
			console.error('Failed to get movie details from TMDB:', err);
			return null;
		}
	},

	async getTvDetails(tvId: string | number, language = 'vi-VN'): Promise<any | null> {
		try {
			const res = await fetch(
				`${DOMAIN_TMDB}/tv/${tvId}?append_to_response=credits,recommendations,similar,videos&language=${language}`,
				{ headers: getHeaders() }
			);
			if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
			return await res.json();
		} catch (err) {
			console.error('Failed to get TV details from TMDB:', err);
			return null;
		}
	},

	async getTvPopular(page = 1, language = 'vi-VN'): Promise<{ page: number; results: any[]; total_pages: number; total_results: number }> {
		try {
			const res = await fetch(`${DOMAIN_TMDB}/tv/popular?language=${language}&page=${page}`, {
				headers: getHeaders()
			});
			if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
			return await res.json();
		} catch (err) {
			console.error('Failed to get popular TV series from TMDB:', err);
			return { page: 1, results: [], total_pages: 1, total_results: 0 };
		}
	},

	async getPopularMovies(page = 1, language = 'en-US'): Promise<{ page: number; results: any[]; total_pages: number; total_results: number }> {
		try {
			const res = await fetch(`${DOMAIN_TMDB}/movie/popular?language=${language}&page=${page}`, {
				headers: getHeaders()
			});
			if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
			return await res.json();
		} catch (err) {
			console.error('Failed to get popular movies from TMDB:', err);
			return { page: 1, results: [], total_pages: 1, total_results: 0 };
		}
	},

	async getTopRatedMovies(page = 1, language = 'vi-VN'): Promise<{ page: number; results: any[]; total_pages: number; total_results: number }> {
		try {
			const res = await fetch(`${DOMAIN_TMDB}/movie/top_rated?language=${language}&page=${page}`, {
				headers: getHeaders()
			});
			if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
			return await res.json();
		} catch (err) {
			console.error('Failed to get top rated movies from TMDB:', err);
			return { page: 1, results: [], total_pages: 1, total_results: 0 };
		}
	}
};
