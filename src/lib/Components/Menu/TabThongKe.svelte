<script lang="ts">
	import CardMovieFilter from '../Card/CardMovieFilter.svelte';
	import MenuTopMovies from '../Card/TopMovie/MenuTopMovies.svelte';
	import tooltip from '$lib/helper/tooltip';
	import IconRefresh from '../Icon/IconRefresh.svelte';
	import { moviesHandler } from '$lib/runes/movieStore.svelte';
	import LoadingSubBlur from '../LoadingSubBlur.svelte';
	import CommonHelper from '$lib/helper/commentHelper';
	import { KkphimHandler } from '$lib/runes/kkPhimStore.svelte';
	import CardkkPhimLe from '../Card/CardkkPhimLe.svelte';
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages';
	let loadingSuggestMovies = $state(false);
	let tmdbTopRatedMoviesStore = $state({ value: page.data.topRatedMovies });
	let KKSuggestVnMoviesStore = $state({ value: page.data.vnMovies });
	let KKSuggestKrMoviesStore = $state({ value: page.data.koreaMovies });
	let KKSuggestCnMoviesStore = $state({ value: page.data.chinaMovies });
	const refreshRandomTopRatedMovies = async () => {
		loadingSuggestMovies = true;
		const randomPage: number = Math.floor(Math.random() * 400) + 1;
		const vnPages: number =
			Math.floor(Math.random() * (page.data.vnMovies?.data?.params?.pagination?.totalPages ?? 1)) + 1;
		const krPages: number =
			Math.floor(Math.random() * (page.data.koreaMovies?.data?.params?.pagination?.totalPages ?? 1)) + 1;
		const cnPages: number =
			Math.floor(Math.random() * (page.data.chinaMovies?.data?.params?.pagination?.totalPages ?? 1)) + 1;
		try {
			// const refreshRandomTopRatedMovies = await moviesHandler.tmdbGetTopRateMovies(randomPage);
			let [refreshRandomTopRatedMovies, vietnam, korea, china] = await Promise.all([
				moviesHandler.tmdbGetTopRateMovies(randomPage),
				KkphimHandler.kkGetPhimQuocGia(vnPages, 'viet-nam'),
				KkphimHandler.kkGetPhimQuocGia(krPages, 'han-quoc'),
				KkphimHandler.kkGetPhimQuocGia(cnPages, 'trung-quoc')
			]);
			tmdbTopRatedMoviesStore.value = refreshRandomTopRatedMovies;
			KKSuggestVnMoviesStore.value = vietnam;
			KKSuggestKrMoviesStore.value = korea;
			KKSuggestCnMoviesStore.value = china;
			loadingSuggestMovies = false;
		} catch (error) {
			throw error;
		}
	};
	const debouncedRefresh = CommonHelper.debounce(async () => {
		await refreshRandomTopRatedMovies();
	}, 300);
</script>
<section class="w-full h-full">
	<div class="container mx-auto grid grid-cols-2 md:grid-cols-12 md:gap-4">
		<div class="col-span-9 md:col-span-7 lg:col-span-9">
			<section class="w-full h-fit relative mb-10 mt-5 container mx-auto">
				<div class="flex items-center gap-2 mb-5">
					<h1 class="text-2xl px-2 md:px-0 font-bold text-slate-200">
						{m.tabthongke_suggested_by()} PHIM<span class="text-neonPink-500">BOP</span>
					</h1>
					<button
						class="hover:cursor-pointer"
						aria-label="{m.tabthongke_other_suggestions()}"
						use:tooltip={{ text: m.tabthongke_other_suggestions(), position: 'top' }}
						onclick={(e) => {
							e.preventDefault();
							debouncedRefresh();
						}}
					>
						<IconRefresh
							class="w-10 h-10 text-slate-200 p-2 outline-non rounded-full hover:bg-white/15 active:rotate-180 active:bg-transparent transition-all duration-200"
						/>
					</button>
				</div>
				{#if loadingSuggestMovies}
					<LoadingSubBlur />
				{/if}
				<div
					class="grid grid-cols-2 px-2 md:px-0 md:grid-cols-3 lg:grid-cols-6 gap-4 w-full h-full"
				>
					{#if KKSuggestVnMoviesStore.value?.data?.items && KKSuggestVnMoviesStore.value.data.items.length > 0}
						{#each KKSuggestVnMoviesStore.value.data.items.slice(0, 3) as movie (movie._id)}
							<CardkkPhimLe {movie} showDate={true} class="" />
						{/each}
					{/if}
					{#each (tmdbTopRatedMoviesStore.value?.results || []).slice(0, 3) as movie (movie.id)}
						<CardMovieFilter {movie} showDate={false} class="" />
					{/each}
					{#if KKSuggestKrMoviesStore.value?.data?.items && KKSuggestKrMoviesStore.value.data.items.length > 0}
						{#each KKSuggestKrMoviesStore.value.data.items.slice(0, 3) as movie (movie._id)}
							<CardkkPhimLe {movie} showDate={true} class="" />
						{/each}
					{/if}
					{#if KKSuggestCnMoviesStore.value?.data?.items && KKSuggestCnMoviesStore.value.data.items.length > 0}
						{#each KKSuggestCnMoviesStore.value.data.items.slice(0, 3) as movie (movie._id)}
							<CardkkPhimLe {movie} showDate={true} class="" />
						{/each}
					{/if}
				</div>
			</section>
		</div>
		<div class="col-span-3 md:col-span-5 lg:col-span-3">
			<MenuTopMovies />
		</div>
	</div>
</section>
