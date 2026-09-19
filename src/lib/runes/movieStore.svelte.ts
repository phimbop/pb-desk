import { browser } from '$app/environment';
import { domainMovies, tmdbEndpoint, tmdbOptionApi, getTmdbUrl, getTmdbHeaders, getWebsiteUrl, patternKKImageDomain } from '$lib';
import { appFetch } from '$lib/ipc';
import { useSurrealDB } from './createStore.svelte';
import type { TmdbMovieDetail, TmdbMovieList, FilterType, TmdbMovies } from '../../types/Tmdb';

// export let moviesNewAddStore = useLocalStorage<TmdbMovieDetail[]>("moviesNewAdd", []);
export const moviesNewAddStore = useSurrealDB<TmdbMovieDetail[]>('tmdb', 'moviesNewAdd', []);

// export let tmdbPopularStore = useLocalStorage<TmdbMovies>("tmdbPopular", null);
// export let tmdbPopularStore = useSurrealDB<TmdbMovies|null>("tmdb", "tmdbPopular", null);

export const isPlaying = $state({ value: false });

// export let tmdbFilterMoviesStore = useLocalStorage<FilterType>("tmdbFilterMovies", {});
export const tmdbFilterMoviesStore = useSurrealDB<FilterType>('tmdb', 'tmdbFilterMovies', {});

// export let tmdbFilteredMoviesListStore = useLocalStorage<TmdbMovies>("tmdbFilteredMoviesList", null);
export const tmdbFilteredMoviesListStore = useSurrealDB<TmdbMovies | null>(
	'tmdb',
	'tmdbFilteredMoviesList',
	null
);

// export let tmdbTopRatedMoviesStore = useLocalStorage<TmdbMovies>("tmdbTopRatedMovies", null);
// export let tmdbTopRatedMoviesStore = useSurrealDB<TmdbMovies|null>("tmdb", "tmdbTopRatedMovies", null);

// export let myListMoviesStore = useLocalStorage<myListMovies[]>("myListMovies", []);
export const myListMoviesStore = useSurrealDB<myListMovies[]>('movies', 'myListMovies', []);

// export let playedListStore = useLocalStorage<PlayerMovieInfo[]>("playedList", []);
export const playedListStore = useSurrealDB<PlayerMovieInfo[]>('movies', 'playedList', []);

// export let sidebarOpen = $state({ value: false });
export const sidebarOpen = $state({ value: false });
export const kkPhimleSidebarOpen = $state({ value: false });
export const openComment = $state({ value: browser && window.innerWidth < 768 });
export const buffering = $state({ value: false });
export const isPaused = $state({ value: false });
export const isSeeking = $state({ value: false });
export const playerVolume = $state({ value: 1 });
export const playerMuted: { value: boolean } = $state({ value: false });

export const moviesHandler = {
	getMovies: async () => {
		try {
			const result = await fetch(`${domainMovies}/movies/latest/page-1.json`);
			return await result.json();
		} catch (error) {
			console.error(error);
		}
	},
	tmdbGetMovies: async (listMovieType: TmdbMovieList, page: number, language = 'vi-VN') => {
		const primaryUrl = getTmdbUrl(`movie/${listMovieType}?language=${language}&page=${page}`);
		try {
			const result = await fetch(primaryUrl, { headers: getTmdbHeaders(primaryUrl) });
			if (result.ok) {
				return await result.json();
			}
			throw new Error(`Failed to fetch movies from primary URL: ${result.status}`);
		} catch (error) {
			console.warn('[movieStore] tmdbGetMovies primary failed, retrying direct TMDB:', error);
			try {
				const directUrl = `https://api.themoviedb.org/3/movie/${listMovieType}?language=${language}&page=${page}`;
				const directResult = await fetch(directUrl, { headers: getTmdbHeaders(directUrl) });
				if (directResult.ok) {
					return await directResult.json();
				}
			} catch (fallbackError) {
				console.error('[movieStore] tmdbGetMovies direct fallback failed:', fallbackError);
			}
			return { results: [], total_pages: 0, page };
		}
	},
	tmdbSearchMovies: async (query: string, page?: number) => {
		const path = `search/movie?query=${query}&language=vi-VN&include_adult=false${
			page ? '&page=' + page : ''
		}`;
		const primaryUrl = getTmdbUrl(path);
		try {
			const result = await fetch(primaryUrl, { headers: getTmdbHeaders(primaryUrl) });
			if (result.ok) {
				return await result.json();
			}
			throw new Error(`Search failed: ${result.status}`);
		} catch (error) {
			console.warn('[movieStore] Search primary failed, retrying direct TMDB:', error);
			try {
				const directUrl = `https://api.themoviedb.org/3/${path}`;
				const directResult = await fetch(directUrl, { headers: getTmdbHeaders(directUrl) });
				if (directResult.ok) {
					return await directResult.json();
				}
			} catch (fallbackError) {
				console.error('[movieStore] Search direct fallback failed:', fallbackError);
			}
			throw error;
		}
	},
	tmdbGetMovieDetails: async (movieId: number, language = 'vi-VN') => {
		const path = `movie/${movieId}?append_to_response=credits&language=${language}`;
		const primaryUrl = getTmdbUrl(path);
		try {
			const result = await fetch(primaryUrl, { headers: getTmdbHeaders(primaryUrl) });
			if (result.ok) {
				return await result.json();
			}
			throw new Error(`Movie details failed: ${result.status}`);
		} catch (error) {
			console.warn('[movieStore] Movie details primary failed, retrying direct TMDB:', error);
			try {
				const directUrl = `https://api.themoviedb.org/3/${path}`;
				const directResult = await fetch(directUrl, { headers: getTmdbHeaders(directUrl) });
				if (directResult.ok) {
					return await directResult.json();
				}
			} catch (fallbackError) {
				console.error('[movieStore] Movie details direct fallback failed:', fallbackError);
			}
			throw error;
		}
	},
	tmdbRelatedMovies: async (movieId: number, page: number) => {
		const path = `movie/${movieId}/similar?language=vi-VN&page=${page}`;
		const primaryUrl = getTmdbUrl(path);
		try {
			const result = await fetch(primaryUrl, { headers: getTmdbHeaders(primaryUrl) });
			if (result.ok) {
				return await result.json();
			}
			throw new Error(`Related movies failed: ${result.status}`);
		} catch (error) {
			console.warn('[movieStore] Related movies primary failed, retrying direct TMDB:', error);
			try {
				const directUrl = `https://api.themoviedb.org/3/${path}`;
				const directResult = await fetch(directUrl, { headers: getTmdbHeaders(directUrl) });
				if (directResult.ok) {
					return await directResult.json();
				}
			} catch (fallbackError) {
				console.error('[movieStore] Related movies direct fallback failed:', fallbackError);
			}
			throw error;
		}
	},
	tmdbFilterMovies: async (
		page: number,
		movieType: 'movie' | 'tv' = 'movie',
		language = 'vi-VN'
	) => {
		try {
			const movieGenres = tmdbFilterMoviesStore.value.movieGenres ?? [];
			const country = tmdbFilterMoviesStore.value.country ?? [];
			const yearList = tmdbFilterMoviesStore.value.year ?? [];
			const movieTitle = tmdbFilterMoviesStore.value.movieTitle ?? '';
			const year = yearList?.filter((item) => item !== '2000-12-31' && item !== '1900-12-31') ?? [];
			const twentyCentury = yearList?.find((item) => item === '2000-12-31');
			const nineteenCentury = yearList?.find((item) => item === '1900-12-31');

			const params = new URLSearchParams({
				include_adult: 'false',
				include_video: 'true',
				language,
				page: page.toString(),
				sort_by: 'popularity.desc'
			});

			if (movieTitle.trim()) {
				params.set('with_text_query', movieTitle.trim());
			}
			if (movieGenres.length > 0) {
				params.set('with_genres', movieGenres.join('|'));
			}
			if (country.length > 0) {
				params.set('with_origin_country', country.join('|'));
			}
			if (year.length > 0) {
				const yearKey = movieType === 'tv' ? 'first_air_date_year' : 'primary_release_year';
				params.set(yearKey, year[0]);
			}

			const gteKey = movieType === 'tv' ? 'first_air_date.gte' : 'primary_release_date.gte';
			const lteKey = movieType === 'tv' ? 'first_air_date.lte' : 'primary_release_date.lte';

			if (twentyCentury && nineteenCentury) {
				params.set(gteKey, '1801-01-01');
				params.set(lteKey, twentyCentury);
			} else if (twentyCentury) {
				params.set(gteKey, '1901-01-01');
				params.set(lteKey, twentyCentury);
			} else if (nineteenCentury) {
				params.set(gteKey, '1801-01-01');
				params.set(lteKey, nineteenCentury);
			}

			const apiUrl = getTmdbUrl(`discover/${movieType}?${params.toString()}`);
			let result: Response | null = null;
			try {
				result = await fetch(apiUrl, { headers: getTmdbHeaders() });
			} catch (fetchErr) {
				console.warn(`[TMDB] Filter ${movieType} fetch failed from ${apiUrl}:`, fetchErr);
			}

			if (!result || !result.ok) {
				const proxyUrl = `${getWebsiteUrl()}/api/tmdb/discover/${movieType}?${params.toString()}`;
				if (apiUrl !== proxyUrl) {
					console.log(`[TMDB] Retrying filter via backend proxy: ${proxyUrl}`);
					try {
						result = await fetch(proxyUrl, { headers: { accept: 'application/json' } });
					} catch (proxyErr) {
						console.error(`[TMDB] Retry via backend proxy failed:`, proxyErr);
					}
				}
			}

			if (!result || !result.ok) {
				console.warn(`[TMDB] Filter ${movieType} returned non-ok status: ${result?.status}`);
				return { page: page, results: [], total_pages: 0, total_results: 0 };
			}
			const data = await result.json();
			if (!data || typeof data !== 'object' || !Array.isArray(data.results)) {
				return { page: page, results: [], total_pages: 0, total_results: 0 };
			}
			if (typeof data.page !== 'number') {
				data.page = page;
			}
			return data;
		} catch (error) {
			console.error(`[TMDB] Error filtering ${movieType}:`, error);
			return { page: page, results: [], total_pages: 0, total_results: 0 };
		}
	},
	tmdbGetActorInfo: async (actorId: number, language = 'vi-VN') => {
		const path = `person/${actorId}?append_to_response=external_ids,movie_credits,tv_credits&language=${language}`;
		const primaryUrl = getTmdbUrl(path);
		try {
			const result = await fetch(primaryUrl, { headers: getTmdbHeaders(primaryUrl) });
			if (result.ok) {
				return await result.json();
			}
			throw new Error(`Failed to fetch actor info: ${result.status}`);
		} catch (error) {
			console.warn('[movieStore] tmdbGetActorInfo primary failed, retrying direct TMDB:', error);
			try {
				const directUrl = `https://api.themoviedb.org/3/${path}`;
				const directResult = await fetch(directUrl, { headers: getTmdbHeaders(directUrl) });
				if (directResult.ok) {
					return await directResult.json();
				}
			} catch (fallbackError) {
				console.error('[movieStore] tmdbGetActorInfo direct fallback failed:', fallbackError);
			}
			throw error;
		}
	},
	tmdbGetTopRateMovies: async (page: number, language = 'vi-VN') => {
		const primaryUrl = getTmdbUrl(`movie/top_rated?language=${language}&page=${page}`);
		try {
			const result = await fetch(primaryUrl, { headers: getTmdbHeaders(primaryUrl) });
			if (result.ok) {
				const data = await result.json();
				if (data && typeof data.page !== 'number') {
					data.page = page;
				}
				return data;
			}
			throw new Error(`Failed to fetch top rated movies: ${result.status}`);
		} catch (error) {
			console.warn('[movieStore] tmdbGetTopRateMovies primary failed, retrying direct TMDB:', error);
			try {
				const directUrl = `https://api.themoviedb.org/3/movie/top_rated?language=${language}&page=${page}`;
				const directResult = await fetch(directUrl, { headers: getTmdbHeaders(directUrl) });
				if (directResult.ok) {
					const directData = await directResult.json();
					if (directData && typeof directData.page !== 'number') {
						directData.page = page;
					}
					return directData;
				}
			} catch (fallbackError) {
				console.error('[movieStore] tmdbGetTopRateMovies direct fallback failed:', fallbackError);
			}
			return { page: page, results: [], total_pages: 0, total_results: 0 };
		}
	},
	tmdbGetPopularActors: async (page: number, language = 'vi-VN') => {
		const path = `person/popular?language=${language}&page=${page}`;
		const primaryUrl = getTmdbUrl(path);
		try {
			const result = await fetch(primaryUrl, { headers: getTmdbHeaders(primaryUrl) });
			if (result.ok) {
				return await result.json();
			}
			throw new Error(`Failed to fetch popular actors: ${result.status}`);
		} catch (error) {
			console.warn('[movieStore] tmdbGetPopularActors primary failed, retrying direct TMDB:', error);
			try {
				const directUrl = `https://api.themoviedb.org/3/${path}`;
				const directResult = await fetch(directUrl, { headers: getTmdbHeaders(directUrl) });
				if (directResult.ok) {
					return await directResult.json();
				}
			} catch (fallbackError) {
				console.error('[movieStore] tmdbGetPopularActors direct fallback failed:', fallbackError);
			}
			throw error;
		}
	},
	tmdbSearchActor: async (query: string, page?: number, language = 'vi-VN') => {
		const path = `search/person?query=${query}&language=${language}&include_adult=false${
			page ? '&page=' + page : ''
		}`;
		const primaryUrl = getTmdbUrl(path);
		try {
			const result = await fetch(primaryUrl, { headers: getTmdbHeaders(primaryUrl) });
			if (result.ok) {
				return await result.json();
			}
			throw new Error(`Failed to search actors: ${result.status}`);
		} catch (error) {
			console.warn('[movieStore] tmdbSearchActor primary failed, retrying direct TMDB:', error);
			try {
				const directUrl = `https://api.themoviedb.org/3/${path}`;
				const directResult = await fetch(directUrl, { headers: getTmdbHeaders(directUrl) });
				if (directResult.ok) {
					return await directResult.json();
				}
			} catch (fallbackError) {
				console.error('[movieStore] tmdbSearchActor direct fallback failed:', fallbackError);
			}
			throw error;
		}
	},
	tmdbGetImages: async (movieId: number) => {
		const path = `movie/${movieId}/images?include_image_language=en,null`;
		const primaryUrl = getTmdbUrl(path);
		try {
			const result = await fetch(primaryUrl, { headers: getTmdbHeaders(primaryUrl) });
			if (result.ok) {
				return await result.json();
			}
			throw new Error(`Failed to fetch movie images: ${result.status}`);
		} catch (error) {
			console.warn('[movieStore] tmdbGetImages primary failed, retrying direct TMDB:', error);
			try {
				const directUrl = `https://api.themoviedb.org/3/${path}`;
				const directResult = await fetch(directUrl, { headers: getTmdbHeaders(directUrl) });
				if (directResult.ok) {
					return await directResult.json();
				}
			} catch (fallbackError) {
				console.error('[movieStore] tmdbGetImages direct fallback failed:', fallbackError);
			}
			throw error;
		}
	},
	// kkphim api
	kkphimboGetListMovie: async (page: number) => {
		try {
			const result = await fetch(
				`https://phimapi.com/v1/api/danh-sach/phim-bo?page=${page}&limit=20`
			);
			return await result.json();
		} catch (error) {
			throw error;
		}
	},
	kkPhimboGetMovieDetail: async (movieSlug: string) => {
		try {
			const result = await fetch(`https://phimapi.com/phim/${movieSlug}`);
			return await result.json();
		} catch (error) {
			throw error;
		}
	},
	updateMyListMovies: async (movie: any, source: movieResource) => {
		try {
			// 1. Build standardized movie object
			let standardizedMovie: myListMovies;
			if (source === 'tmdb') {
				standardizedMovie = {
					source: 'tmdb',
					id: movie.id,
					_id: '',
					name: movie.title || movie.name,
					content: movie.overview || movie.content,
					origin_name: movie.original_title || movie.origin_name,
					poster_url: movie.poster_path ?? movie.poster_url,
					year: movie.release_date ?? movie.year,
					time: movie.runtime,
					slug: movie.slug,
					type: movie.type,
					status: movie.status,
					thumb_url: movie.backdrop_path ?? movie.thumb_url,
					vote_average: movie.vote_average
				};
			} else if (source === 'tmdbTv') {
				standardizedMovie = {
					source: 'tmdbTv',
					id: movie.id,
					_id: '',
					name: movie.name || movie.title,
					content: movie.overview || movie.content,
					origin_name: movie.original_name || movie.origin_name,
					poster_url: movie.poster_path ?? movie.poster_url,
					year: movie.first_air_date ?? movie.year,
					time: movie.runtime ?? '',
					slug: movie.slug,
					type: 'single',
					status: movie.status,
					thumb_url: movie.thumb_url,
					vote_average: movie.vote_average
				};
			} else {
				const cleanPoster = movie.poster_url?.replace(patternKKImageDomain, '').replace(/^\//, '') || '';
				const cleanThumb = movie.thumb_url?.replace(patternKKImageDomain, '').replace(/^\//, '') || '';
				standardizedMovie = {
					source: 'kk',
					id: '',
					_id: movie._id,
					name: movie.name,
					content: movie.content,
					origin_name: movie.origin_name,
					poster_url: cleanPoster,
					year: movie.year,
					time: movie.time,
					slug: movie.slug,
					type: movie.type,
					status: movie.status,
					thumb_url: cleanThumb,
					vote_average: 0
				};
			}

			// 2. Check if already favorited
			const isFavorited = myListMoviesStore.value.some((item) => 
				(standardizedMovie.id && item.id == standardizedMovie.id) || 
				(standardizedMovie._id && item._id == standardizedMovie._id) || 
				(standardizedMovie.slug && item.slug == standardizedMovie.slug)
			);

			let action: 'add' | 'remove';
			if (isFavorited) {
				action = 'remove';
				myListMoviesStore.value = myListMoviesStore.value.filter((item) => 
					!(
						(standardizedMovie.id && item.id == standardizedMovie.id) || 
						(standardizedMovie._id && item._id == standardizedMovie._id) || 
						(standardizedMovie.slug && item.slug == standardizedMovie.slug)
					)
				);
			} else {
				action = 'add';
				myListMoviesStore.value = [...myListMoviesStore.value, standardizedMovie];
			}

			// 3. Sync to server if logged in
			const { page } = await import('$app/state');
			const { authStore } = await import('$lib/runes/authStore.svelte');
			if (authStore.user || page.data.user) {
				await appFetch('/api/user/favorites', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ movie: standardizedMovie, action })
				});
			}
		} catch (error) {
			console.error('Error updating favorites:', error);
			throw error;
		}
	}
};

export const apiHandler = {
	srdbRegisterView: async (data: PlayerMovieInfo) => {
		try {
			const response = await appFetch('/api/sr-register-view', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			});
			if (!response.ok) {
				console.warn(`[apiHandler] srdbRegisterView status: ${response.status}`);
			}
		} catch (error) {
			console.warn('[apiHandler] srdbRegisterView skipped:', error);
		}
	},
	srdbUpdatePlayingProgress: async (data: PlayerMovieInfo) => {
		try {
			const response = await appFetch('/api/sr-update-progress', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			});
			if (!response.ok) {
				console.warn(`[apiHandler] srdbUpdatePlayingProgress status: ${response.status}`);
			}
		} catch (error) {
			console.warn('[apiHandler] srdbUpdatePlayingProgress skipped:', error);
		}
	}
};
