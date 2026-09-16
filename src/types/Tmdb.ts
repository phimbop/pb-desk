// Định nghĩa một kiểu cho các genre_ids
type Genre = number[];

// Định nghĩa một kiểu cho thông tin chi tiết của một bộ phim
export type Movie = {
	adult: boolean;
	backdrop_path: string;
	genre_ids: Genre;
	id: number;
	original_language: string;
	original_title: string;
	overview: string;
	popularity: number;
	poster_path: string;
	release_date: string;
	title: string;
	video: boolean;
	vote_average: number;
	vote_count: number;
};

// Định nghĩa một kiểu cho trang kết quả của danh sách phim
export type TmdbMovies = {
	page: number;
	results: Movie[];
	total_pages: number;
	total_results: number;
} | null;

// Các kiểu dữ liệu khác
export type TmdbMovieList = 'now_playing' | 'popular' | 'top_rated' | 'upcoming';

//Search Movies
export interface TmdbSearchResult<T> {
	page: number;
	results: T[];
	total_pages: number;
	total_results: number;
}

// Interface cũ cho Movie (giữ nguyên)
export interface TmdbMovieSearchItem {
	adult: boolean;
	backdrop_path: string | null;
	genre_ids: number[];
	id: number;
	original_language: string;
	original_title: string;
	overview: string;
	popularity: number;
	poster_path: string | null;
	release_date: string;
	title: string;
	video: boolean;
	vote_average: number;
	vote_count: number;
	media_type?: 'movie'; // Optional để hỗ trợ endpoint không trả media_type
}

// Interface cho TV Show + trending tv
export interface TmdbTvSearchItem {
	adult: boolean;
	backdrop_path: string | null;
	genre_ids: number[];
	id: number;
	original_language: string;
	original_name: string;
	overview: string;
	popularity: number;
	poster_path: string | null;
	first_air_date: string;
	name: string;
	origin_country: string[];
	vote_average: number;
	vote_count: number;
	media_type?: 'tv'; // Optional để hỗ trợ endpoint không trả media_type
}

// type TmdbMovieSearchResult = TmdbSearchResult<TmdbMovieSearchItem>;
type TmdbTvSearchResult = TmdbSearchResult<TmdbTvSearchItem>;

export interface TmdbMovieSearchResult {
	page: number;
	results: TmdbMovieSearchItem[];
	total_pages: number;
	total_results: number;
}
// Movie Details
export interface TmdbMovieDetail {
	adult: boolean;
	backdrop_path: string | null;
	belongs_to_collection: {
		id: number;
		name: string;
		poster_path: string | null;
		backdrop_path: string | null;
	} | null;
	budget: number;
	genres: Array<{ id: number; name: string }>;
	homepage: string;
	id: number;
	imdb_id: string;
	original_language: string;
	original_title: string;
	overview: string;
	popularity: number;
	poster_path: string | null;
	production_companies: Array<{
		id: number;
		logo_path: string | null;
		name: string;
		origin_country: string;
	}>;
	production_countries: Array<{ iso_3166_1: string; name: string }>;
	release_date: string;
	revenue: number;
	runtime: number;
	spoken_languages: Array<{ english_name: string; iso_639_1: string; name: string }>;
	status: string;
	tagline: string;
	title: string;
	video: boolean;
	vote_average: number;
	vote_count: number;
	credits: {
		cast: Array<{
			adult: boolean;
			gender: number;
			id: number;
			known_for_department: string;
			name: string;
			original_name: string;
			popularity: number;
			profile_path: string;
			cast_id: number;
			character: string;
			credit_id: string;
			order: number;
		}>;
		crew: Array<{
			adult: boolean;
			gender: number;
			id: number;
			known_for_department: string;
			name: string;
			original_name: string;
			popularity: number;
			profile_path: string;
			department: string;
			job: string;
			credit_id: string;
		}>;
	};
}

// Movies genres
type TmdbMovieGenre = {
	id: number;
	name: string;
};

type TmdbApiMovieGenres = {
	genres: TmdbMovieGenre[];
};

export interface TmdbCountryType {
	iso_3166_1: string;
	english_name: string;
	native_name: string;
}

export interface FilterType {
	movieGenres?: number[];
	country?: string[];
	year?: string[];
	movieTitle?: string;
}
// Cast actor
export interface TmdbActorDetailType {
	adult?: boolean;
	also_known_as?: string[];
	biography?: string;
	birthday?: string;
	deathday?: null;
	gender?: number;
	homepage?: null;
	id?: number;
	imdb_id?: string;
	known_for_department?: string;
	name?: string;
	place_of_birth?: string;
	popularity?: number;
	profile_path?: string;
	external_ids?: ExternalIDS;
	movie_credits?: MovieCredits;
	tv_credits?: any;
}

interface ExternalIDS {
	freebase_mid?: string;
	freebase_id?: string;
	imdb_id?: string;
	tvrage_id?: number;
	wikidata_id?: string;
	facebook_id?: string;
	instagram_id?: string | null;
	tiktok_id?: string | null;
	twitter_id?: string | null;
	youtube_id?: string | null;
	[key: string]: any;
}

interface MovieCredits {
	cast?: Cast[];
	crew?: Cast[];
}

interface Cast {
	adult?: boolean;
	backdrop_path?: null | string;
	genre_ids?: number[];
	id?: number;
	original_language?: string;
	original_title?: string;
	overview?: string;
	popularity?: number;
	poster_path?: null | string;
	release_date?: string;
	title?: string;
	video?: boolean;
	vote_average?: number;
	vote_count?: number;
	character?: string;
	credit_id?: string;
	order?: number;
	department?: string;
	job?: string;
}

// actor or people list popular
type KnownFor = {
	backdrop_path: string | null;
	id: number;
	name?: string;
	original_name?: string;
	title?: string;
	original_title?: string;
	overview: string;
	poster_path: string;
	media_type: 'movie' | 'tv';
	adult: boolean;
	original_language: string;
	genre_ids: number[];
	popularity: number;
	release_date?: string;
	first_air_date?: string;
	vote_average: number;
	vote_count: number;
	origin_country?: string[];
	video?: boolean;
};

type ListActorPopularResult = {
	adult: boolean;
	gender: number;
	id: number;
	known_for_department: string;
	name: string;
	original_name: string;
	popularity: number;
	profile_path: string;
	known_for: KnownFor[];
};

type ListActorPopular = {
	page: number;
	results: ListActorPopularResult[];
	total_pages: number;
	total_results: number;
};
// TV Details

interface Network {
	id: number;
	name: string;
	logo_path: string | null;
	origin_country: string;
}

interface ProductionCompany {
	id: number;
	logo_path: string | null;
	name: string;
	origin_country: string;
}

interface ProductionCountry {
	iso_3166_1: string;
	name: string;
}

interface SpokenLanguage {
	english_name: string;
	iso_639_1: string;
	name: string;
}

interface Creator {
	id: number;
	credit_id: string;
	name: string;
	original_name: string;
	gender: number;
	profile_path: string | null;
}

interface EpisodeBase {
	id: number;
	name: string;
	overview: string;
	vote_average: number;
	vote_count: number;
	air_date: string;
	episode_number: number;
	episode_type?: string;
	production_code: string;
	runtime: number | null;
	season_number: number;
	show_id: number;
	still_path: string | null;
}

interface SeasonBase {
	air_date: string;
	episode_count: number;
	id: number;
	name: string;
	overview: string;
	poster_path: string | null;
	season_number: number;
	vote_average?: number;
}

interface ExternalIds {
	imdb_id: string | null;
	freebase_mid: string | null;
	freebase_id: string | null;
	tvdb_id: number | null;
	tvrage_id: string | null;
	wikidata_id: string | null;
	facebook_id: string | null;
	instagram_id: string | null;
	twitter_id: string | null;
}

interface CastMember {
	adult: boolean;
	gender: number;
	id: number;
	known_for_department: string;
	name: string;
	original_name: string;
	popularity: number;
	profile_path: string | null;
	character: string;
	credit_id: string;
	order: number;
}

interface CrewMember {
	adult: boolean;
	gender: number;
	id: number;
	known_for_department: string;
	name: string;
	original_name: string;
	popularity: number;
	profile_path: string | null;
	credit_id: string;
	department: string;
	job: string;
}

interface Credits {
	cast: CastMember[];
	crew: CrewMember[];
}

interface Video {
	iso_639_1: string;
	iso_3166_1: string;
	name: string;
	key: string;
	site: string;
	size: number;
	type: string;
	official: boolean;
	published_at: string;
	id: string;
}

interface Videos {
	results: Video[];
}
export interface Image {
	aspect_ratio: number;
	height: number;
	iso_639_1: string | null;
	file_path: string;
	vote_average: number;
	vote_count: number;
	width: number;
}
export interface Images {
	backdrops: Image[];
	logos: Image[];
	posters: Image[];
}

/* -------------------------------------------------------------------------- */
/*                         TV Series Detail Response                          */
/* -------------------------------------------------------------------------- */
export type TvSeriesDetail = {
	adult: boolean;
	backdrop_path: string | null;
	created_by: Creator[];
	episode_run_time: number[];
	first_air_date: string;
	genres: TmdbMovieGenre[];
	homepage: string;
	id: number;
	in_production: boolean;
	languages: string[];
	last_air_date: string;
	last_episode_to_air: EpisodeBase;
	name: string;
	next_episode_to_air: EpisodeBase | null;
	networks: Network[];
	number_of_episodes: number;
	number_of_seasons: number;
	origin_country: string[];
	original_language: string;
	original_name: string;
	overview: string;
	popularity: number;
	poster_path: string | null;
	production_companies: ProductionCompany[];
	production_countries: ProductionCountry[];
	seasons: SeasonBase[];
	spoken_languages: SpokenLanguage[];
	status: string;
	tagline: string;
	type: string;
	vote_average: number;
	vote_count: number;
	external_ids: ExternalIds;
	credits: Credits;
	videos: Videos;
	images?: Images;
};

/* -------------------------------------------------------------------------- */
/*                       Season Detail (with episodes)                        */
/* -------------------------------------------------------------------------- */
type SeasonDetail = {
	_id: string;
	air_date: string;
	episodes: EpisodeBase[];
	name: string;
	overview: string;
	id: number;
	poster_path: string | null;
	season_number: number;
	vote_average: number;
};
export interface TmdbTvStoreType {
	tvId: number | string | any;
	currentSeason?: number | string | any;
	currentEpisode?: number | string | any;
	tvSeriesDetail?: TvSeriesDetail;
}

/* -------------------------------------------------------------------------- */
/*                      Network Provider                                      */
/* -------------------------------------------------------------------------- */
export interface NetworkProviderItem {
	provider_name: string;
	provider_id: number;
	country: string;
	logo_path: string | null;
}
