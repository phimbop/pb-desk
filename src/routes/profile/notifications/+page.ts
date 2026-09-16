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
		const res = await appFetch('/api/notifications');
		if (res.ok) {
			const notifications = await res.json();
			return {
				notifications: Array.isArray(notifications) ? notifications : []
			};
		}
	} catch (err) {
		console.error('Failed to load notifications in profile loader:', err);
	}

	return {
		notifications: []
	};
};
