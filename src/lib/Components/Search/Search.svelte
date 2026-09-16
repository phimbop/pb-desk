<script lang="ts">
	import { moviesHandler, tmdbFilterMoviesStore } from '$lib/runes/movieStore.svelte';
	import { clickOutside } from '$lib/helper/clickOutSide';
	import tooltip from '$lib/helper/tooltip';
	import { slide } from 'svelte/transition';
	import CommonHelper from '$lib/helper/commentHelper';
	import LoadingImage from '../Image/LoadingImage.svelte';
	import { KkphimHandler } from '../../runes/kkPhimStore.svelte';
	import { getKKImageUrl, DOMAIN_TMDB_IMAGE_CDN } from '$lib';
	import LoadingSearch from '$lib/Components/loadingSearch.svelte';
	import { page } from '$app/state';
	import { debounce } from '$lib/helper/debounce';
	import { m } from '$lib/paraglide/messages';

	let isOpen = $state(false);
	let searching = $state(false);
	let searchInputStore = $derived(tmdbFilterMoviesStore.value.movieTitle ?? '');
	let searchKeyword: string = $state('');
	let searchResult: TmdbMovieSearchResult | null = $state(null);
	let kkMovieResult: kkPhimboType | null = $state(null);
	// $inspect('searchResult', searchResult);
	// $inspect('kkMovieResult', kkMovieResult);
	// $inspect('isOpen:', isOpen);
	const handleSearch = async () => {
		if (searchKeyword.length > 3) {
			searching = true;
			try {
				console.log('search Component running!');
				[searchResult, kkMovieResult] = await Promise.all([
					moviesHandler.tmdbSearchMovies(searchKeyword),
					KkphimHandler.kkSearchMovies(searchKeyword)
				]);
			} catch (error) {
				throw error;
			}
			searching = false;
			isOpen = true;
			console.log('searchResult length', searchResult?.results.length);
		} else {
			searchResult = null;
		}
	};
	const toggleSearchResult = () => {
		isOpen = !isOpen;
	};
	const onSearchTextInput = () => {
		tmdbFilterMoviesStore.value = {
			...tmdbFilterMoviesStore.value,
			movieTitle: searchKeyword
		};
	};
	const handleCloseSearchTextInput = () => {
		tmdbFilterMoviesStore.value = {
			...tmdbFilterMoviesStore.value,
			movieTitle: ''
		};
		searchKeyword = '';
	};
	$effect(() => {
		if (searchInputStore) {
			searchKeyword = searchInputStore;
		} else {
			searchKeyword = '';
		}
	});
	// onMount(async() => {
	// 	if (browser) {
	// 		await tmdbFilterMoviesStore.load();
	// 	}
	// })
</script>

<div
	class="relative w-full z-50"
	data-tg-tour="Nên tìm phim ở đây vì sẽ được truy vấn từ nhiều nguồn server 📽"
	data-tg-order="0"
>
	<div class="absolute top-0 flex w-full justify-center">
		<div
			class="h-[1px] animate-border-width rounded-full bg-linear-to-r from-[rgba(17,17,17,0)] via-[rgba(120,119,198,1)] to-[rgba(17,17,17,0)] transition-all duration-1000"
		></div>
	</div>
	<input
		class="block h-12 w-full rounded-full border border-slate-700 bg-transparent px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-slate-700 text-slate-300 text-center"
		placeholder={m.search_placeholder()}
		type="text"
		id="search"
		name="search"
		bind:value={searchKeyword}
		oninput={debounce(() => {
			onSearchTextInput();
			handleSearch();
		}, 150)}
		onchange={(e) => {
			e.stopPropagation();
		}}
	/>
	<div class="absolute top-1/2 -translate-y-1/2 right-4">
		{#if searchKeyword && !searching}
			<button
				onclick={(e) => {
					e.preventDefault();
					handleCloseSearchTextInput();
				}}
				aria-label="Close search"
				class="group align-middle duration-150 transition-all hover:bg-slate-700/80 p-1 rounded-full"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="icon icon-tabler icon-tabler-x w-6 h-6 text-slate-500 cursor-pointer transition-all duration-200 group-hover:text-neonPink-500"
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
		{:else if searchKeyword && searching}
			<LoadingSearch />
		{:else}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="icon icon-tabler icon-tabler-search text-slate-500 transition-all duration-200"
				width="24"
				height="24"
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
	<div class="absolute top-6 -translate-y-1/2 left-4">
		<a
			href="/tim-kiem/phim"
			class="inline-flex h-full animate-background-shine cursor-pointer items-center justify-center rounded-full bg-slate-700/80 px-3 py-1 text-sm font-medium text-slate-300"
			use:tooltip={{ text: m.search_icon_tp(), position: 'bottom' }}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="icon icon-tabler icon-tabler-filter-search text-slate-300 w-4 h-4 mr-1"
				viewBox="0 0 24 24"
				stroke-width="2"
				stroke="currentColor"
				fill="none"
				stroke-linecap="round"
				stroke-linejoin="round"
				><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
					d="M11.36 20.213l-2.36 .787v-8.5l-4.48 -4.928a2 2 0 0 1 -.52 -1.345v-2.227h16v2.172a2 2 0 0 1 -.586 1.414l-4.414 4.414"
				/><path d="M18 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M20.2 20.2l1.8 1.8" /></svg
			>
			{m.search_icon_title()}
		</a>
	</div>
	{#if isOpen && ((searchResult && (searchResult?.results?.length ?? 0) > 0) || (kkMovieResult && (kkMovieResult?.data?.items?.length ?? 0) > 0))}
		<div
			class=" absolute top-6 z-50 w-full max-w-3xl mt-10 h-fit rounded-3xl devide-y overflow-hidden transition-all duration-200"
			use:clickOutside={() => {
				isOpen = false;
			}}
		>
			<ul
				transition:slide={{ duration: 200 }}
				role="list"
				class="overflow-y-auto scrollbar w-full max-h-96 relative bg-neutral-700/90"
				onwheel={(e) => e.stopPropagation()}
			>
				{#if (kkMovieResult?.data?.items?.length ?? 0) > 0}
					{#each kkMovieResult!.data!.items as movie}
						<a
							href="/{movie.type === 'single' ? 'phim-le' : 'phim-bo'}/{movie.slug}"
							onblur={toggleSearchResult}
						>
							<li
								class="group/item relative flex items-center justify-between p-4 hover:bg-neutral-800 transition duration-200"
							>
								<div class="flex gap-4">
									<div class="shrink-0">
										{#if movie.poster_url}
											<img
												class="h-14 w-14 rounded-xl"
												src={getKKImageUrl(movie.poster_url)}
												alt={movie.name}
											/>
										{:else}
											<LoadingImage />
										{/if}
									</div>
									<div class="w-full text-sm leading-6">
										<div
											class="primary-text text-lg group-hover/item:!text-neonPink-500 text-ellipsis transition duration-200"
										>
											{movie.name}
										</div>
										<div class="text-slate-200 flex items-center space-x-1">
											<p>{movie.year}</p>
											<p>•</p>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="icon icon-tabler icon-tabler-star-filled w-3 h-3"
												viewBox="0 0 24 24"
												stroke-width="2"
												stroke="currentColor"
												fill="none"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<path stroke="none" d="M0 0h24v24H0z" fill="none" />
												<path
													d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z"
													stroke-width="0"
													fill="currentColor"
												/>
											</svg>
											<p>{parseFloat((Math.random() * (10 - 5.6) + 5.6).toFixed(1))}</p>
										</div>
									</div>
								</div>
								<div
									class="group/edit invisible relative flex items-center whitespace-nowrap rounded-full py-1 pl-4 pr-3 text-sm text-slate-200 transition duration-200 hover:bg-neonPink-500 group-hover/item:visible"
								>
									<span class="font-semibold transition duration-200 group-hover/edit:primary-text"
										>{(Math.floor(Math.random() * (1200000 - 26 + 1)) + 26).toLocaleString()} lượt chọn</span
									>
									<svg
										class="mt-px h-5 w-5 text-slate-400 transition duration-200 group-hover/edit:translate-x-0.5 group-hover/edit:text-slate-200"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fill-rule="evenodd"
											d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
											clip-rule="evenodd"
										/>
									</svg>
								</div>
							</li>
						</a>
					{/each}
				{/if}

				{#each (searchResult?.results || []) as movie (movie.id)}
					<a
						href="/phim/{CommonHelper.stringToSlug(movie.title)}/{movie.id}"
						onblur={toggleSearchResult}
					>
						<li
							class="group/item relative flex items-center justify-between p-4 hover:bg-neutral-800 transition duration-200"
						>
							<div class="flex gap-4">
								<div class="shrink-0">
									{#if movie.poster_path}
										<img
											class="h-14 w-14 rounded-xl"
											src="{DOMAIN_TMDB_IMAGE_CDN}/t/p/w300/{movie.poster_path}"
											alt={movie.title}
										/>
									{:else}
										<LoadingImage />
									{/if}
								</div>
								<div class="w-full text-sm leading-6">
									<div
										class="primary-text text-lg group-hover/item:!text-neonPink-500 text-ellipsis transition duration-200"
									>
										{movie.title}
									</div>
									<div class="text-slate-200 flex items-center space-x-1">
										<p>{movie.release_date?.slice(0, 4) ?? ''}</p>
										<p>•</p>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="icon icon-tabler icon-tabler-star-filled w-3 h-3"
											viewBox="0 0 24 24"
											stroke-width="2"
											stroke="currentColor"
											fill="none"
											stroke-linecap="round"
											stroke-linejoin="round"
										>
											<path stroke="none" d="M0 0h24v24H0z" fill="none" />
											<path
												d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z"
												stroke-width="0"
												fill="currentColor"
											/>
										</svg>
										<p>{movie.vote_average ? movie.vote_average.toFixed(1) : ''}</p>
									</div>
								</div>
							</div>
							<div
								class="group/edit invisible relative flex items-center whitespace-nowrap rounded-full py-1 pl-4 pr-3 text-sm text-slate-200 transition duration-200 hover:bg-neonPink-500 group-hover/item:visible"
							>
								<span class="font-semibold transition duration-200 group-hover/edit:primary-text"
									>{movie.vote_count} lượt chọn</span
								>
								<svg
									class="mt-px h-5 w-5 text-slate-400 transition duration-200 group-hover/edit:translate-x-0.5 group-hover/edit:text-slate-200"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
										clip-rule="evenodd"
									/>
								</svg>
							</div>
						</li>
					</a>
				{/each}
				<li
					class="sticky bottom-0 flex items-center justify-between p-4 bg-neutral-800 transition duration-150 z-10"
				>
					<a
						href="/tim-kiem/phim"
						class="w-full p-3 flex justify-center items-center text-lg primary-text hover:!text-neonPink-500 transition duration-150"
						>{m.reuse_show_more()}</a
					>
				</li>
			</ul>
		</div>
	{/if}
</div>
