<script lang="ts">
	import { page } from '$app/state';
	import TenPhimLayout from '$lib/Components/layout/tenPhimLayout.svelte';
	import { kkPhimboTapPhimStore } from '$lib/runes/kkPhimStore.svelte';
	import { playedListStore, myListMoviesStore } from '$lib/runes/movieStore.svelte';
	import { onMount } from 'svelte';
	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
	let checkMovieEpisodes = $derived((movieSlug: string, episodes: string) => {
		const a = kkPhimboTapPhimStore.value;
		let found = false;
		try {
			for (const movie of a) {
				if (movie.movie === movieSlug && movie.episodes === episodes) {
					found = true;
					break;
				}
			}
			return found;
		} catch (error) {
			return false;
		}
	});
	onMount(async () => {
		await kkPhimboTapPhimStore.load();
		await playedListStore.load();
		await myListMoviesStore.load();
	});
</script>

<TenPhimLayout
	{checkMovieEpisodes}
	movieDetail={page.data.kkPhimleDetail}
	movieSource="kkPhimLe"
	{children}
/>
