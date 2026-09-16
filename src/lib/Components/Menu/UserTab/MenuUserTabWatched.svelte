<script lang="ts">
	import Paginations from '$lib/Components/Paginations.svelte';
	import { playedListStore } from '$lib/runes/movieStore.svelte';
	import CardMyMoviesList from '$lib/Components/Card/CardMyMoviesList.svelte';
	import { sortPlayedList } from '$lib/helper/sortListPlayedMovie';
	import { onMount } from 'svelte';
	import { m } from '$lib/paraglide/messages';
	let movies = $derived(playedListStore.value)
	$inspect('movies', movies);
	let loading = false;
	let currentPage = $state(1);
	interface Props {
		itemsPerPage?: number;
	}

	let { itemsPerPage = 20 }: Props = $props();
	let currentMovieList: PlayerMovieInfo[] = $state([]);
	let filteredData: any[] = $state([]);
	let totalPages = $derived(Math.ceil(filteredData.length / itemsPerPage));
	
	$effect(() => {
		if (playedListStore.value) {
			filteredData = playedListStore.value;
		} else {
			filteredData = [];
		}
	let startIndex = (currentPage - 1) * itemsPerPage;
    let endIndex = startIndex + itemsPerPage;
    currentMovieList = sortPlayedList(filteredData).slice(startIndex, endIndex);
	});
	onMount(async () => {
		await playedListStore.load();
	});
</script>
{#if playedListStore.value?.length}
<section  class="w-full">
	<div class=" flex mx-auto">
		<div class="grid md:grid-cols-10 gap-2 w-full h-full">
			{#key playedListStore.value}
				{#each currentMovieList.slice(0, itemsPerPage) as movie,i}
					<CardMyMoviesList movie={movie} showDate={false} showWatchedTime={true} class="" />
				{/each}
			{/key}
		</div>
	</div>
    <div class="flex flex-col items-center mx-auto w-full container">
        {#key currentPage}
		<Paginations
        totalPages={totalPages}
        bind:currentPage
		/>
        {/key}
    </div>
</section>
{:else}
<p class="text-center text-slate-200">{m.searchpage_no_results()}</p>
{/if}

