import type { PageLoad } from './$types';
import { authStore } from '$lib/runes/authStore.svelte';
import { appFetch } from '$lib/ipc';
import { redirect } from '@sveltejs/kit';

export const load: PageLoad = async () => {
	await authStore.init();

	if (!authStore.user) {
		throw redirect(302, '/');
	}

	try {
		const res = await appFetch('/api/playlists');
		if (res.ok) {
			const playlists = await res.json();
			return {
				user: authStore.user,
				playlists: Array.isArray(playlists) ? playlists : []
			};
		}
	} catch (err) {
		console.error('Error loading playlists for profile:', err);
	}

	return {
		user: authStore.user,
		playlists: []
	};
};
