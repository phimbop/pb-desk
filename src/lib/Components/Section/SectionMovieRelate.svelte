<script lang="ts">
	import { lazyLoad } from '$lib/helper/lazyload';
	import { fade } from 'svelte/transition';
	import { KkphimHandler } from '$lib/runes/kkPhimStore.svelte';
	import CardkkPhimLe from '../Card/CardkkPhimLe.svelte';
	import Paginations from '../Paginations.svelte';
	import LoadingBlur from '../LoadingBlur.svelte';
	import LoadingSubBlur from '../LoadingSubBlur.svelte';
	import CardMovieFilter from '../Card/CardMovieFilter.svelte';
	import { moviesHandler } from '$lib/runes/movieStore.svelte';
	import { tmdbTvHandler } from '$lib/runes/tmdbTv.svelte';
	import { m } from '$lib/paraglide/messages';
	let loadSection = $state(false);
	let endIndex = $state(8);
	let movieList: any = $state({ results: [], data: { items: [], params: { pagination: { totalPages: 0 } } } });
	interface Prop {
		slug: string;
		currentMovieName?: string;
		movieSource?: movieResource;
	}
	let { slug, currentMovieName, movieSource }: Prop = $props();
	const loadRelateMovies = async (slug: string, curPage: number) => {
		try {
			if (movieSource === 'tmdbTv') {
				return (await tmdbTvHandler.getTvSimilar(parseInt(slug), curPage, 'en-US')) ?? { results: [], total_pages: 0 };
			} else if (movieSource === 'tmdb') {
				return (await moviesHandler.tmdbRelatedMovies(parseInt(slug), curPage)) ?? { results: [], total_pages: 0 };
			} else return (await KkphimHandler.kkGetMovieCategory(slug, curPage)) ?? { data: { items: [], params: { pagination: { totalPages: 0 } } } }; 
		} catch (error) {
			console.error(error);
			return { results: [], data: { items: [], params: { pagination: { totalPages: 0 } } } };
		}
	};
	let currentPage = $state(1);
	let loading = $state(false);
	const handlePageChange = async (page: number) => {
		loading = true;
		movieList = await loadRelateMovies(slug, page);
		loading = false;
	};
	$effect(() => {
		if (currentPage) {
			handlePageChange(currentPage);
		}
	});
</script>

{#snippet loadTMDBSection()}
	<div class="flex items-center space-x-2 mb-5 w-full">
		<h2 class="text-2xl font-bold text-slate-200 md:px-0">{m.sectionMovieRelate_moviesSimilar()} - {currentMovieName}</h2>
		<div class="items-center space-x-2 ml-auto hidden md:flex">
			<Paginations
				totalPages={(movieList?.total_pages ?? 0) > 500 ? 500 : (movieList?.total_pages ?? 0)}
				bind:currentPage
			/>
		</div>
	</div>

	<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-10 gap-4 px-2 md:px-0 w-full h-full">
		{#if loading}
			<LoadingSubBlur />
		{/if}
		{#each (movieList?.results || []) as movie, i (movie.id)}
			<CardMovieFilter {movie} showDate={false} class="" source={movieSource} />
		{/each}
	</div>
{/snippet}
{#snippet loadOtherSection()}
	<div class="flex items-center space-x-2 mb-5 w-full">
		<h2 class="text-2xl font-bold text-slate-200 md:px-0">{m.sectionMovieRelate_moviesSimilar()} - {currentMovieName}</h2>
		<div class="items-center space-x-2 ml-auto hidden md:flex">
			<Paginations
				totalPages={movieList?.data?.params?.pagination?.totalPages ?? Math.ceil((movieList?.data?.params?.pagination?.totalItems ?? 0) / (movieList?.data?.params?.pagination?.totalItemsPerPage ?? 20))}
				bind:currentPage
			/>
		</div>
	</div>

	<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-10 gap-4 px-2 md:px-0 w-full h-full">
		{#if loading}
			<LoadingSubBlur />
		{/if}
		{#each (movieList?.data?.items || []) as movie, i (movie._id)}
			<CardkkPhimLe class="" showDate={false} {movie} />
		{/each}
	</div>
{/snippet}
<section
	transition:fade
	class="w-full h-fit relative my-10 mx-auto"
	use:lazyLoad={async () => {
		movieList = await loadRelateMovies(slug, 1);
		if (!loadSection) loadSection = true;
	}}
>
	{#if movieSource !== 'tmdb' && movieSource !== 'tmdbTv' && loadSection && (movieList?.data?.items?.length ?? 0) > 0 }
		{@render loadOtherSection()}
	{:else if loadSection && (movieList?.results?.length ?? 0) > 0 }
		{@render loadTMDBSection()}
	{/if}
</section>
