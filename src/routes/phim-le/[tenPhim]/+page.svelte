<script lang="ts">
	import { browser } from '$app/environment';
	import { serializeSchema } from '$lib/helper/security';
	import { page } from '$app/state';
	import { websiteUrl } from '$lib';
	import Seo from '$lib/Components/SEO/Seo.svelte';
	import TenPhimPage from '$lib/Components/layout/tenPhimPage.svelte';
	import { kkPhimboTapPhimStore, resetPlayedTime } from '$lib/runes/kkPhimStore.svelte';
	import {
		playedListStore,
		myListMoviesStore,
	} from '$lib/runes/movieStore.svelte';

	let kkPhimleDetail: kkPhimboDetailType = $derived(page.data.kkPhimleDetail);
	let playMovieInfo: PlayerMovieInfo = $state({
		_id: '',
		content: '',
		name: '',
		thumb_url: '',
		year: 0,
		id: '',
		origin_name: '',
		poster_url: '',
		playedTime: 0,
		time: '',
		slug: '',
		source: 'kk',
		status: '',
		type: '',
		vote_average: 8.0,
		duration: 0
	});

	$effect(() => {
		if (kkPhimleDetail?.movie) {
			playMovieInfo._id = kkPhimleDetail.movie._id;
			playMovieInfo.content = kkPhimleDetail.movie.content;
			playMovieInfo.name = kkPhimleDetail.movie.name;
			playMovieInfo.thumb_url = kkPhimleDetail.movie.thumb_url;
			playMovieInfo.year = kkPhimleDetail.movie.year;
			playMovieInfo.origin_name = kkPhimleDetail.movie.origin_name;
			playMovieInfo.poster_url = kkPhimleDetail.movie.poster_url;
			playMovieInfo.time = kkPhimleDetail.movie.time;
			playMovieInfo.slug = kkPhimleDetail.movie.slug;
			playMovieInfo.status = kkPhimleDetail.movie.status;
			playMovieInfo.type = kkPhimleDetail.movie.type;

			const record = playedListStore.value.find((item) => item._id === kkPhimleDetail.movie._id);
			if (record && !resetPlayedTime.value) {
				playMovieInfo.playedTime = record.playedTime ?? 0;
				playMovieInfo.duration = record.duration ?? 0;
			}
		}
	});

	let movieListed = $derived(
		myListMoviesStore.value.some((item) => 
			(item._id && kkPhimleDetail?.movie?._id && item._id === kkPhimleDetail.movie._id) ||
			(item.slug && kkPhimleDetail?.movie?.slug && item.slug === kkPhimleDetail.movie.slug)
		)
	);
	let watchPercent = $derived(
		playMovieInfo.duration && isFinite(playMovieInfo.duration) && playMovieInfo.duration > 0
			? Math.round((playMovieInfo.playedTime! / playMovieInfo.duration!) * 100)
			: 0
	);
	let currentEpisode = $derived(kkPhimboTapPhimStore.value.find(
		(item) => item.movie === kkPhimleDetail?.movie?.slug
	)?.episodes);

	$effect(() => {
		if (playedListStore.state === 'ready' && kkPhimleDetail?.movie?._id) {
			const record = playedListStore.value.find((item) => item._id === kkPhimleDetail.movie._id);
			if (record && !resetPlayedTime.value) {
				playMovieInfo.playedTime = record.playedTime ?? 0;
				playMovieInfo.duration = record.duration ?? 0;
			}
		}
	});
</script>

{#if kkPhimleDetail?.movie}
	<Seo
		title={kkPhimleDetail.movie.name +
			' | ' +
			kkPhimleDetail.movie.origin_name +
			' (' +
			(kkPhimleDetail.movie.year?.toString() ?? '') +
			') 4K FULL HD 1080p Vietsub Online miễn phí'}
		metadescription={kkPhimleDetail.movie.name +
			' ' +
			kkPhimleDetail.movie.origin_name +
			' (' +
			(kkPhimleDetail.movie.year?.toString() ?? '') +
			') ' +
			' - ' +
			kkPhimleDetail.movie.content}
		slug={`${page.url}`}
		image={`${kkPhimleDetail.movie.poster_url}`}
		keywordsPlus={kkPhimleDetail.movie.name}
		jsonLd={{
			'@context': 'https://schema.org',
			'@type': 'Movie',
			actor: (kkPhimleDetail.movie.actor || []).map((actor) => {
				return {
					'@type': 'Person',
					name: actor
				};
			}),
			description:
				kkPhimleDetail.movie.name +
				' | ' +
				kkPhimleDetail.movie.origin_name +
				' (' +
				(kkPhimleDetail.movie.year?.toString() ?? '') +
				') ' +
				kkPhimleDetail.movie.content,
			director: {
				'@type': 'Person',
				name: (kkPhimleDetail.movie.director || []).join(', ')
			},
			name:
				'Phim [ ' +
				kkPhimleDetail.movie.name +
				' ] | ' +
				kkPhimleDetail.movie.origin_name +
				' (' +
				(kkPhimleDetail.movie.year?.toString() ?? '') +
				') 4K FULL HD 1080p Vietsub Online miễn phí',
			image: `${kkPhimleDetail.movie.poster_url}`,
			url: `${page.url}`,
			dateCreated: kkPhimleDetail.movie.year?.toString() ?? ''
		}}
	>
		<meta property="video:duration" content={kkPhimleDetail.movie.time} />
		{#each kkPhimleDetail.movie.actor || [] as cast}
			<meta property="video:actor" content={cast} />
		{/each}
		{#each kkPhimleDetail.movie.director || [] as director}
			<meta property="video:director" content={director} />
		{/each}
		<meta property="video:release_date" content={kkPhimleDetail.movie.year?.toString() ?? ''} />
		{@html serializeSchema({
			"@context": "https://schema.org",
			"@type": "BreadcrumbList",
			"itemListElement": [{
				"@type": "ListItem",
				"position": 1,
				"name": "Phim lẻ",
				"item": `${websiteUrl}/phim-le`
			},{
				"@type": "ListItem",
				"position": 2,
				"name": `${kkPhimleDetail.movie.name}`,
				"item": `${page.url}`
			}]
		})}
	</Seo>
	<TenPhimPage
		{currentEpisode}
		movieDetail={kkPhimleDetail}
		{movieListed}
		movieSource="kkPhimLe"
		{watchPercent}
	/>
{/if}
