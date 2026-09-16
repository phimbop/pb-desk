import type {
	TmdbMovies as TmdbMoviesType,
	FilterType as FilterTypeType,
	TmdbActorDetailType as TmdbActorDetailTypeType,
	Movie as MovieType,
	TmdbMovieDetail as TmdbMovieDetailType,
	TvSeriesDetail as TvSeriesDetailType,
	TmdbMovieList as TmdbMovieListType,
	TmdbCountryType as TmdbCountryTypeType,
	TmdbMovieSearchResult as TmdbMovieSearchResultType
} from './types/Tmdb';

declare global {
	type TmdbMovies = TmdbMoviesType;
	type FilterType = FilterTypeType;
	type TmdbActorDetailType = TmdbActorDetailTypeType;
	type Movie = MovieType;
	type TmdbMovieDetail = TmdbMovieDetailType;
	type TvSeriesDetail = TvSeriesDetailType;
	type TmdbMovieList = TmdbMovieListType;
	type TmdbCountryType = TmdbCountryTypeType;
	type TmdbMovieSearchResult = TmdbMovieSearchResultType;

	namespace App {
		// interface Error {}
		interface Locals {
			locale: string;
			user: {
				id: string;
				email: string;
				username: string;
				avatar_url: string | null;
				created_at: string;
				email_verified: boolean;
			} | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
