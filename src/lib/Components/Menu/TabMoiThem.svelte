<script lang="ts">
	import CardMovieFilter from '../Card/CardMovieFilter.svelte';
	import { moviesNewAddStore } from '$lib/runes/movieStore.svelte';
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages';
	import Seo from '$lib/Components/SEO/Seo.svelte';
	import CommonHelper from '$lib/helper/commentHelper';
	import { DOMAIN_TMDB_IMAGE_CDN, websiteUrl } from '$lib';
	import { getNewAddedMovies } from '$lib/services/supabase';
	import { onMount } from 'svelte';

	interface Props {
		movieItems?: number;
	}

	let { movieItems = 40 }: Props = $props();
	let moviesAddedNew = $derived(
		page.data?.moviesAddedNew && page.data.moviesAddedNew.length > 0
			? page.data.moviesAddedNew.slice(0, movieItems)
			: (moviesNewAddStore.value && moviesNewAddStore.value.length > 0
				? moviesNewAddStore.value.slice(0, movieItems)
				: [])
	);

	onMount(async () => {
		if (page.data?.moviesAddedNew && page.data.moviesAddedNew.length > 0) {
			moviesNewAddStore.value = page.data.moviesAddedNew;
			return;
		}
		const res = await getNewAddedMovies();
		if (res && res.length > 0) {
			moviesNewAddStore.value = res;
		}
	});
</script>

{#if moviesAddedNew.length > 0}
	<section id="moi-them" class="w-full flex mx-auto">
		<div class="grid grid-cols-2 px-2 md:px-0 md:grid-cols-5 lg:grid-cols-10 gap-2 w-full h-full">
			{#key moviesAddedNew}
				<Seo
					title="Phim mới thêm, phim hot, phim nên xem theo quốc gia, năm sản xuất thể loại"
					metadescription="Phim theo quốc gia, năm sản xuất, thể loại, tìm tên phim, - Phim vietsub, phim 18+ phim âu mỹ, phim hay, phim hd, phim mới ra, phim chiếu rạp cập hàng giờ liên tục "
					slug={`${page.url}`}
					jsonLd={{
						'@context': 'https://schema.org',
						'@type': 'ItemList',
						itemListElement: moviesAddedNew.map((movie: any, i: number) => {
							return {
								'@type': 'ListItem',
								position: i + 1,
								item: {
									'@type': 'Movie',
									url: `${websiteUrl}/phim/${CommonHelper.stringToSlug(movie.title)}/${
										movie.id
									}`,
									name: movie.title,
									image: `${DOMAIN_TMDB_IMAGE_CDN}/t/p/w300/${movie.poster_path}`,
									dateCreated: movie.release_date ?? '',
									director: {
										'@type': 'Person',
										name:
											movie.credits?.crew?.find((c: any) => c.job === 'Director')?.name ?? m.status_updating()
									},
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
				{#each moviesAddedNew as movie}
					<CardMovieFilter {movie} showDate={false} class="" />
				{/each}
			{/key}
		</div>
	</section>
{/if}
