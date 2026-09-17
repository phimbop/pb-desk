import type {
	AdultMovieRecord,
	AuthResponse,
	AuthUser,
	FavoriteMovie,
	ForwardRequest,
	ForwardResponse,
	HomeData,
	Leaderboards,
	Movie,
	MovieDetail,
	PaginatedResponse,
	WatchHistory,
	WatchStats,
	WatchingItem,
	AppSettings,
	MovieUpdateEvent
} from './types';

// Check if running inside Tauri webview
export const isTauri = (): boolean => {
	return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

// Safe invoke helper with fallback for web browser preview
async function safeInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
	if (isTauri()) {
		const { invoke } = await import('@tauri-apps/api/core');
		return await invoke<T>(command, args);
	}

	// Fallback to direct HTTP fetch for dev browser preview
	return fallbackApi<T>(command, args);
}

async function fallbackApi<T>(command: string, args?: Record<string, unknown>): Promise<T> {
	const DOMAIN = 'https://phimapi.com';
	const SURREAL_SQL_ENDPOINT =
		(typeof import.meta !== 'undefined' &&
			(import.meta.env?.PUBLIC_SURREAL_URL || import.meta.env?.VITE_SURREAL_URL)) ||
		'https://srv2.phimbop.cfd/sql';

	switch (command) {
		case 'get_home_data': {
			const [seriesRes, singleRes, newRes] = await Promise.all([
				fetch(`${DOMAIN}/v1/api/danh-sach/phim-bo?page=1&limit=10`).then((r) => r.json()),
				fetch(`${DOMAIN}/v1/api/danh-sach/phim-le?page=1&limit=10`).then((r) => r.json()),
				fetch(`${DOMAIN}/danh-sach/phim-moi-cap-nhat?page=1`).then((r) => r.json())
			]);

			const mapItem = (it: any): Movie => ({
				id: it._id || it.id || '',
				name: it.name || '',
				slug: it.slug || '',
				origin_name: it.origin_name || '',
				thumb_url: it.thumb_url?.startsWith('http') ? it.thumb_url : `https://phimimg.com/${it.thumb_url}`,
				poster_url: it.poster_url?.startsWith('http') ? it.poster_url : `https://phimimg.com/${it.poster_url}`,
				year: it.year,
				quality: it.quality,
				lang: it.lang,
				time: it.time,
				episode_current: it.episode_current
			});

			return {
				featured_series: (seriesRes.data?.items || []).map(mapItem),
				featured_single: (singleRes.data?.items || []).map(mapItem),
				new_updates: (newRes.items || []).map(mapItem),
				categories: [
					{ id: 'hanh-dong', name: 'Hành Động', slug: 'hanh-dong' },
					{ id: 'tinh-cam', name: 'Tình Cảm', slug: 'tinh-cam' },
					{ id: 'hai-huoc', name: 'Hài Hước', slug: 'hai-huoc' },
					{ id: 'co-trang', name: 'Cổ Trang', slug: 'co-trang' },
					{ id: 'tam-ly', name: 'Tâm Lý', slug: 'tam-ly' },
					{ id: 'hinh-su', name: 'Hình Sự', slug: 'hinh-su' },
					{ id: 'vo-thuat', name: 'Võ Thuật', slug: 'vo-thuat' },
					{ id: 'vien-tuong', name: 'Viễn Tưởng', slug: 'vien-tuong' },
					{ id: 'kinh-di', name: 'Kinh Dị', slug: 'kinh-di' },
					{ id: 'hoat-hinh', name: 'Hoạt Hình', slug: 'hoat-hinh' }
				],
				countries: [
					{ id: 'viet-nam', name: 'Việt Nam', slug: 'viet-nam' },
					{ id: 'trung-quoc', name: 'Trung Quốc', slug: 'trung-quoc' },
					{ id: 'han-quoc', name: 'Hàn Quốc', slug: 'han-quoc' },
					{ id: 'nhat-ban', name: 'Nhật Bản', slug: 'nhat-ban' },
					{ id: 'au-my', name: 'Âu Mỹ', slug: 'au-my' }
				]
			} as T;
		}

		case 'get_movie_detail': {
			const slug = args?.slug as string;
			const res = await fetch(`${DOMAIN}/phim/${slug}`).then((r) => r.json());
			const raw = res.movie;
			return {
				id: raw._id,
				name: raw.name,
				slug: raw.slug,
				origin_name: raw.origin_name,
				content: raw.content,
				type_name: raw.type,
				status: raw.status,
				thumb_url: raw.thumb_url?.startsWith('http') ? raw.thumb_url : `https://phimimg.com/${raw.thumb_url}`,
				poster_url: raw.poster_url?.startsWith('http') ? raw.poster_url : `https://phimimg.com/${raw.poster_url}`,
				trailer_url: raw.trailer_url,
				time: raw.time,
				episode_current: raw.episode_current,
				episode_total: raw.episode_total,
				quality: raw.quality,
				lang: raw.lang,
				notify: raw.notify,
				showtimes: raw.showtimes,
				year: raw.year,
				view: raw.view,
				actor: raw.actor || [],
				director: raw.director || [],
				category: raw.category || [],
				country: raw.country || [],
				episodes: res.episodes || []
			} as T;
		}

		case 'get_movies_by_type': {
			const type = args?.movie_type || 'phim-bo';
			const page = args?.page || 1;
			const limit = args?.limit || 24;
			const mapItem = (it: any): Movie => ({
				id: it._id || it.id || '',
				name: it.name || '',
				slug: it.slug || '',
				origin_name: it.origin_name || '',
				thumb_url: it.thumb_url?.startsWith('http') ? it.thumb_url : `https://phimimg.com/${it.thumb_url}`,
				poster_url: it.poster_url?.startsWith('http') ? it.poster_url : `https://phimimg.com/${it.poster_url}`,
				year: it.year,
				quality: it.quality,
				lang: it.lang,
				time: it.time,
				episode_current: it.episode_current
			});

			if (type === 'phim-moi-cap-nhat' || type === 'phim-moi') {
				const res = await fetch(`${DOMAIN}/danh-sach/phim-moi-cap-nhat?page=${page}`).then((r) => r.json());
				return {
					items: (res.items || []).map(mapItem),
					current_page: res.pagination?.currentPage || Number(page),
					total_pages: res.pagination?.totalPages || 1,
					total_items: res.pagination?.totalItems || 0,
					items_per_page: res.pagination?.totalItemsPerPage || Number(limit)
				} as T;
			}

			const res = await fetch(`${DOMAIN}/v1/api/danh-sach/${type}?page=${page}&limit=${limit}`).then((r) => r.json());
			return {
				items: (res.data?.items || []).map(mapItem),
				current_page: res.data?.params?.pagination?.currentPage || Number(page),
				total_pages: res.data?.params?.pagination?.totalPages || 1,
				total_items: res.data?.params?.pagination?.totalItems || 0,
				items_per_page: Number(limit)
			} as T;
		}

		case 'get_movies_by_category': {
			const slug = args?.slug || 'hanh-dong';
			const page = args?.page || 1;
			const limit = args?.limit || 24;
			const res = await fetch(`${DOMAIN}/v1/api/the-loai/${slug}?page=${page}&limit=${limit}`).then((r) => r.json());
			const mapItem = (it: any): Movie => ({
				id: it._id || it.id || '',
				name: it.name || '',
				slug: it.slug || '',
				origin_name: it.origin_name || '',
				thumb_url: it.thumb_url?.startsWith('http') ? it.thumb_url : `https://phimimg.com/${it.thumb_url}`,
				poster_url: it.poster_url?.startsWith('http') ? it.poster_url : `https://phimimg.com/${it.poster_url}`,
				year: it.year,
				quality: it.quality,
				lang: it.lang,
				time: it.time,
				episode_current: it.episode_current
			});
			return {
				items: (res.data?.items || []).map(mapItem),
				current_page: res.data?.params?.pagination?.currentPage || Number(page),
				total_pages: res.data?.params?.pagination?.totalPages || 1,
				total_items: res.data?.params?.pagination?.totalItems || 0,
				items_per_page: Number(limit)
			} as T;
		}

		case 'get_movies_by_country': {
			const country = args?.country || 'viet-nam';
			const page = args?.page || 1;
			const limit = args?.limit || 24;
			const res = await fetch(`${DOMAIN}/v1/api/quoc-gia/${country}?page=${page}&limit=${limit}`).then((r) => r.json());
			const mapItem = (it: any): Movie => ({
				id: it._id || it.id || '',
				name: it.name || '',
				slug: it.slug || '',
				origin_name: it.origin_name || '',
				thumb_url: it.thumb_url?.startsWith('http') ? it.thumb_url : `https://phimimg.com/${it.thumb_url}`,
				poster_url: it.poster_url?.startsWith('http') ? it.poster_url : `https://phimimg.com/${it.poster_url}`,
				year: it.year,
				quality: it.quality,
				lang: it.lang,
				time: it.time,
				episode_current: it.episode_current
			});
			return {
				items: (res.data?.items || []).map(mapItem),
				current_page: res.data?.params?.pagination?.currentPage || Number(page),
				total_pages: res.data?.params?.pagination?.totalPages || 1,
				total_items: res.data?.params?.pagination?.totalItems || 0,
				items_per_page: Number(limit)
			} as T;
		}

		case 'search_movies': {
			const query = args?.query || '';
			const page = args?.page || 1;
			const limit = args?.limit || 24;
			const res = await fetch(`${DOMAIN}/v1/api/tim-kiem?keyword=${encodeURIComponent(query as string)}&page=${page}&limit=${limit}`).then((r) => r.json());
			const mapItem = (it: any): Movie => ({
				id: it._id || it.id || '',
				name: it.name || '',
				slug: it.slug || '',
				origin_name: it.origin_name || '',
				thumb_url: it.thumb_url?.startsWith('http') ? it.thumb_url : `https://phimimg.com/${it.thumb_url}`,
				poster_url: it.poster_url?.startsWith('http') ? it.poster_url : `https://phimimg.com/${it.poster_url}`,
				year: it.year,
				quality: it.quality,
				lang: it.lang,
				time: it.time,
				episode_current: it.episode_current
			});
			return {
				items: (res.data?.items || []).map(mapItem),
				current_page: res.data?.params?.pagination?.currentPage || Number(page),
				total_pages: res.data?.params?.pagination?.totalPages || 1,
				total_items: res.data?.params?.pagination?.totalItems || 0,
				items_per_page: Number(limit)
			} as T;
		}

		case 'get_watch_history': {
			const raw = localStorage.getItem('pb_history') || '[]';
			return JSON.parse(raw) as T;
		}

		case 'save_watch_history': {
			const list: WatchHistory[] = JSON.parse(localStorage.getItem('pb_history') || '[]');
			const req = args?.req as any;
			const filtered = list.filter((x) => x.movie_slug !== req.movie_slug);
			filtered.unshift({
				...req,
				updated_at: new Date().toISOString()
			});
			localStorage.setItem('pb_history', JSON.stringify(filtered.slice(0, 30)));
			return undefined as T;
		}

		case 'delete_watch_history': {
			const list: WatchHistory[] = JSON.parse(localStorage.getItem('pb_history') || '[]');
			const filtered = list.filter((x) => x.movie_slug !== args?.movie_slug);
			localStorage.setItem('pb_history', JSON.stringify(filtered));
			return undefined as T;
		}

		case 'clear_watch_history': {
			localStorage.removeItem('pb_history');
			return undefined as T;
		}

		case 'get_favorites': {
			const list: FavoriteMovie[] = JSON.parse(localStorage.getItem('pb_favorites') || '[]');
			return {
				items: list,
				current_page: 1,
				total_pages: 1,
				total_items: list.length,
				items_per_page: 24
			} as T;
		}

		case 'toggle_favorite': {
			const list: FavoriteMovie[] = JSON.parse(localStorage.getItem('pb_favorites') || '[]');
			const req = args?.req as any;
			const idx = list.findIndex((x) => x.movie_slug === req.movie_slug);
			let isFav = false;
			if (idx !== -1) {
				list.splice(idx, 1);
				isFav = false;
			} else {
				list.unshift({
					...req,
					created_at: new Date().toISOString()
				});
				isFav = true;
			}
			localStorage.setItem('pb_favorites', JSON.stringify(list));
			return isFav as T;
		}

		case 'is_favorite': {
			const list: FavoriteMovie[] = JSON.parse(localStorage.getItem('pb_favorites') || '[]');
			return list.some((x) => x.movie_slug === args?.movie_slug) as T;
		}

		case 'get_adult_movies': {
			const cached = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('pb_adult_movies') : null;
			if (cached) {
				try {
					return JSON.parse(cached) as T;
				} catch (_) {}
			}
			const res = await fetch(SURREAL_SQL_ENDPOINT, {
				method: 'POST',
				headers: {
					'surreal-ns': 'pb',
					'surreal-db': 'pbdb',
					'Authorization': 'Basic cm9vdDpyb290',
					'Accept': 'application/json'
				},
				body: 'SELECT * FROM top_movie_list WHERE is_18 = true;'
			}).then((r) => r.json());
			const items = res?.[0]?.result || [];
			if (typeof sessionStorage !== 'undefined') {
				try {
					sessionStorage.setItem('pb_adult_movies', JSON.stringify(items));
				} catch (_) {}
			}
			return items as T;
		}

		case 'get_leaderboards': {
			const cached = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('pb_leaderboards_monthly') : null;
			if (cached) {
				try {
					return JSON.parse(cached) as T;
				} catch (_) {}
			}
			const startOfMonth = new Date();
			startOfMonth.setDate(1);
			startOfMonth.setHours(0, 0, 0, 0);
			const startOfMonthStr = startOfMonth.toISOString();

			const query = `SELECT user, user.username AS username, user.avatar_url AS avatar_url, count() AS watch_count FROM user_played_list WHERE updated_at >= type::datetime('${startOfMonthStr}') GROUP BY user, username, avatar_url;
SELECT user, user.username AS username, user.avatar_url AS avatar_url, count() AS rating_count FROM rating GROUP BY user, username, avatar_url;
SELECT user, user.username AS username, user.avatar_url AS avatar_url, count() AS comment_count FROM comment GROUP BY user, username, avatar_url;
SELECT user, count() AS count FROM user_played_list GROUP BY user;`;

			const res = await fetch(SURREAL_SQL_ENDPOINT, {
				method: 'POST',
				headers: {
					'surreal-ns': 'pb',
					'surreal-db': 'pbdb',
					'Authorization': 'Basic cm9vdDpyb290',
					'Accept': 'application/json'
				},
				body: query
			}).then((r) => r.json());

			const watchersRaw: any[] = res?.[0]?.result || [];
			const reviewersRaw: any[] = res?.[1]?.result || [];
			const commentersRaw: any[] = res?.[2]?.result || [];
			const totalCountsRaw: any[] = res?.[3]?.result || [];

			const watchHoursMap = new Map<string, number>();
			for (const row of totalCountsRaw) {
				const uid = String(row.user || '');
				if (uid) {
					const normalized = uid.startsWith('user:') ? uid : `user:${uid}`;
					watchHoursMap.set(normalized, Math.round(Number(row.count || 0) * 2));
				}
			}

			const topWatchers = watchersRaw
				.map((row) => {
					const uid = String(row.user || '');
					const normalized = uid.startsWith('user:') ? uid : `user:${uid}`;
					const count = Number(row.watch_count || 0);
					return {
						userId: uid,
						username: row.username || 'Unknown',
						avatarUrl: row.avatar_url || null,
						count,
						hours: Math.round(count * 2),
						totalWatchHours: watchHoursMap.get(normalized) || 0
					};
				})
				.sort((a, b) => b.count - a.count)
				.slice(0, 50);

			const topReviewers = reviewersRaw
				.map((row) => {
					const uid = String(row.user || '');
					const normalized = uid.startsWith('user:') ? uid : `user:${uid}`;
					return {
						userId: uid,
						username: row.username || 'Unknown',
						avatarUrl: row.avatar_url || null,
						count: Number(row.rating_count || 0),
						hours: 0,
						totalWatchHours: watchHoursMap.get(normalized) || 0
					};
				})
				.sort((a, b) => b.count - a.count)
				.slice(0, 50);

			const topCommenters = commentersRaw
				.map((row) => {
					const uid = String(row.user || '');
					const normalized = uid.startsWith('user:') ? uid : `user:${uid}`;
					return {
						userId: uid,
						username: row.username || 'Unknown',
						avatarUrl: row.avatar_url || null,
						count: Number(row.comment_count || 0),
						hours: 0,
						totalWatchHours: watchHoursMap.get(normalized) || 0
					};
				})
				.sort((a, b) => b.count - a.count)
				.slice(0, 50);

			const leaderboards = { topWatchers, topReviewers, topCommenters };
			if (typeof sessionStorage !== 'undefined') {
				try {
					sessionStorage.setItem('pb_leaderboards_monthly', JSON.stringify(leaderboards));
				} catch (_) {}
			}
			return leaderboards as T;
		}

		case 'get_watching_list': {
			const limit = (args?.limit as number) || 10;
			try {
				const res = await fetch('https://v3.phimbop.cfd/api/watching/list').then((r) => r.json());
				if (Array.isArray(res)) {
					return res.slice(0, limit) as T;
				}
			} catch (_) {}
			return [] as T;
		}

		case 'record_watching_heartbeat': {
			const req = args?.req as any;
			if (req?.movie_id && req?.session_id) {
				try {
					await fetch('https://v3.phimbop.cfd/api/watching/heartbeat', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ movieId: req.movie_id, sessionId: req.session_id })
					});
				} catch (_) {}
			}
			return undefined as T;
		}

		case 'auth_login': {
			const req = args?.req as any;
			return fetch('https://v3.phimbop.cfd/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'Origin': 'https://v3.phimbop.cfd' },
				body: JSON.stringify(req)
			}).then(async (r) => {
				const data = await r.json();
				if (!r.ok) return { success: false, error: data.error || 'Login failed' } as T;
				return { success: true, user: data.user } as T;
			});
		}

		case 'auth_signup': {
			const req = args?.req as any;
			return fetch('https://v3.phimbop.cfd/api/auth/signup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'Origin': 'https://v3.phimbop.cfd' },
				body: JSON.stringify(req)
			}).then(async (r) => {
				const data = await r.json();
				if (!r.ok) return { success: false, error: data.error || 'Signup failed' } as T;
				return { success: true, user: data.user } as T;
			});
		}

		case 'auth_get_me': {
			const token = args?.token as string;
			return fetch('https://v3.phimbop.cfd/api/auth/me', {
				headers: { Cookie: `session=${token}`, Origin: 'https://v3.phimbop.cfd' }
			}).then(async (r) => {
				const data = await r.json();
				return data.user as T;
			});
		}

		case 'auth_logout': {
			const token = args?.token as string;
			return fetch('https://v3.phimbop.cfd/api/auth/logout', {
				method: 'POST',
				headers: { Cookie: `session=${token}`, Origin: 'https://v3.phimbop.cfd' }
			}).then(() => undefined as T);
		}

		case 'forward_api': {
			const req = args?.req as ForwardRequest;
			const headers: Record<string, string> = {
				'Content-Type': 'application/json',
				'Origin': 'https://v3.phimbop.cfd',
				'Accept': 'application/json'
			};
			if (req.token) {
				headers['Cookie'] = `session=${req.token}`;
			}
			const path = req.path.startsWith('/') ? req.path : `/${req.path}`;
			return fetch(`https://v3.phimbop.cfd${path}`, {
				method: req.method,
				headers,
				body: req.body ? JSON.stringify(req.body) : undefined
			}).then(async (r) => {
				let body = {};
				try {
					body = await r.json();
				} catch (_) {}
				return {
					status: r.status,
					body
				} as T;
			});
		}

		case 'get_user_watch_stats': {
			const userId = (args?.userId || args?.user_id) as string;
			return fetch(SURREAL_SQL_ENDPOINT, {
				method: 'POST',
				headers: {
					'surreal-ns': 'pb',
					'surreal-db': 'pbdb',
					'Authorization': 'Basic cm9vdDpyb290',
					'Accept': 'application/json'
				},
				body: `SELECT count() AS count FROM user_played_list WHERE user = type::record('${userId}') OR user = '${userId}' GROUP ALL;`
			}).then(async (r) => {
				const data = await r.json();
				const count = data?.[0]?.result?.[0]?.count || 0;
				return {
					totalMovies: count,
					totalHours: count * 2,
					topGenres: [],
					ratingsCount: 0
				} as T;
			});
		}

		case 'get_app_settings': {
			const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('app_settings') : null;
			if (saved) {
				try {
					return JSON.parse(saved) as T;
				} catch {}
			}
			return {
				autostart: true,
				minimizeToTray: true,
				notifyNewMovies: true,
				notifyMode: 'all',
				checkIntervalMins: 15
			} as T;
		}

		case 'save_app_settings': {
			if (typeof localStorage !== 'undefined' && args?.settings) {
				localStorage.setItem('app_settings', JSON.stringify(args.settings));
			}
			return undefined as T;
		}

		case 'check_for_movie_updates': {
			return [] as T;
		}

		default:
			throw new Error(`Unknown command: ${command}`);
	}
}

// Export high-level IPC service wrappers
export const api = {
	getHomeData: () => safeInvoke<HomeData>('get_home_data'),
	getMovieDetail: (slug: string) => safeInvoke<MovieDetail>('get_movie_detail', { slug }),
	getMoviesByType: (movieType: string, page = 1, limit = 24) =>
		safeInvoke<PaginatedResponse<Movie>>('get_movies_by_type', { movieType, movie_type: movieType, page, limit }),
	getMoviesByCategory: (slug: string, page = 1, limit = 24) =>
		safeInvoke<PaginatedResponse<Movie>>('get_movies_by_category', { slug, page, limit }),
	getMoviesByCountry: (country: string, page = 1, limit = 24) =>
		safeInvoke<PaginatedResponse<Movie>>('get_movies_by_country', { country, page, limit }),
	searchMovies: (query: string, page = 1, limit = 24) =>
		safeInvoke<PaginatedResponse<Movie>>('search_movies', { query, page, limit }),
	getWatchHistory: (limit = 20) => safeInvoke<WatchHistory[]>('get_watch_history', { limit }),
	saveWatchHistory: (req: Omit<WatchHistory, 'id' | 'updated_at'>) =>
		safeInvoke<void>('save_watch_history', { req }),
	deleteWatchHistory: (movieSlug: string) =>
		safeInvoke<void>('delete_watch_history', { movieSlug, movie_slug: movieSlug }),
	clearWatchHistory: () => safeInvoke<void>('clear_watch_history'),
	getFavorites: (page = 1, limit = 24) =>
		safeInvoke<PaginatedResponse<FavoriteMovie>>('get_favorites', { page, limit }),
	toggleFavorite: (req: Omit<FavoriteMovie, 'id' | 'created_at'>) =>
		safeInvoke<boolean>('toggle_favorite', { req }),
	isFavorite: (movieSlug: string) => safeInvoke<boolean>('is_favorite', { movieSlug, movie_slug: movieSlug }),
	getAdultMovies: () => safeInvoke<AdultMovieRecord[]>('get_adult_movies'),
	getLeaderboards: () => safeInvoke<Leaderboards>('get_leaderboards'),
	getWatchingList: (limit = 10) => safeInvoke<WatchingItem[]>('get_watching_list', { limit }),
	recordWatchingHeartbeat: (movieId: string, sessionId: string) =>
		safeInvoke<void>('record_watching_heartbeat', {
			req: { movie_id: movieId, session_id: sessionId }
		}),
	login: (req: { email: string; password: string }) =>
		safeInvoke<AuthResponse>('auth_login', { req }),
	signup: (req: { email: string; username: string; password: string }) =>
		safeInvoke<AuthResponse>('auth_signup', { req }),
	getMe: (token: string) =>
		safeInvoke<AuthUser>('auth_get_me', { token }),
	logout: (token?: string | null) =>
		safeInvoke<void>('auth_logout', { token }),
	forwardApi: (req: ForwardRequest) =>
		safeInvoke<ForwardResponse>('forward_api', { req }),
	getUserWatchStats: (userId: string) =>
		safeInvoke<WatchStats>('get_user_watch_stats', { userId, user_id: userId }),
	getAppSettings: () => safeInvoke<AppSettings>('get_app_settings'),
	saveAppSettings: (settings: AppSettings) => safeInvoke<void>('save_app_settings', { settings }),
	checkForMovieUpdates: () => safeInvoke<MovieUpdateEvent[]>('check_for_movie_updates'),
	getInstallationId: () => safeInvoke<string>('get_installation_id')
};

export async function enableAutostart(): Promise<boolean> {
	if (isTauri()) {
		try {
			const { enable, isEnabled } = await import('@tauri-apps/plugin-autostart');
			if (!(await isEnabled())) {
				await enable();
			}
			return true;
		} catch (e) {
			console.warn('[Autostart] enable failed:', e);
			return false;
		}
	}
	return false;
}

export async function disableAutostart(): Promise<boolean> {
	if (isTauri()) {
		try {
			const { disable, isEnabled } = await import('@tauri-apps/plugin-autostart');
			if (await isEnabled()) {
				await disable();
			}
			return true;
		} catch (e) {
			console.warn('[Autostart] disable failed:', e);
			return false;
		}
	}
	return false;
}

export async function checkAutostartEnabled(): Promise<boolean> {
	if (isTauri()) {
		try {
			const { isEnabled } = await import('@tauri-apps/plugin-autostart');
			return await isEnabled();
		} catch {
			return false;
		}
	}
	return false;
}

/**
 * Universal appFetch helper that automatically routes /api/* requests
 * through Tauri forward_api (or remote URL in browser dev) with session token.
 */
export async function appFetch(input: string | URL, init?: RequestInit): Promise<Response> {
	const urlStr = typeof input === 'string' ? input : input.toString();
	if (urlStr.startsWith('/api/') || urlStr.startsWith('api/')) {
		const method = init?.method || 'GET';
		let body = undefined;
		if (init?.body) {
			try {
				body = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
			} catch {
				body = init.body;
			}
		}
		const token = typeof localStorage !== 'undefined' ? localStorage.getItem('session_token') : null;
		const res = await api.forwardApi({
			method,
			path: urlStr.startsWith('/') ? urlStr : `/${urlStr}`,
			body,
			token
		});
		return new Response(JSON.stringify(res.body), {
			status: res.status,
			headers: { 'Content-Type': 'application/json' }
		});
	}
	return fetch(input, init);
}

