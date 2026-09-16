<script lang="ts">
	import CardMovieFilter from '$lib/Components/Card/CardMovieFilter.svelte';
	import Paginations from '$lib/Components/Paginations.svelte';
	import { fade } from 'svelte/transition';
	import {
		moviesHandler,
		tmdbFilteredMoviesListStore,
		tmdbFilterMoviesStore
	} from '$lib/runes/movieStore.svelte';
	import Filter from '$lib/Components/Filter/Filter.svelte';
	import Seo from '$lib/Components/SEO/Seo.svelte';
	import { KkphimHandler } from '$lib/runes/kkPhimStore.svelte';
	import CardkkPhimLe from '$lib/Components/Card/CardkkPhimLe.svelte';
	import LoadingSubBlur from '$lib/Components/LoadingSubBlur.svelte';
	import { page } from '$app/state';
	import IconArrowDown from '$lib/Components/Icon/IconArrowDown.svelte';
	import IconArrowUp from '$lib/Components/Icon/IconArrowUp.svelte';
	import { onMount } from 'svelte';
	import type { TmdbSearchResult, TvSeriesDetail, TmdbMovies } from '../../../types/Tmdb';
	import { websiteUrl } from '$lib';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';

	let movies: TmdbMovies = $derived(tmdbFilteredMoviesListStore.value ?? page.data?.tmdbPopular ?? { results: [], total_pages: 0 });
	let currentPage = $state(tmdbFilteredMoviesListStore.value?.page ?? 1);
	let loading = $state(false);
	let mounted = $state(false);
	let kkMovieResult: kkPhimboType | null = $state(null);
	let tmdbMovieSearchResult: TmdbMovies | null = $state(null);
	let tmdbTvSearchResult: TmdbSearchResult<TvSeriesDetail> | null = $state(null);
	let scrolled = $state(false);
	let scrollY = $state(0);
	let divRef: HTMLElement | undefined = $state();
	let showFilterOnMobile = $state(true);

	function checkSticky() {
		if (divRef) {
			const rect = divRef.getBoundingClientRect();
			scrolled = rect.top <= 0;
		}
	}

	const ISO_TO_KK_COUNTRY: Record<string, string[]> = {
		VN: ['viet-nam'],
		US: ['au-my'],
		KR: ['han-quoc'],
		CN: ['trung-quoc'],
		HK: ['hong-kong'],
		TW: ['dai-loan'],
		JP: ['nhat-ban'],
		TH: ['thai-lan'],
		IN: ['an-do'],
		GB: ['anh'],
		FR: ['phap'],
		CA: ['canada'],
		DE: ['duc'],
		ES: ['tay-ban-nha'],
		RU: ['nga'],
		AU: ['uc'],
		IT: ['y'],
		NL: ['ha-lan'],
		ID: ['indonesia'],
		PH: ['philippines'],
		BR: ['brazil'],
		MX: ['mexico'],
		PL: ['ba-lan'],
		DK: ['dan-mach'],
		SE: ['thuy-dien'],
		CH: ['thuy-si'],
		TR: ['tho-nhi-ky'],
		UA: ['ukraina'],
		MY: ['malaysia'],
		AE: ['uae'],
		SA: ['a-rap-xe-ut'],
		PT: ['bo-dao-nha'],
		NO: ['na-uy'],
		ZA: ['nam-phi']
	};

	const TMDB_GENRE_TO_KK: Record<number, string[]> = {
		28: ['hanh-dong', 'vo-thuat'],
		12: ['phieu-luu'],
		16: ['hoat-hinh'],
		35: ['hai-huoc'],
		80: ['hinh-su'],
		99: ['tai-lieu'],
		18: ['chinh-kich', 'tam-ly'],
		10751: ['gia-dinh', 'tre-em'],
		14: ['than-thoai', 'co-trang'],
		36: ['lich-su', 'co-trang'],
		27: ['kinh-di'],
		10402: ['am-nhac'],
		9648: ['bi-an'],
		10749: ['tinh-cam'],
		878: ['khoa-hoc', 'vien-tuong'],
		10770: ['phim-ngan'],
		53: ['tam-ly', 'hinh-su'],
		10752: ['chien-tranh'],
		37: ['mien-tay']
	};

	let filteredKkItems = $derived.by(() => {
		if (!kkMovieResult?.data?.items?.length) return [];
		const items = kkMovieResult.data.items;
		const countries = tmdbFilterMoviesStore.value?.country ?? [];
		const years = tmdbFilterMoviesStore.value?.year ?? [];
		const genres = tmdbFilterMoviesStore.value?.movieGenres ?? [];

		if (countries.length === 0 && years.length === 0 && genres.length === 0) {
			return items;
		}

		return items.filter((item: any) => {
			if (countries.length > 0) {
				const itemCountries: string[] = (item.country || []).map((c: any) => (c.slug || c.name || '').toLowerCase());
				const matchCountry = countries.some((code) => {
					const targetSlugs = ISO_TO_KK_COUNTRY[code] || [code.toLowerCase()];
					return itemCountries.some((ic) => targetSlugs.some((ts) => ic.includes(ts)));
				});
				if (!matchCountry) return false;
			}

			if (years.length > 0) {
				const itemYear = item.year?.toString();
				if (itemYear && !years.includes(itemYear)) {
					return false;
				}
			}

			if (genres.length > 0) {
				const itemCategories: string[] = (item.category || []).map((c: any) => (c.slug || c.name || '').toLowerCase());
				const matchGenre = genres.some((genreId) => {
					const targetSlugs = TMDB_GENRE_TO_KK[genreId] || [];
					return itemCategories.some((ic) => targetSlugs.some((ts) => ic.includes(ts)));
				});
				if (!matchGenre) return false;
			}

			return true;
		});
	});

	let totalPages = $derived.by(() => {
		if (filteredKkItems.length > 0) {
			let pageTmdb: number = tmdbFilteredMoviesListStore.value?.total_pages ?? 1;
			let pageKKMovieResult: number = kkMovieResult!.data?.params?.pagination?.totalPages ?? 1;
			return Math.max(pageTmdb, pageKKMovieResult);
		} else {
			return tmdbFilteredMoviesListStore.value?.total_pages ?? movies?.total_pages ?? 1;
		}
	});

	const handlers = {
		btnFilterClicked: async () => {
			loading = true;
			await handlePageChange(1);
			currentPage = 1;
			loading = false;
		}
	};

	const handlePageChange = async (pageNumber: number) => {
		loading = true;
		try {
			[tmdbMovieSearchResult, tmdbTvSearchResult, kkMovieResult] = await Promise.all([
				moviesHandler.tmdbFilterMovies(pageNumber, 'movie', getLocale()),
				moviesHandler.tmdbFilterMovies(pageNumber, 'tv', getLocale()),
				KkphimHandler.kkSearchMovies(tmdbFilterMoviesStore.value?.movieTitle ?? '', pageNumber)
			]);
			tmdbFilteredMoviesListStore.value = tmdbMovieSearchResult;
		} catch (err) {
			console.error('Failed to filter movies:', err);
		} finally {
			loading = false;
		}
	};

	$effect(() => {
		if (mounted && currentPage !== tmdbFilteredMoviesListStore.value?.page) {
			handlePageChange(currentPage);
		}
	});

	$effect(() => {
		if (!divRef) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				scrolled = entry.boundingClientRect.top <= 1;
			},
			{ threshold: 1.0 }
		);

		observer.observe(divRef);
		return () => observer.disconnect();
	});

	onMount(async () => {
		await Promise.all([tmdbFilterMoviesStore.load(), tmdbFilteredMoviesListStore.load()]);
		const urlQuery = page.url.searchParams.get('q');
		if (urlQuery && (!tmdbFilterMoviesStore.value?.movieTitle || tmdbFilterMoviesStore.value.movieTitle !== urlQuery)) {
			tmdbFilterMoviesStore.value = {
				...tmdbFilterMoviesStore.value,
				movieTitle: urlQuery
			};
		}
		if (tmdbFilterMoviesStore.state === 'ready' && tmdbFilterMoviesStore.value?.movieTitle) {
			await handlePageChange(1);
		} else if (!tmdbFilteredMoviesListStore.value || !tmdbFilteredMoviesListStore.value.results?.length) {
			const res = await moviesHandler.tmdbGetMovies('popular', 1, getLocale());
			if (res) tmdbFilteredMoviesListStore.value = res;
		}
		mounted = true;
	});

	function isKkMovie(res: any): res is kkPhimboType {
		return res !== null && typeof res === 'object' && 'data' in res;
	}
	function isTmdbTv(res: any): res is TmdbSearchResult<TvSeriesDetail> {
		return res !== null && typeof res === 'object' && 'results' in res;
	}
</script>

{#snippet movieResult(
	result: kkPhimboType | TmdbSearchResult<TvSeriesDetail> | null,
	source?: string
)}
	{#if isKkMovie(result) && filteredKkItems.length > 0}
		{#each filteredKkItems as movie}
			<CardkkPhimLe movie={movie as any} showDate={true} class="" />
		{/each}
	{/if}
	{#if isTmdbTv(result) && result?.results && result.results.length > 0 && source === 'tmdbTv'}
		{#each result.results || [] as movie}
			<CardMovieFilter {movie} source="tmdbTv" class="" />
		{/each}
	{/if}
{/snippet}

<Seo
	title={m.searchpage_seo_title()}
	metadescription={m.searchpage_seo_metadescription()}
	slug="{websiteUrl}/tim-kiem/phim"
	keywordsPlus={m.searchpage_seo_keywords()}
/>
<svelte:head>
	<style>
		html,
		body {
			overflow-x: clip !important;
		}
	</style>
</svelte:head>
<svelte:window bind:scrollY />
<section in:fade={{ duration: 200 }} class="w-full mt-4 md:mt-20 px-0 relative">
	<div
		bind:this={divRef}
		class="relative w-full lg:w-full container mx-auto mb-8 md:mb-5 flex flex-col sm:flex-row flex-wrap xl:flex-nowrap justify-center gap-2 items-center z-40 transition-all duration-150 {scrolled
			? 'sticky top-0 py-4 px-4 bg-slate-800/20 backdrop-blur-3xl rounded-b-4xl'
			: ''}"
	>
		{#if showFilterOnMobile && scrollY > 80}
			<button
				class="sm:hidden flex absolute top-2 right-2.5 w-fit h-fit rounded-full justify-center items-center active:bg-white/20 p-2 z-[100] text-slate-200"
				onclick={() => (showFilterOnMobile = false)}><IconArrowUp class="w-6 h-6" /></button
			>
		{:else if !showFilterOnMobile && scrollY > 80}
			<button
				class="sm:hidden flex absolute ml-auto top-2 right-2.5 w-fit h-fit rounded-full justify-center items-center active:bg-white/20 p-2 z-50 text-slate-200"
				onclick={() => (showFilterOnMobile = true)}><IconArrowDown class="w-6 h-6" /></button
			>
		{/if}
		{#if movies}
			<div class="flex flex-col items-center w-fit container -mt-5 min-h-12">
				{#key tmdbFilteredMoviesListStore.value?.page}
					<Paginations totalPages={totalPages! > 500 ? 500 : totalPages} bind:currentPage />
				{/key}
			</div>
		{/if}

		<div class={showFilterOnMobile ? 'w-fit' : 'hidden sm:flex'}>
			<Filter {handlers} />
		</div>
	</div>
	{#if mounted && !loading && (tmdbMovieSearchResult || kkMovieResult) && (tmdbFilteredMoviesListStore.value?.results?.length ?? 0) === 0 && filteredKkItems.length === 0 && (tmdbTvSearchResult?.results?.length ?? 0) === 0}
		<div class="flex flex-col items-center justify-center mx-auto w-full h-full container mt-20">
			<p class="text-slate-200">{m.searchpage_no_results()}</p>
		</div>
	{/if}
	<div
		class="grid grid-cols-2 px-2 md:px-0 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-10 gap-4 w-full h-fit relative"
	>
		{#if loading}
			<LoadingSubBlur />
		{/if}
		{@render movieResult(kkMovieResult, 'kk')}
		{#if movies && movies?.results && movies.results.length > 0}
			{#key movies}
				{#each movies.results as movie (movie.id)}
					<CardMovieFilter {movie} showDate={false} class="" />
				{/each}
			{/key}
		{/if}
		{@render movieResult(tmdbTvSearchResult, 'tmdbTv')}
	</div>
</section>
