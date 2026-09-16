<script lang="ts">
	import Paginations from '$lib/Components/Paginations.svelte';
	import CardkkPhimLe from '$lib/Components/Card/CardkkPhimLe.svelte';
	import LoadingSubBlur from '$lib/Components/LoadingSubBlur.svelte';
	import { useLocalStorage } from '$lib/runes/createStore.svelte';
	import { api } from '$lib/ipc';
	import type { Movie, PaginatedResponse } from '$lib/types';
	import { untrack } from 'svelte';

	let currentPageStore = useLocalStorage<number | undefined>('currentPageLe', 1);
	let currentPage = $state(currentPageStore.value ?? 1);
	let moviesData = $state<PaginatedResponse<Movie> | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);

	const loadMovies = async (page: number) => {
		loading = true;
		error = null;
		try {
			const res = await api.getMoviesByType('phim-le', page, 20);
			moviesData = res;
			currentPageStore.value = page;
			window.scrollTo({ top: 0, behavior: 'smooth' });
		} catch (err: any) {
			console.error('Failed to load single movies:', err);
			error = err?.message || 'Không thể tải danh sách phim lẻ.';
		} finally {
			loading = false;
		}
	};

	$effect(() => {
		const p = currentPage;
		untrack(() => {
			loadMovies(p);
		});
	});

	let totalPages = $derived(moviesData?.total_pages || 1);
</script>

{#if loading && !moviesData}
	<div class="w-full min-h-[50vh] relative flex items-center justify-center">
		<LoadingSubBlur />
	</div>
{:else if error && !moviesData}
	<div class="w-full py-16 flex flex-col items-center justify-center space-y-4 text-center">
		<p class="text-rose-400 font-bold">{error}</p>
		<button
			onclick={() => loadMovies(currentPage)}
			class="px-5 py-2 rounded-xl bg-neonPink-500 hover:bg-neonPink-600 text-white font-bold text-xs shadow-lg transition-all"
		>
			Thử lại
		</button>
	</div>
{:else if moviesData && moviesData.items.length > 0}
	<section class="w-full mb-20 sm:mb-0 px-2 sm:px-0 sm:mt-20 relative">
		{#if loading}
			<LoadingSubBlur />
		{/if}
		<div class="flex mx-auto">
			<div class="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-2 w-full h-full">
				{#each moviesData.items as movie (movie.id || movie.slug)}
					<CardkkPhimLe {movie} type="phim-le" showDate={true} class="" />
				{/each}
			</div>
		</div>
		<div class="flex flex-col items-center mx-auto w-full container mb-20 sm:mb-0">
			<Paginations {totalPages} bind:currentPage />
		</div>
	</section>
{/if}
