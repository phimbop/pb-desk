<script lang="ts">
	import { serializeSchema } from '$lib/helper/security';
	import { page } from '$app/state';
	import Seo from '$lib/Components/SEO/Seo.svelte';
	import { isPlaying, openComment } from '$lib/runes/movieStore.svelte';
	import CommentSection from '$lib/Components/Comments/CommentSection.svelte';
	import tooltip from '$lib/helper/tooltip';
	import type { TvSeriesDetail } from '../../../../../../types/Tmdb';
	import { DOMAIN_TMDB_IMAGE_CDN, websiteUrl } from '$lib';
	import CardVideoPlay from '$lib/Components/Card/CardVideoPlay.svelte';
	import { onMount } from 'svelte';
	import { m } from '$lib/paraglide/messages';
	let tvDetail: TvSeriesDetail = $derived(page.data.tvDetail);
	onMount(async () => {
		isPlaying.value = true;
	});
</script>

<Seo
	title={tvDetail.name +
		' | ' +
		tvDetail.original_name +
		' (' +
		tvDetail.first_air_date.slice(0, 4) +
		') - Season ' +
		page.params.seasonId +
		` - ${m.reuse_episode()} ` +
		page.params.episode +
		' - 4K FULL HD 1080p'}
	metadescription={tvDetail.name +
		' | ' +
		tvDetail.original_name +
		' (' +
		tvDetail.first_air_date.slice(0, 4) +
		') | ' +
		tvDetail.overview}
	slug={`${page.url}`}
	image={`${DOMAIN_TMDB_IMAGE_CDN}/t/p/original${tvDetail.poster_path}`}
	keywordsPlus={tvDetail.name + ' | ' + tvDetail.original_name}
	jsonLd={{
		'@context': 'https://schema.org',
		'@type': 'Movie',
		actor: (tvDetail.credits?.cast || []).map((cast: any) => {
			return {
				'@type': 'Person',
				name: cast.name
			};
		}),
		aggregateRating: {
			'@type': 'AggregateRating',
			bestRating: '10',
			ratingCount: tvDetail.vote_count > 0 ? tvDetail.vote_count : 1,
			ratingValue: tvDetail.vote_average?.toFixed(1) ?? 1,
			worstRating: '0'
		},
		description: tvDetail.overview,
		director: {
			'@type': 'Person',
			name: tvDetail.credits?.crew?.find((item: any) => item.job == 'Director')?.name
		},
		name:
			tvDetail.name + ' | ' + tvDetail.original_name + ' ' + tvDetail.first_air_date.slice(0, 4),
		image: `${DOMAIN_TMDB_IMAGE_CDN}/t/p/original${tvDetail.poster_path}`,
		url: `${page.url}`,
		dateCreated: tvDetail.first_air_date ?? ''
	}}
>
	<meta property="video:duration" content={'2700'} />
	{#each tvDetail.credits?.cast || [] as cast}
		<meta property="video:actor" content={cast.name} />
	{/each}
	<meta
		property="video:director"
		content={tvDetail.credits?.crew?.find((item: any) => item.job == 'Director')?.name}
	/>
	<meta property="video:release_date" content={tvDetail.first_air_date} />
	{#each tvDetail.genres || [] as tag}
		<meta property="video:tag" content={tag.name} />
	{/each}
	{@html serializeSchema({
		 "@context": "https://schema.org",
		 "@type": "BreadcrumbList",
		 "itemListElement": [{
		   "@type": "ListItem",
		   "position": 1,
		   "name": "Tv",
		   "item": `${websiteUrl}/tv`
		 },{
		   "@type": "ListItem",
		   "position": 2,
		   "name": `${tvDetail.name}`,
		   "item": `${page.url}`
		 },{
		   "@type": "ListItem",
		   "position": 3,
		   "name": `Season ${page.params.seasonId} - Tập ${page.params.episode}`,
		   "item": `${page.url}`
		 }]
	   })}
</Seo>
<div class="relative w-full h-fit md:h-full px-2 sm:px-0 md:flex overflow-hidden">
	<div
		class="relative transition-all duration-200 md:flex-1 {openComment.value
			? 'md:w-2/3'
			: 'w-full'}"
	>
		<div
			class="{isPlaying.value
				? 'opacity-0'
				: 'opacity-100'} absolute top-3 right-3 md:top-20 md:right-20 grid grid-cols-2 md:grid-cols-1 z-40 md:space-y-10"
		>
			<button
				aria-label="Bình luận"
				class="cursor-pointer p-2 hover:bg-white/20 rounded-md"
				onclick={(e) => {
					e.preventDefault();
					openComment.value = !openComment.value;
				}}
				use:tooltip={{ text: 'Bình luận', position: 'left' }}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="icon icon-tabler icon-tabler-message w-8 h-8 text-slate-200"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					fill="none"
					stroke-linecap="round"
					stroke-linejoin="round"
					><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M8 9h8" /><path
						d="M8 13h6"
					/><path
						d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12z"
					/></svg
				>
			</button>
			<a
				href="https://www.facebook.com/sharer.php?u={page.url}"
				target="_blank"
				rel="nofollow"
				aria-label="Chia sẻ"
				use:tooltip={{ text: 'share', position: 'left' }}
				class="p-2 hover:bg-white/20 rounded-md inline-block"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="icon icon-tabler icon-tabler-share-3 w-8 h-8 text-slate-200"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					fill="none"
					stroke-linecap="round"
					stroke-linejoin="round"
					><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
						d="M13 4v4c-6.575 1.028 -9.02 6.788 -10 12c-.037 .206 5.384 -5.962 10 -6v4l8 -7l-8 -7z"
					/></svg
				>
			</a>
		</div>
		<div class="w-full aspect-video relative md:h-screen md:overflow-hidden">
			<CardVideoPlay
				tmdbId={tvDetail.id}
				season={page.params.seasonId}
				episode={page.params.episode}
			/>
		</div>
	</div>
	<div
		class="max-w-xl md:mt-24 p-4 transition-all duration-200 overflow-y-auto {openComment.value
			? 'md:w-1/3 opacity-100 translate-x-0'
			: 'opacity-0 translate-x-full w-0 -mr-8 hidden md:block'}"
	>
		{#if openComment.value}
			<CommentSection movieId={String(tvDetail.id)} user={page.data.user} />
		{/if}
	</div>
</div>
