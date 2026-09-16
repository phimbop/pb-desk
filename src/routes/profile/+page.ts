import type { PageLoad } from './$types';
import { api } from '$lib/ipc';
import { authStore } from '$lib/runes/authStore.svelte';
import { redirect } from '@sveltejs/kit';

export const load: PageLoad = async () => {
	await authStore.init();

	if (!authStore.user) {
		throw redirect(302, '/');
	}

	try {
		const stats = await api.getUserWatchStats(authStore.user.id);
		return {
			user: authStore.user,
			stats: stats || {
				totalMovies: 0,
				totalHours: 0,
				topGenres: [],
				ratingsCount: 0
			}
		};
	} catch (err) {
		console.error('Failed to get watch stats:', err);
		return {
			user: authStore.user,
			stats: {
				totalMovies: 0,
				totalHours: 0,
				topGenres: [],
				ratingsCount: 0
			}
		};
	}
};
