<script lang="ts">
	import { page } from '$app/state';
	import CardMovieFilter from '$lib/Components/Card/CardMovieFilter.svelte';
	import Paginations from '$lib/Components/Paginations.svelte';
	import CommonHelper from '$lib/helper/commentHelper';
	import { moviesHandler } from '$lib/runes/movieStore.svelte';
	import Seo from '$lib/Components/SEO/Seo.svelte';
	import { DOMAIN_TMDB_IMAGE_CDN, websiteUrl } from '$lib';
	import { getLocale } from '$lib/paraglide/runtime';
	import { onMount } from 'svelte';
	import LoadingSubBlur from '../LoadingSubBlur.svelte';
	let movies = $state(page.data.topRatedMovies ?? { results: [], total_pages: 0 });
	let currentPageTopRated = $state(page.data.topRatedMovies?.page ?? 1);
	let loading = $state(false);
	let mounted = $state(false);
	let lastFetchedPage = $state<number | null>(null);
	onMount(() => {
		mounted = true;
	});
	const handlePageChange = async (targetPage: number) => {
		if (loading) return;
		loading = true;
		lastFetchedPage = targetPage;
		try {
			const movieList: TmdbMovies = await moviesHandler.tmdbGetTopRateMovies(targetPage, getLocale());
			movies = movieList ?? { results: [], total_pages: 0, page: targetPage };
		} catch (e) {
			console.error('Failed to fetch top rated movies:', e);
		} finally {
			loading = false;
		}
	};
	$effect(() => {
		if (mounted && currentPageTopRated && !loading && lastFetchedPage !== currentPageTopRated) {
			const loadedPage = movies?.page;
			if (currentPageTopRated !== loadedPage || (!movies?.results?.length && lastFetchedPage === null)) {
				handlePageChange(currentPageTopRated);
			}
		}
	});
</script>

{#key movies}
	<Seo
		title="Phim mới thêm, phim hot, phim nên xem theo quốc gia, năm sản xuất thể loại"
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
{/key}
<div class="relative w-full h-full">
	{#if loading}
		<LoadingSubBlur />
	{/if}
	<section class="w-full h-full grid md:grid-cols-5 lg:grid-cols-10 gap-2">
		{#each (movies?.results || []) as movie, i (movie.id)}
			<CardMovieFilter {movie} showDate={false} class="" />
		{/each}
	</section>
</div>

<section class="flex flex-col items-center mx-auto w-full container">
	<Paginations
		totalPages={(movies?.total_pages ?? 0) > 500 ? 500 : (movies?.total_pages ?? 0)}
		bind:currentPage={currentPageTopRated}
	/>
</section>
