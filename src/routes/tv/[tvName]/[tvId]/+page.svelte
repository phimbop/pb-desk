<script lang="ts">
	import { page } from '$app/state';
	import { myListMoviesStore } from '$lib/runes/movieStore.svelte';
	import TmdbTvPage from '$lib/Components/layout/tmdbTvPage.svelte';

	let tvDetail = $derived(page.data.tvDetail);
	let movieListed = $derived(myListMoviesStore.value.map((item) => item.id).includes(tvDetail?.id));
</script>

{#if tvDetail?.id}
	<TmdbTvPage {tvDetail} movieSource="tmdbTv" />
{/if}
