<script lang="ts">
	import { page } from '$app/state';
	import TmdbLayout from '$lib/Components/layout/tmdbLayout.svelte';
	import { playedListStore, myListMoviesStore } from '$lib/runes/movieStore.svelte';
	import { onMount } from 'svelte';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
	let movieDetail = $derived(page.data.movieDetail);

	onMount(async () => {
		await playedListStore.load();
		await myListMoviesStore.load();
	});
</script>

<TmdbLayout checkMovieEpisodes={false} {movieDetail} movieSource="tmdb" {children} />
