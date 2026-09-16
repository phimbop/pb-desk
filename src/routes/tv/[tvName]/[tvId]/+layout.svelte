<script lang="ts">
	import { page } from '$app/state';
	import TmdbTvLayout from '$lib/Components/layout/tmdbTvLayout.svelte';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
	let tvDetail = $derived(page.data.tvDetail);
</script>

<TmdbTvLayout checkMovieEpisodes={false} {tvDetail} movieSource="tmdbTv" {children} />
