import type { PageLoad } from './$types';
import { moviesHandler } from '$lib/runes/movieStore.svelte';
import { getLocale } from '$lib/paraglide/runtime';

export const load: PageLoad = async ({ params }) => {
	try {
		const actorId = parseInt(params.actorId);
		const locale = getLocale() || 'vi-VN';
		const actorDetail = await moviesHandler.tmdbGetActorInfo(actorId, locale);
		return {
			actorDetail
		};
	} catch (err) {
		console.error('Error loading actor detail in +page.ts:', err);
		return {
			actorDetail: {
				id: parseInt(params.actorId) || 0,
				name: '',
				biography: '',
				profile_path: '',
				also_known_as: [],
				gender: 0,
				birthday: '',
				deathday: null,
				place_of_birth: '',
				external_ids: {
					facebook_id: null,
					instagram_id: null,
					tiktok_id: null,
					twitter_id: null,
					youtube_id: null
				},
				movie_credits: { cast: [], crew: [] },
				tv_credits: { cast: [], crew: [] }
			} as any
		};
	}
};
