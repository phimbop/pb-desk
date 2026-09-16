import { authStore } from '$lib/runes/authStore.svelte';
import type { LayoutLoad } from './$types';

export const prerender = false;
export const ssr = false;

export const load: LayoutLoad = async () => {
	await authStore.init();
	return {
		get user() {
			return authStore.user;
		}
	};
};
