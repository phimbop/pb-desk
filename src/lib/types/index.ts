export interface Movie {
	id: string;
	name: string;
	slug: string;
	origin_name: string;
	thumb_url: string;
	poster_url: string;
	year?: number | null;
	quality?: string | null;
	lang?: string | null;
	time?: string | null;
	episode_current?: string | null;
}

export interface NamedItem {
	id: string;
	name: string;
	slug: string;
}

export interface ServerData {
	name: string;
	slug: string;
	filename?: string | null;
	link_embed?: string | null;
	link_m3u8?: string | null;
}

export interface Episode {
	server_name: string;
	server_data: ServerData[];
}

export interface MovieDetail {
	id: string;
	name: string;
	slug: string;
	origin_name: string;
	content: string;
	type_name: string;
	status: string;
	thumb_url: string;
	poster_url: string;
	trailer_url?: string | null;
	time?: string | null;
	episode_current?: string | null;
	episode_total?: string | null;
	quality?: string | null;
	lang?: string | null;
	notify?: string | null;
	showtimes?: string | null;
	year?: number | null;
	view?: number | null;
	actor: string[];
	director: string[];
	category: NamedItem[];
	country: NamedItem[];
	episodes: Episode[];
}

export interface WatchHistory {
	id?: number;
	movie_slug: string;
	movie_name: string;
	poster_url: string;
	episode_name: string;
	episode_slug: string;
	link_m3u8: string;
	duration: number;
	current_time: number;
	progress_percent: number;
	updated_at: string;
}

export interface FavoriteMovie {
	id?: number;
	movie_slug: string;
	movie_name: string;
	origin_name: string;
	poster_url: string;
	year?: number | null;
	quality?: string | null;
	episode_current?: string | null;
	created_at: string;
}

export interface PaginatedResponse<T> {
	items: T[];
	current_page: number;
	total_pages: number;
	total_items: number;
	items_per_page: number;
}

export interface HomeData {
	featured_series: Movie[];
	featured_single: Movie[];
	new_updates: Movie[];
	categories: NamedItem[];
	countries: NamedItem[];
}

export interface AdultMovieRecord {
	id: string;
	is_18?: boolean;
	movie: any;
	views?: number;
	watching?: number;
	updatedAt?: string | null;
}

export interface WatchingItem {
	movie: any;
	watching: number;
}
