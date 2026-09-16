import { error, isHttpError } from '@sveltejs/kit';
import { moviesHandler } from '$lib/runes/movieStore.svelte';
import { getLocale } from '$lib/paraglide/runtime';
import type { LayoutLoad } from './$types';
import type { TmdbMovieDetail } from '../../../../types/Tmdb';

export const load: LayoutLoad = async ({ params }) => {
	const rawMovieId = params.movieId?.trim();
	const parsedId = Number(rawMovieId);

	if (
		!rawMovieId ||
		rawMovieId === 'null' ||
		rawMovieId === 'undefined' ||
		isNaN(parsedId) ||
		!Number.isInteger(parsedId) ||
		parsedId <= 0
	) {
		error(404, 'Movie not found');
	}

	try {
		const locale = getLocale() || 'vi-VN';
		const movieDetail: TmdbMovieDetail = await moviesHandler.tmdbGetMovieDetails(
			parsedId,
			locale
		);

		if (!movieDetail || !movieDetail.id || (movieDetail as any).success === false) {
			error(404, 'Movie not found');
		}

		const rating: { avgScore: number; totalRatings: number; userScore: number | null } = {
			avgScore: 0,
			totalRatings: 0,
			userScore: null
		};

		return {
			movieDetail,
			rating
		};
	} catch (err) {
		if (isHttpError(err)) {
			throw err;
		}
		console.error('Error loading movie detail layout data:', err);
		error(404, 'Movie not found');
	}
};
