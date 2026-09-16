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
	let kkPhimboDetail: kkPhimboDetailType = $derived(page.data.kkPhimboDetail);
	let currentEpisode = $derived(kkPhimboTapPhimStore.value.find(
		(item) => item.movie === kkPhimboDetail?.movie?.slug
	)?.episodes);

	let currentEpData = $derived.by(() => {
		const serverData = kkPhimboDetail?.episodes?.[0]?.server_data || [];
		return serverData.find((item) => item.slug === page.params.tapPhim) || serverData[0];
	});

	const playNext = () => {
		if (playedListStore.value.some((item) => item._id === playMovieInfo?._id)) {
			playedListStore.value = playedListStore.value.map((item) => {
				if (item._id === playMovieInfo?._id) {
					playMovieInfo.playedTime = 0;
					return { ...item, playedTime: 0 };
				} else {
					return item;
				}
			});
		}
		const serverData = kkPhimboDetail?.episodes?.[0]?.server_data || [];
		let index = serverData.findIndex(
			(item) => item.slug == page.params.tapPhim
		);
		if (index < serverData.length - 1) {
			const nextEp = serverData[index + 1].slug;
			if (kkPhimboTapPhimStore.value.some((item) => item.movie === kkPhimboDetail.movie.slug)) {
				kkPhimboTapPhimStore.value = kkPhimboTapPhimStore.value.map((item) => {
					if (item.movie === kkPhimboDetail.movie.slug) {
						return { ...item, episodes: nextEp };
					} else {
						return item;
					}
				});
			} else {
				kkPhimboTapPhimStore.value = [
					...kkPhimboTapPhimStore.value,
					{
						movie: kkPhimboDetail.movie.slug,
						episodes: nextEp
					}
				];
			}
			goto(`/phim-bo/${kkPhimboDetail.movie.slug}/${nextEp}`);
		} else {
			const firstEp = serverData[0]?.slug;
			if (firstEp) {
				if (kkPhimboTapPhimStore.value.some((item) => item.movie === kkPhimboDetail.movie.slug)) {
					kkPhimboTapPhimStore.value = kkPhimboTapPhimStore.value.map((item) => {
						if (item.movie === kkPhimboDetail.movie.slug) {
							return { ...item, episodes: firstEp };
						} else {
							return item;
						}
					});
				} else {
					kkPhimboTapPhimStore.value = [
						...kkPhimboTapPhimStore.value,
						{
							movie: kkPhimboDetail.movie.slug,
							episodes: firstEp
						}
					];
				}
				goto(`/phim-bo/${kkPhimboDetail.movie.slug}/${firstEp}`);
			}
		}
	};
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
		if (kkPhimboDetail?.movie) {
			playMovieInfo._id = kkPhimboDetail.movie._id;
			playMovieInfo.content = kkPhimboDetail.movie.content;
			playMovieInfo.name = kkPhimboDetail.movie.name;
			playMovieInfo.thumb_url = kkPhimboDetail.movie.thumb_url;
			playMovieInfo.year = kkPhimboDetail.movie.year;
			playMovieInfo.origin_name = kkPhimboDetail.movie.origin_name;
			playMovieInfo.poster_url = kkPhimboDetail.movie.poster_url;
			playMovieInfo.time = kkPhimboDetail.movie.time;
			playMovieInfo.slug = kkPhimboDetail.movie.slug;
			playMovieInfo.status = kkPhimboDetail.movie.status;
			playMovieInfo.type = kkPhimboDetail.movie.type;
		}
	});
	$effect(() => {
		if (videoEnded) {
			playMovieInfo.playedTime = 0;
		}
	});
	$effect(() => {
		if (playedListStore.state === 'ready' && kkPhimboDetail?.movie?._id) {
			const record = playedListStore.value.find((item) => item._id === kkPhimboDetail.movie._id);
			if (record && !resetPlayedTime.value) {
				playMovieInfo.playedTime = record.playedTime ?? 0;
				playMovieInfo.duration = record.duration ?? 0;
			}
		}
	});
</script>

{#if kkPhimboDetail?.movie && currentEpData}
	<Seo
		title={'Xem phim ' + (currentEpData.filename || kkPhimboDetail.movie.name)}
		metadescription={kkPhimboDetail.movie.content.replace(/\\/g, '')}
		slug={`${page.url}`}
		image={`${kkPhimboDetail.movie.poster_url}`}
		jsonLd={{
			'@context': 'https://schema.org',
			'@type': 'Movie',
			actor: (kkPhimboDetail.movie.actor || []).map((actor) => {
				return {
					'@type': 'Person',
					name: actor
				};
			}),
			description: kkPhimboDetail.movie.content.replace(/\\/g, ''),
			director: {
				'@type': 'Person',
				name: (kkPhimboDetail.movie.director || []).join(', ')
			},
			name:
				'Xem phim ' +
				kkPhimboDetail.movie.name +
				' - ' +
				kkPhimboDetail.movie.origin_name +
				' - ' +
				kkPhimboDetail.movie.year,
			image: `${kkPhimboDetail.movie.poster_url}`,
			url: `${page.url}`,
			dateCreated: kkPhimboDetail.movie.year?.toString() ?? ''
		}}
	>
		<meta property="video:duration" content={kkPhimboDetail.movie.time} />
		{#each kkPhimboDetail.movie.actor || [] as cast}
			<meta property="video:actor" content={cast} />
		{/each}
		{#each kkPhimboDetail.movie.director || [] as director}
			<meta property="video:director" content={director} />
		{/each}
		<meta property="video:release_date" content={kkPhimboDetail.movie.year?.toString() ?? ''} />
		{@html serializeSchema({
			"@context": "https://schema.org",
			"@type": "VideoObject",
			"name": `Xem phim ${currentEpData.filename || kkPhimboDetail.movie.name}`,
			"description": `${kkPhimboDetail.movie.content.replace(/\\/g, '')}`,
			"thumbnailUrl": [ `${kkPhimboDetail.movie.poster_url}` ],
			"uploadDate": `${kkPhimboDetail.movie.modified?.time || ''}`,
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
				"name": "Phim bộ",
				"item": `${websiteUrl}/phim-bo`
			},{
				"@type": "ListItem",
				"position": 2,
				"name": `${kkPhimboDetail.movie.name}`,
				"item": `${websiteUrl}/phim-bo/${kkPhimboDetail.movie.slug}`
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
						posterSrc={kkPhimboDetail.movie.thumb_url}
						posterAlt={kkPhimboDetail.movie.name}
						videoTitle={currentEpData.filename}
						clickBtnNext={playNext}
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
				<CommentSection movieId={kkPhimboDetail.movie._id} user={page.data.user} />
			{/if}
		</div>
	</div>
{/if}
