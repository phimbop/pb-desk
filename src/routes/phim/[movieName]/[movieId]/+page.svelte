<script lang="ts">
	import TmdbPage from '$lib/Components/layout/tmdbPage.svelte';
	import { page } from '$app/state';
	import { myListMoviesStore } from '$lib/runes/movieStore.svelte';

	let movieDetail = $derived(page.data.movieDetail);
	let movieListed = $derived(
		myListMoviesStore.value.some((item) => 
			(item.id && movieDetail?.id && item.id == movieDetail.id) ||
			(item.slug && movieDetail?.slug && item.slug === movieDetail.slug)
		)
	);
</script>

<TmdbPage currentEpisode={2} {movieDetail} {movieListed} movieSource="tmdb" watchPercent={0} />
