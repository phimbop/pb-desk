<script lang="ts">
	import Paginations from '$lib/Components/Paginations.svelte';
	import { myListMoviesStore } from '../../../runes/movieStore.svelte';
	import CardMyMoviesList from '$lib/Components/Card/CardMyMoviesList.svelte';
	import { onMount } from 'svelte';
	import { m } from '$lib/paraglide/messages';
	let loading = false;
	let currentPage = $state(1);
	let itemsPerPage = 20;
	let currentMovieList: myListMovies[] = $state([]);
	let filteredData: any[] = $state([]);
	let totalPages = $derived(Math.ceil(filteredData.length / itemsPerPage));
	const handlePageChange = async (page: number) => {
		loading = true;
		const filteredData = myListMoviesStore.value.map((item) => item);
		loading = false;
	};
	$effect(() => {
		if (myListMoviesStore.value) {
			filteredData = myListMoviesStore.value;
		} else {
			filteredData = [];
		}
	let startIndex = (currentPage - 1) * itemsPerPage;
    let endIndex = startIndex + itemsPerPage;
    currentMovieList = filteredData.toReversed().slice(startIndex, endIndex);
	});
	onMount(async () => {
		await myListMoviesStore.load();
	});
</script>
{#if myListMoviesStore.value.length}
<section  class="w-full">
	<div class=" flex mx-auto">
		<div class="grid md:grid-cols-10 gap-2 w-full h-full">
			<!-- {#key myListMoviesStore.value} -->
				{#each currentMovieList as movie,i}
					<CardMyMoviesList movie={movie} showDate={false} showWatchedTime={false} class="" />
				{/each}
			<!-- {/key} -->
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
<p class="text-center text-slate-200 mt-10">{m.searchpage_no_results()}</p>
{/if}

