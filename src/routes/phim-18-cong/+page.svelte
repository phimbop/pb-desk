<script lang="ts">
	import Paginations from '$lib/Components/Paginations.svelte';
	import CardMyMoviesList from '$lib/Components/Card/CardMyMoviesList.svelte';
	import LoadingSubBlur from '$lib/Components/LoadingSubBlur.svelte';
	import TabSwitch from '$lib/Components/TabSwitch.svelte';
	import IconEyes from '$lib/Components/Icon/IconEyes.svelte';
	import IconFlash from '$lib/Components/Icon/IconFlash.svelte';
	import { m } from '$lib/paraglide/messages';
	import { api } from '$lib/ipc';
	import type { AdultMovieRecord } from '$lib/types';
	import { useLocalStorage } from '$lib/runes/createStore.svelte';
	import { sortPlayedList, sortPlayedListByViews } from '$lib/helper/sortListPlayedMovie';
	import { onMount } from 'svelte';

	// Tab Switch
	let activeTab = $state(0);
	interface ItemTabList {
		label: string;
		value: number;
		icon: any;
	}
	let items: ItemTabList[] = [
		{
			label: m.phim18cong_items_label_newest(),
			value: 0,
			icon: IconFlash
		},
		{
			label: m.phim18cong_items_label_mostwatched(),
			value: 1,
			icon: IconEyes
		}
	];

	let rawMovieData = $state<AdultMovieRecord[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	const loadData = async () => {
		loading = true;
		error = null;
		try {
			const res = await api.getAdultMovies();
			rawMovieData = res || [];
		} catch (err: any) {
			console.error('Failed to load adult movies from SurrealDB:', err);
			error = err?.message || 'Không thể tải danh sách phim 18+.';
		} finally {
			loading = false;
		}
	};

	onMount(() => {
		loadData();
	});

	let movie18 = $derived(sortPlayedList(rawMovieData)); // sort by updatedAt
	let sortByViews = $derived(activeTab === 1);
	const currentPageMovie18 = useLocalStorage<number>('currentPageMovie18', 1);
	let currentPage = $state(currentPageMovie18.value);
	const itemsPerPage = 20;

	$effect(() => {
		if (currentPage) {
			currentPageMovie18.value = currentPage;
			if (typeof window !== 'undefined') {
				window.scrollTo({ top: 0, behavior: 'smooth' });
			}
		}
	});

	let filteredData = $derived(
		sortByViews ? sortPlayedListByViews(rawMovieData) : sortPlayedList(rawMovieData)
	);

	// Tính toán phân trang
	const totalPages = $derived(Math.max(1, Math.ceil(filteredData.length / itemsPerPage)));
	const currentMovieList = $derived.by(() => {
		const startIndex = (currentPage - 1) * itemsPerPage;
		const endIndex = startIndex + itemsPerPage;
		return filteredData.slice(startIndex, endIndex);
	});
</script>

{#if loading && rawMovieData.length === 0}
	<div class="w-full min-h-[50vh] relative flex items-center justify-center">
		<LoadingSubBlur />
	</div>
{:else if error && rawMovieData.length === 0}
	<div class="w-full py-16 flex flex-col items-center justify-center space-y-4 text-center">
		<p class="text-rose-400 font-bold">{error}</p>
		<button
			onclick={() => loadData()}
			class="px-5 py-2 rounded-xl bg-neonPink-500 hover:bg-neonPink-600 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
		>
			Thử lại
		</button>
	</div>
{:else if movie18.length > 0}
	<section class="w-full sm:mt-20 mb-20 sm:mb-0 px-2 sm:px-0 relative">
		{#if loading}
			<LoadingSubBlur />
		{/if}
		<div class="flex items-center justify-center mb-10">
			<TabSwitch {items} bind:activeTab />
		</div>
		<div class="flex mx-auto">
			<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-10 gap-2 w-full h-full">
				{#each currentMovieList as movies, i (movies.movie?._id || movies.movie?.id || movies.id || i)}
					<CardMyMoviesList showDate={false} class="" showWatchedTime={false} movie={movies.movie || movies} />
				{/each}
			</div>
		</div>
		<div class="flex flex-col items-center mx-auto w-full container">
			<Paginations {totalPages} bind:currentPage />
		</div>
	</section>
{:else}
	<p class="text-center text-slate-200 py-16">{m.searchpage_no_results()}</p>
{/if}
