<script lang="ts">
	import CardActorList from '$lib/Components/Card/CardActorList.svelte';
	import { fade } from 'svelte/transition';
	import { page } from '$app/state';
	import Paginations from '$lib/Components/Paginations.svelte';
	import { moviesHandler } from '$lib/runes/movieStore.svelte';
	import LoadingSearch from '$lib/Components/loadingSearch.svelte';
	import LoadingSubBlur from '$lib/Components/LoadingSubBlur.svelte';
	import Seo from '$lib/Components/SEO/Seo.svelte';
	import { websiteUrl } from '$lib';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { onMount } from 'svelte';

	let actorStore = $state({ value: page.data?.popularActors ?? { results: [], total_pages: 0 } });
	let inputValue = $state('');
	let mounted = $state(false);

	onMount(async () => {
		if (!actorStore.value?.results?.length) {
			const res = await moviesHandler.tmdbGetPopularActors(1, getLocale());
			if (res) actorStore.value = res;
		}
		mounted = true;
	});

	const handleSearchCloseClicked = () => {
		inputValue = '';
		if (currentPage === 1) {
			actorStore.value = page.data?.popularActors ?? { results: [], total_pages: 0 };
		} else {
			currentPage = 1;
		}
		useSearchStore = false;
	};

	let currentPage = $state(actorStore.value?.page ?? 1);
	let searching = $state(false);
	let useSearchStore = $state(false);

	const handlePageChange = async (pageNumber: number) => {
		if (useSearchStore) {
			searching = true;
			const actorList = await moviesHandler.tmdbSearchActor(inputValue, pageNumber, getLocale());
			actorStore.value = actorList ?? { results: [], total_pages: 0 };
			currentPage = pageNumber;
			searching = false;
		} else {
			searching = true;
			const actorList = await moviesHandler.tmdbGetPopularActors(pageNumber, getLocale());
			actorStore.value = actorList ?? { results: [], total_pages: 0 };
			currentPage = pageNumber;
			searching = false;
		}
	};

	const handleSearchInput = async (e: any) => {
		if (e.target.value === '') {
			useSearchStore = false;
			currentPage = 1;
			actorStore.value = page.data?.popularActors ?? { results: [], total_pages: 0 };
			return;
		}
		useSearchStore = true;
		searching = true;
		const actorList = await moviesHandler.tmdbSearchActor(e.target.value, 1, getLocale());
		actorStore.value = actorList ?? { results: [], total_pages: 0 };
		currentPage = 1;
		searching = false;
	};

	$effect(() => {
		if (mounted && currentPage) {
			const loadedPage = actorStore.value?.page ?? 1;
			if (currentPage !== loadedPage) {
				handlePageChange(currentPage);
			}
		}
	});
</script>

<Seo title={m.searchpage_actor_seo_title()} metadescription="Tìm kiếm diễn viên ưa thích" slug={`${page.url}`} />
<section class="w-full relative mt-4 mb-8 md:my-5 flex items-center justify-center container mx-auto">
	<div class="w-full relative flex items-center justify-center container mx-auto px-4 md:px-0">
		{#if searching}
			<div class="absolute right-6 top-4 w-5 h-5 text-slate-300">
				<LoadingSearch />
			</div>
		{/if}
		<div class="relative w-full max-w-sm flex items-center">
			<input
				bind:value={inputValue}
				type="text"
				placeholder={m.searchpage_actor_input_placeholder()}
				class="input-search border-[0.5px] border-slate-400 bg-slate-900 rounded-full py-3 px-6 text-slate-50 font-semibold focus:outline-hidden focus:border-neonPink-500 w-full"
				oninput={handleSearchInput}
			/>
			{#if inputValue}
				<button
					aria-label="Xóa tìm kiếm"
					class="absolute right-4 hover:cursor-pointer p-1 rounded-full hover:bg-white/10"
					onclick={handleSearchCloseClicked}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="icon icon-tabler icon-tabler-x w-5 h-5 text-slate-300"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						fill="none"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path stroke="none" d="M0 0h24v24H0z" fill="none" />
						<path d="M18 6l-12 12" />
						<path d="M6 6l12 12" />
					</svg>
				</button>
			{:else}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="icon icon-tabler icon-tabler-search w-5 h-5 text-slate-400 absolute right-4"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					fill="none"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path stroke="none" d="M0 0h24v24H0z" fill="none" />
					<path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
					<path d="M21 21l-6 -6" />
				</svg>
			{/if}
		</div>
	</div>
</section>
{#if actorStore.value === null || !actorStore.value.results || actorStore.value.results.length === 0}
	<section class="w-full h-fit relative my-10 container mx-auto flex items-center justify-center">
		<h2 class="text-2xl font-bold text-slate-200 mb-5 px-2 md:px-0">{m.searchpage_no_results()}</h2>
	</section>
{:else}
	<section in:fade={{ duration: 150 }} class="w-full mb-20 sm:mb-0 px-2 sm:px-0 container mx-auto relative">
		{#if searching}
			<LoadingSubBlur />
		{/if}
		<div class="grid grid-cols-1 px-2 md:px-0 md:grid-cols-4 gap-4 w-full h-full">
			{#each (actorStore.value.results || []) as cast (cast.id)}
				<CardActorList {cast} />
			{/each}
		</div>
	</section>
	<div class="flex flex-col items-center mx-auto w-full container mb-20 sm:mb-0">
		{#key actorStore.value?.page}
			<Paginations
				totalPages={(actorStore.value?.total_pages ?? 0) > 500 ? 500 : (actorStore.value?.total_pages ?? 0)}
				bind:currentPage
			/>
		{/key}
	</div>
{/if}
