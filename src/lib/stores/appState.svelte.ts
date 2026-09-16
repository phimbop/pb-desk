// Global application state using Svelte 5 Runes
import { isPlaying } from '$lib/runes/movieStore.svelte';

export const appState = $state({
	get isPlaying() {
		return isPlaying.value;
	},
	set isPlaying(val: boolean) {
		isPlaying.value = val;
	},
	searchQuery: '',
	unreadCount: 0,
	historyUpdated: 0,
	favoritesUpdated: 0
});
