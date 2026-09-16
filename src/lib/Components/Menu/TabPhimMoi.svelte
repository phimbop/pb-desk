<script lang="ts">
	import CardMovieFilter from '../Card/CardMovieFilter.svelte';
	import { moviesHandler } from '../../runes/movieStore.svelte';
	import Paginations from '../Paginations.svelte';
	import LoadingSubBlur from '../LoadingSubBlur.svelte';
	import { page } from '$app/state';
	import CommonHelper from '$lib/helper/commentHelper';
	import Seo from '$lib/Components/SEO/Seo.svelte';
	let movies = $state(page.data.tmdbPopular ?? { results: [], total_pages: 0 });
	import { useLocalStorage } from '$lib/runes/createStore.svelte';
	import { DOMAIN_TMDB_IMAGE_CDN, websiteUrl } from '$lib';
	import { getLocale } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages';
	import { onMount } from 'svelte';
	let tmdbPopularPageStore = useLocalStorage<number>('tmdbPopularPage', 1);
	let currentPage = $state(tmdbPopularPageStore.value);
	let loading = $state(false);
	let mounted = $state(false);
	onMount(() => {
		mounted = true;
	});
	const handlePageChange = async (page: number) => {
		loading = true;
		const movieList: TmdbMovies = await moviesHandler.tmdbGetMovies('upcoming', page, getLocale());
		movies = movieList ?? { results: [], total_pages: 0 };
		tmdbPopularPageStore.value = page;
		loading = false;
	};
	$effect(() => {
		if (mounted && currentPage) {
			const loadedPage = movies?.page ?? 0;
			if (currentPage !== loadedPage || !movies?.results?.length) {
				handlePageChange(currentPage);
			}
		}
	});
</script>

<section class="w-full">
	<div class=" flex mx-auto">
		<div class="grid md:grid-cols-5 lg:grid-cols-10 gap-2 w-full h-full relative">
			{#if loading}
				<LoadingSubBlur />
			{/if}
			{#key movies}
				<Seo
					title="{m.reuse_newMovies()}, {m.reuse_newComing()}"
					metadescription="Phim theo quốc gia, năm sản xuất, thể loại, tìm tên phim, - Phim vietsub, phim 18+ phim âu mỹ, phim hay, phim hd, phim mới ra, phim chiếu rạp cập hàng giờ liên tục "
					slug={`${page.url}`}
					jsonLd={{
						'@context': 'https://schema.org',
						'@type': 'ItemList',
						itemListElement: (movies?.results || []).map((movie: any, i: number) => {
							return {
								'@type': 'ListItem',
								position: i + 1,
								item: {
									'@type': 'Movie',
									url: `${websiteUrl}/phim/${CommonHelper.stringToSlug(movie.title)}/${movie.id}`,
									name: movie.title,
									image: `${DOMAIN_TMDB_IMAGE_CDN}/t/p/w300/${movie.poster_path}`,
									dateCreated: movie.release_date ?? '',
									aggregateRating: {
										'@type': 'AggregateRating',
										ratingValue: movie.vote_average == 0 ? 1 : movie.vote_average,
										bestRating: '10',
										ratingCount: movie.vote_count == 0 ? 1 : movie.vote_count
									}
								}
							};
						})
					}}
				/>
				{#each (movies?.results || []) as movie (movie.id)}
					<CardMovieFilter {movie} showDate={true} class="" />
				{/each}
			{/key}
		</div>
	</div>
	<div class="flex flex-col items-center mx-auto w-full container">
		<Paginations
			totalPages={(movies?.total_pages ?? 0) > 500 ? 500 : (movies?.total_pages ?? 0)}
			bind:currentPage
		/>
	</div>
</section>
