<script lang="ts">
	import { browser } from '$app/environment';
	import { serializeSchema } from '$lib/helper/security';
	import { page } from '$app/state';
	import Seo from '$lib/Components/SEO/Seo.svelte';
	import { goto } from '$app/navigation';
	import {
		isPlaying,
		openComment,
		playedListStore
	} from '$lib/runes/movieStore.svelte';
	import CommentSection from '$lib/Components/Comments/CommentSection.svelte';
	import tooltip from '$lib/helper/tooltip';
	import { kkPhimboTapPhimStore, resetPlayedTime } from '$lib/runes/kkPhimStore.svelte';
	import { websiteUrl } from '$lib';
	import { onMount } from 'svelte';

	let KkPlayer = $state<any>(null);

	onMount(async () => {
		const module = await import('$lib/Components/kkPlayer/kkPlayer.svelte');
		KkPlayer = module.default;
	});

	let movieDetail: kkPhimboDetailType = $derived(page.data.kkPhimleDetail);
	let currentEpisode = $derived(kkPhimboTapPhimStore.value.find(
		(item) => item.movie === movieDetail?.movie?.slug
	)?.episodes);

	let currentEpServerIndex = $derived.by(() => {
		if (!movieDetail?.episodes?.length) return 0;
		const lastChar = page.params.tapPhim?.slice(-1);
		const num = Number(lastChar);
		if (!isNaN(num) && movieDetail.episodes[num]) {
			return num;
		}
		return 0;
	});

	let currentServer = $derived(movieDetail?.episodes?.[currentEpServerIndex] || movieDetail?.episodes?.[0]);
	let currentEpData = $derived(
		currentServer?.server_data?.find((item) => item.slug === page.params.tapPhim) ||
		currentServer?.server_data?.[0]
	);

	let videoEnded = $state(false);
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
		vote_average: 8.0
	});

	$effect(() => {
		if (movieDetail?.movie) {
			playMovieInfo._id = movieDetail.movie._id;
			playMovieInfo.content = movieDetail.movie.content;
			playMovieInfo.name = movieDetail.movie.name;
			playMovieInfo.thumb_url = movieDetail.movie.thumb_url;
			playMovieInfo.year = movieDetail.movie.year;
			playMovieInfo.origin_name = movieDetail.movie.origin_name;
			playMovieInfo.poster_url = movieDetail.movie.poster_url;
			playMovieInfo.time = movieDetail.movie.time;
			playMovieInfo.slug = movieDetail.movie.slug;
			playMovieInfo.status = movieDetail.movie.status;
			playMovieInfo.type = movieDetail.movie.type;
		}
	});

	$effect(() => {
		if (videoEnded) {
			playMovieInfo.playedTime = 0;
		}
	});

	$effect(() => {
		if (playedListStore.state === 'ready' && movieDetail?.movie?._id) {
			const record = playedListStore.value.find((item) => item._id === movieDetail.movie._id);
			if (record && !resetPlayedTime.value) {
				playMovieInfo.playedTime = record.playedTime ?? 0;
				playMovieInfo.duration = record.duration ?? 0;
			}
		}
	});
</script>

{#if movieDetail?.movie && currentEpData}
	<Seo
		title={'Xem phim ' + (currentEpData.filename || movieDetail.movie.name)}
		metadescription={movieDetail.movie.content.replace(/\\/g, '')}
		slug={`${page.url}`}
		image={`${movieDetail.movie.poster_url}`}
		jsonLd={{
			'@context': 'https://schema.org',
			'@type': 'Movie',
			actor: (movieDetail.movie.actor || []).map((actor) => {
				return {
					'@type': 'Person',
					name: actor
				};
			}),
			description: movieDetail.movie.content.replace(/\\/g, ''),
			director: {
				'@type': 'Person',
				name: (movieDetail.movie.director || []).join(', ')
			},
			name:
				'Xem phim ' +
				movieDetail.movie.name +
				' - ' +
				movieDetail.movie.origin_name +
				' - ' +
				movieDetail.movie.year,
			image: `${movieDetail.movie.poster_url}`,
			url: `${page.url}`,
			dateCreated: movieDetail.movie.year?.toString() ?? ''
		}}
	>
		<meta property="video:duration" content={movieDetail.movie.time} />
		{#each movieDetail.movie.actor || [] as cast}
			<meta property="video:actor" content={cast} />
		{/each}
		{#each movieDetail.movie.director || [] as director}
			<meta property="video:director" content={director} />
		{/each}
		<meta property="video:release_date" content={movieDetail.movie.year?.toString() ?? ''} />
		{@html serializeSchema({
			"@context": "https://schema.org",
			"@type": "VideoObject",
			"name": `Xem phim ${currentEpData.filename || movieDetail.movie.name}`,
			"description": `${movieDetail.movie.content.replace(/\\/g, '')}`,
			"thumbnailUrl": [ `${movieDetail.movie.poster_url}` ],
			"uploadDate": `${movieDetail.movie.modified?.time || ''}`,
			"duration": "PT45M54S",
			"contentUrl": `${currentEpData.link_m3u8}`,
			"embedUrl": `${currentEpData.link_embed}`,
			"interactionStatistic": {
				"@type": "InteractionCounter",
				"interactionType": { "@type": "WatchAction" },
				"userInteractionCount": 1000
			},
			"regionsAllowed": "VN"
		})}
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
				"name": `${movieDetail.movie.name}`,
				"item": `${websiteUrl}/phim-le/${movieDetail.movie.slug}`
			},{
				"@type": "ListItem",
				"position": 3,
				"name": `Xem phim ${currentEpData.name}`,
				"item": `${page.url}`
			}]
		})}
	</Seo>
	<div class="relative w-full h-fit md:h-full px-2 sm:px-0 md:flex overflow-hidden">
		<div
			class="relative transition-all duration-200 md:flex-1 {openComment.value ? 'md:w-2/3' : 'w-full'}"
		>
			<div class="{isPlaying.value ? 'opacity-0' : 'opacity-100'} absolute top-3 right-3 md:top-20 md:right-20 grid grid-cols-2 md:grid-cols-1 z-40 md:space-y-10">
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
				<button
					aria-label="Chia sẻ"
					use:tooltip={{ text: 'Chia sẻ', position: 'left' }}
					class="p-2 hover:bg-white/20 rounded-md"
				>
					<a href="https://www.facebook.com/sharer.php?u={page.url}" target="_blank" rel="nofollow">
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
				</button>
			</div>
			<div class="w-full aspect-video relative md:h-screen md:overflow-hidden">
				{#if browser && playedListStore.state === 'ready' && KkPlayer}
					<KkPlayer
						videoSrc={currentEpData.link_m3u8}
						posterSrc={movieDetail.movie.thumb_url}
						posterAlt={movieDetail.movie.name}
						videoTitle={currentEpData.filename}
						HideBtnPlayNext={true}
						bind:videoEnded
						bind:playMovieInfo
					/>
				{/if}
			</div>
		</div>
		<div
			class="max-w-xl md:mt-24 p-4 transition-all duration-200 overflow-y-auto {openComment.value
				? 'md:w-1/3 opacity-100 translate-x-0'
				: 'opacity-0 translate-x-full w-0 -mr-8 hidden md:block'}"
		>
			{#if openComment.value}
				<CommentSection movieId={movieDetail.movie._id} user={page.data.user} />
			{/if}
		</div>
	</div>
{/if}
