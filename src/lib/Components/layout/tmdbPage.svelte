<script lang="ts">
	import { page } from '$app/state';
	import { clickAdslink, DOMAIN_TMDB_IMAGE_CDN, DOMAIN_TMDB_IMAGE_ORIGINAL, openExternalUrl, websiteUrl } from '$lib';
	import { serializeSchema } from '$lib/helper/security';
	import IconPlus from '$lib/Components/Icon/IconPlus.svelte';
	import IconUserMinus from '$lib/Components/Icon/IconUserMinus.svelte';
	import Play from '$lib/Components/Icon/Play.svelte';
	import Seo from '$lib/Components/SEO/Seo.svelte';
	import tooltip from '$lib/helper/tooltip';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import {
		apiHandler,
		isPlaying,
		moviesHandler,
		myListMoviesStore,
		playedListStore,
		openComment
	} from '$lib/runes/movieStore.svelte';
	import CommentSection from '$lib/Components/Comments/CommentSection.svelte';
	import type { TmdbMovieDetail } from '../../../types/Tmdb';
	import CardActors from '../Card/CardActors.svelte';
	import CardVideoPlay from '../Card/CardVideoPlay.svelte';
	import LoadingImage from '../Image/LoadingImage.svelte';
	import Image from '../Image/Image.svelte';
	import SectionMovieRelate from '../Section/SectionMovieRelate.svelte';
	import LoginModal from '../Auth/LoginModal.svelte';
	import AddToPlaylistModal from '../Playlist/AddToPlaylistModal.svelte';
	import StarRating from '$lib/Components/Rating/StarRating.svelte';

	interface Props {
		movieDetail: TmdbMovieDetail;
		watchPercent: number;
		movieListed: boolean;
		currentEpisode?: string | number;
		movieSource: 'kkPhimBo' | 'kkPhimLe' | 'tmdb' | 'op' | 'animation' | string;
	}
	let {
		movieDetail,
		watchPercent,
		movieListed = $bindable(),
		currentEpisode = $bindable(),
		movieSource
	}: Props = $props();
	let scrollY = $state(0);
	let showAllActors = $state(false);
	let showAllCrew = $state(false);
	let showPlaylistModal = $state(false);
	let showLoginModal = $state(false);

	const currentTime = new Date().toISOString();
	const updatePlayedList = async () => {
		let playerMovieInfo: PlayerMovieInfo = {
			source: 'tmdb',
			_id: '',
			id: movieDetail.id,
			content: movieDetail.overview,
			name: movieDetail.title,
			title: movieDetail.title,
			origin_name: movieDetail.original_title,
			playedTime: 0,
			poster_url: movieDetail!.poster_path,
			poster_path: movieDetail!.poster_path,
			thumb_url: movieDetail!.backdrop_path,
			status: 'full',
			year: movieDetail.release_date ?? '',
			time: movieDetail.runtime?.toString() ?? '0',
			type: 'single',
			vote_average: movieDetail.vote_average,
			slug: page.url.pathname.toString(),
			duration: movieDetail.runtime,
			updatedAt: currentTime
		};
		if (isPlaying.value) {
			const existingItemIndex = playedListStore.value.findIndex(
				(item) => item.id === movieDetail.id
			);
			if (existingItemIndex !== -1) {
				playedListStore.value = playedListStore.value.with(existingItemIndex, {
					...playedListStore.value[existingItemIndex],
					updatedAt: currentTime
				});
			} else {
				playedListStore.value = [...playedListStore.value, playerMovieInfo];
			}
			await apiHandler.srdbRegisterView(playerMovieInfo);
		}
	};
	$effect(() => {
		if (movieDetail) {
			isPlaying.value = false;
		}
	});
	$effect(() => {
		if (!isPlaying.value) {
			updatePlayedList();
		}
	});
</script>
<Seo
	title={movieDetail.title +
		' | ' +
		movieDetail.original_title +
		' (' +
		(movieDetail.release_date?.slice(0, 4) ?? '') +
		') 4K FULL HD 1080p Vietsub Online miễn phí'}
	metadescription={movieDetail.title +
		' | ' +
		movieDetail.original_title +
		' (' +
		(movieDetail.release_date?.slice(0, 4) ?? '') +
		') | ' +
		movieDetail.overview}
	slug={`${page.url}`}
	image={`${DOMAIN_TMDB_IMAGE_CDN}/t/p/original${movieDetail.poster_path}`}
	keywordsPlus={movieDetail.title + ' | ' + movieDetail.original_title}
	jsonLd={{
		'@context': 'https://schema.org',
		'@type': 'Movie',
		actor: movieDetail.credits?.cast?.map((cast:any) => {
			return {
				'@type': 'Person',
				name: cast.name
			};
		}) ?? [],
		aggregateRating: {
			'@type': 'AggregateRating',
			bestRating: '10',
			ratingCount: movieDetail.vote_count > 0 ? movieDetail.vote_count : 1,
			ratingValue: movieDetail.vote_average?.toFixed(1) ?? 1,
			worstRating: '0'
		},
		description: movieDetail.overview,
		director: {
			'@type': 'Person',
			name: movieDetail.credits?.crew?.find((item:any) => item.job === 'Director')?.name
		},
		name:
			movieDetail.title +
			' | ' +
			movieDetail.original_title +
			' ' +
			(movieDetail.release_date?.slice(0, 4) ?? ''),
		image: `${DOMAIN_TMDB_IMAGE_CDN}/t/p/original${movieDetail.poster_path}`,
		url: `${page.url}`,
		dateCreated: movieDetail.release_date ?? '',
		sameAs: [
			movieDetail.imdb_id ? `https://www.imdb.com/title/${movieDetail.imdb_id}` : '',
			movieDetail.id ? `https://www.themoviedb.org/movie/${movieDetail.id}` : ''
		].filter(Boolean)
	}}
>
	<meta property="video:duration" content={((movieDetail.runtime ?? 0) * 60).toString()} />
	{#each movieDetail.credits?.cast ?? [] as cast}
		<meta property="video:actor" content={cast.name} />
	{/each}
	<meta
		property="video:director"
		content={movieDetail.credits?.crew?.find((item:any) => item.job === 'Director')?.name}
	/>
	<meta property="video:release_date" content={movieDetail.release_date ?? ''} />
	{#each movieDetail.genres ?? [] as tag}
		<meta property="video:tag" content={tag.name} />
	{/each}
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
		   "name": movieDetail.title,
		   "item": `${page.url}`
		 }]
	})}
</Seo>
{#snippet btnPlay()}
	{#if !isPlaying.value}
		<a
			href="#play"
			class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-14 h-14 rounded-full focus:outline-hidden focus-visible:ring-4 focus-visible:ring-neonPink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 transition duration-200"
			onclick={(async (e) => {
				e.preventDefault();
				openExternalUrl(clickAdslink);
				isPlaying.value = true;
				try {
					await updatePlayedList();
				} catch (err) {
					console.warn('Update played list error:', err);
				}
			})}
			aria-label={isPlaying.value ? 'Pause' : 'Play'}
		>
			<Play />
		</a>
	{/if}
{/snippet}
{#snippet bgImage()}
	{#if movieDetail.backdrop_path && !isPlaying.value}
		<div
			class="relative sm:inset-0 w-full h-80 sm:h-screen overflow-hidden"
			style="
	transform: translateY({scrollY * 0.8}px);
	will-change: transform;"
		>
			<Image
				src="{DOMAIN_TMDB_IMAGE_ORIGINAL}{movieDetail.backdrop_path}"
				alt={movieDetail.title}
				isCritical={true}
				class="w-full h-full object-cover"
			/>
		</div>
	{:else if movieDetail.id && isPlaying.value}
	<div class="relative z-10 w-full h-fit md:h-full px-2 sm:px-0 md:flex overflow-hidden bg-slate-950">
		<div class="relative transition-all duration-200 md:flex-1 {openComment.value ? 'md:w-2/3' : 'w-full'} aspect-video md:h-full">
			<CardVideoPlay tmdbId={movieDetail.id} />
			<div class="{isPlaying.value ? 'opacity-0 hover:opacity-100 transition-opacity duration-200' : 'opacity-100'} absolute top-3 right-3 md:top-20 md:right-20 grid grid-cols-2 md:grid-cols-1 z-40 md:space-y-10">
				<button
					aria-label="Bình luận"
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
					use:tooltip={{ text: 'Chia sẻ', position: 'left' }}
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
		</div>
		<div
			class="max-w-xl md:mt-24 p-4 transition-all duration-200 overflow-y-auto {openComment.value
				? 'md:w-1/3 opacity-100 translate-x-0'
				: 'opacity-0 translate-x-full w-0 -mr-8 hidden md:block'}"
		>
			{#if openComment.value}
				<CommentSection movieId={String(movieDetail.id)} user={page.data.user} />
			{/if}
		</div>
	</div>
	{:else}
		<LoadingImage />
	{/if}
{/snippet}
{#snippet h1()}
		<h1
			class="flex items-end font-semibold text-3xl lg:text-6xl text-slate-200 max-w-[320px] lg:max-w-full {isPlaying.value ? 'md:opacity-0': 'opacity-100'}"
		>
			{getLocale() === 'vi' ? movieDetail.title : ''} ({movieDetail.original_title})
		</h1>
{/snippet}
<svelte:window bind:scrollY />
<div class="relative w-full h-fit sm:h-screen overflow-hidden">
	<div
		class="w-full h-full absolute bottom-0 bg-linear-to-t from-slate-950 to-transparent inset-x-0 z-10 pointer-events-none"
	></div>
	<div class="relative sm:absolute w-full h-fit sm:h-full inset-0">
		{@render btnPlay()}
		{@render bgImage()}
	</div>
	<div
		class="relative sm:absolute w-full h-fit sm:bottom-0 p-4 md:px-8 z-20 grid lg:grid-cols-3 md:grid-cols-1 gap-4 {isPlaying.value ? 'hidden': 'opacity-100'}"
	>
		{@render h1()}
		<div
			class="flex flex-col items-start justify-start lg:justify-end lg:items-center mt-10 lg:mt-0"
		>
			<div
				class="flex flex-wrap gap-2 items-start lg:flex md:items-center justify-between lg:justify-around w-full"
			>
				<p class="text-slate-400">
					{m.reuse_year()}: <span class="text-slate-200">{movieDetail.release_date?.slice(0, 4) ?? ''}</span>
				</p>
				<p class="text-slate-400">
					{m.reuse_runtime()}: <span class="text-slate-200">{movieDetail.runtime} {m.reuse_minutes()}</span>
				</p>
				<!-- <p class="text-slate-400">
					Trạng thái: <span class="text-slate-200">Hoàn thành</span>
				</p> -->
				<div class="flex items-center space-x-2 flex-wrap">
					{#if movieDetail.vote_average}
						<div class="flex items-center space-x-2 text-slate-200">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="icon icon-tabler icon-tabler-star-filled w-4 h-4"
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
							<p>{movieDetail.vote_average.toFixed(1)} / 10</p>
							<p>({movieDetail.vote_count.toLocaleString()} {m.reuse_vote_count()})</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
		<div class="group flex flex-col lg:justify-end relative">
			<!-- movie infor  -->
			<div
				class="lg:opacity-0 lg:translate-y-[5%] lg:group-hover:translate-y-0 lg:group-hover:opacity-100 transition-all duration-150 lg:max-h-[30vh] lg:overflow-y-scroll"
			>
				{#if movieDetail.overview}
					<p class="text-slate-400 pb-4 pt-2">
						{m.reuse_content()}: <span class="text-slate-200">{movieDetail.overview}</span>
					</p>
				{/if}
				<dl>
					<div class="grid grid-cols-10 gap-2">
						<dt class="text-slate-400 col-span-3">{m.reuse_countries()}:</dt>
						<dd class="text-slate-200 col-span-7 flex items-center space-x-2">
							{#each movieDetail.production_countries as country, i}
								<p>{country.name}{i < movieDetail.production_countries.length - 1 ? ', ' : ''}</p>
							{/each}
						</dd>
					</div>
					<div class="grid grid-cols-10 gap-2">
						<dt class="text-slate-400 col-span-3">{m.reuse_genres()}:</dt>
						<dd class="text-slate-200 col-span-7 flex items-center flex-wrap">
							{#each movieDetail.genres as genre, i}
								<p class="mr-2">{genre.name}{i < movieDetail.genres.length - 1 ? ', ' : ''}</p>
							{/each}
						</dd>
					</div>
					<div class="grid grid-cols-10 gap-2">
						<dt class="text-slate-400 col-span-3">{m.reuse_runtime()}:</dt>
						<dd class="text-slate-200 col-span-7 flex items-center flex-wrap">
							<p>{movieDetail.runtime} {m.reuse_minutes()}</p>
						</dd>
					</div>
					{#if movieDetail.release_date}
						<div class="grid grid-cols-10 gap-2">
							<dt class="text-slate-400 col-span-3">{m.reuse_year()}:</dt>
							<dd class="text-slate-200 col-span-7 flex items-center space-x-2">
								<p>{movieDetail.release_date?.slice(0, 4) ?? ''}</p>
							</dd>
						</div>
					{/if}
					{#if movieDetail.credits?.crew?.find((item: any) => item.job === 'Director')}
						<div class="grid grid-cols-10 gap-2">
							<dt class="text-slate-400 col-span-3">{m.reuse_directors()}:</dt>
							<dd class="text-slate-200 col-span-7 flex items-center space-x-2">
								<p>{movieDetail.credits?.crew?.find((item: any) => item.job === 'Director')?.name}</p>
							</dd>
						</div>
					{/if}
					{#if movieDetail.production_companies.length > 0}
						<div class="grid grid-cols-10 gap-2">
							<dt class="text-slate-400 col-span-3">{m.reuse_production_companies()}:</dt>
							<dd class="text-slate-200 col-span-7 flex items-center flex-wrap">
								{#each movieDetail.production_companies as production, i}
									<p class="mr-2">
										{production.name}{i < movieDetail.production_companies.length - 1 ? ', ' : ''}
									</p>
								{/each}
							</dd>
						</div>
					{/if}
					{#if movieDetail.budget && movieDetail.revenue}
						<div class="grid grid-cols-10 gap-2">
							<dt class="text-slate-400 col-span-3">{m.reuse_buget()}:</dt>
							<dd class="text-slate-200 col-span-7 flex items-center flex-wrap">
								<p>${movieDetail.budget.toLocaleString()}</p>
							</dd>
						</div>
						<div class="grid grid-cols-10 gap-2">
							<dt class="text-slate-400 col-span-3">{m.reuse_revenue()}:</dt>
							<dd class="text-slate-200 col-span-7 flex items-center flex-wrap">
								<p>${movieDetail.revenue.toLocaleString()}</p>
							</dd>
						</div>
					{/if}
					{#if movieDetail.credits?.cast && movieDetail.credits.cast.length > 0}
					<div class="grid grid-cols-10 gap-2 transition-all duration-200">
						<dt class="text-slate-400 col-span-3 mt-2">{m.reuse_actors()}:</dt>
						{#if !showAllActors}
							<dd
								class="text-slate-200 col-span-7 grid grid-cols-10 gap-4 mt-2 overflow-x-auto transition-all duration-200 scroll-smooth"
							>
								{#each movieDetail.credits.cast as cast, i}
									{#if i < 5}
										<CardActors {cast} />
									{/if}
								{/each}
								{#if movieDetail.credits.cast.length > 5}
									<button
										aria-label="Xem thêm"
										class="flex items-center -translate-y-1/4"
										onclick={(e) => {
											e.preventDefault();
											showAllActors = true;
										}}
										use:tooltip={{ text: `${m.reuse_show_more()}`, position: 'top' }}
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="icon icon-tabler icon-tabler-chevron-right h-7 w-7 bg-neutral-800 hover:text-neonPink-500 hover:bg-neutral-600 active:text-slate-300 active:bg-slate-800 rounded-full p-1 cursor-pointer transition duration-200"
											viewBox="0 0 24 24"
											stroke-width="2"
											stroke="currentColor"
											fill="none"
											stroke-linecap="round"
											stroke-linejoin="round"
										>
											<path stroke="none" d="M0 0h24v24H0z" fill="none" />
											<path d="M9 6l6 6l-6 6" />
										</svg>
									</button>
								{/if}
							</dd>
						{:else}
							<div
								class="flex items-center col-span-7 relative before:absolute before:left-0 before:top-0 before:z-2 before:h-full before:w-[100px] before:bg-[linear-gradient(to_right,black_0%,rgba(255,255,255,0)_100%)] before:content-[''] after:absolute after:right-0 after:top-0 after:z-2 after:h-full after:w-[100px] after:-scale-x-100 after:bg-[linear-gradient(to_right,black_0%,rgba(255,255,255,0)_100%)] after:content-['']"
							>
								<dd
									class="text-slate-200 grid grid-flow-col w-full overflow-x-auto scrollbar gap-4 mt-2 transition-all duration-200 scroll-smooth"
								>
									{#each movieDetail.credits.cast as cast}
										<CardActors {cast} />
									{/each}
								</dd>
								<button
									aria-label="Thu gọn"
									class="mt-2 absolute top-0 -right-10 flex items-center translate-y-1/2 transition-all duration-200"
									onclick={(e) => {
										e.preventDefault();
										showAllActors = false;
									}}
									use:tooltip={{ text: m.reuse_collapse(), position: 'top' }}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="icon icon-tabler icon-tabler-chevron-left h-7 w-7 text-slate-300 bg-neutral-800 hover:text-neonPink-500 hover:bg-neutral-600 active:text-slate-300 active:bg-slate-800 rounded-full p-1 cursor-pointer transition-all duration-200"
										viewBox="0 0 24 24"
										stroke-width="2"
										stroke="currentColor"
										fill="none"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<path stroke="none" d="M0 0h24v24H0z" fill="none" />
										<path d="M15 6l-6 6l6 6" />
									</svg>
								</button>
							</div>
						{/if}
					</div>
					{/if}
					{#if movieDetail.credits?.crew && movieDetail.credits.crew.length > 0}
					<div class="grid grid-cols-10 gap-2 transition-all duration-200">
						<dt class="text-slate-400 col-span-3 mt-2">{m.reuse_crews()}:</dt>
						{#if !showAllCrew}
							<dd
								class="text-slate-200 col-span-7 grid grid-cols-10 gap-4 mt-2 overflow-x-auto transition-all duration-[3s] scroll-smooth"
							>
								{#each movieDetail.credits.crew as crew, i}
									{#if i < 5}
										<CardActors cast={crew} />
									{/if}
								{/each}
								{#if movieDetail.credits.crew.length > 5}
									<button
										aria-label="Xem thêm"
										class="flex items-center -translate-y-1/4"
										onclick={(e) => {
											e.preventDefault();
											showAllCrew = true;
										}}
										use:tooltip={{ text: m.reuse_show_more(), position: 'top' }}
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="icon icon-tabler icon-tabler-chevron-right h-7 w-7 bg-neutral-800 hover:text-neonPink-500 hover:bg-neutral-600 active:text-slate-300 active:bg-slate-800 rounded-full p-1 cursor-pointer transition duration-200"
											viewBox="0 0 24 24"
											stroke-width="2"
											stroke="currentColor"
											fill="none"
											stroke-linecap="round"
											stroke-linejoin="round"
										>
											<path stroke="none" d="M0 0h24v24H0z" fill="none" />
											<path d="M9 6l6 6l-6 6" />
										</svg>
									</button>
								{/if}
							</dd>
						{:else}
							<div
								class="flex items-center col-span-7 relative before:absolute before:left-0 before:top-0 before:z-2 before:h-full before:w-[100px] before:bg-[linear-gradient(to_right,black_0%,rgba(255,255,255,0)_100%)] before:content-[''] after:absolute after:right-0 after:top-0 after:z-2 after:h-full after:w-[100px] after:-scale-x-100 after:bg-[linear-gradient(to_right,black_0%,rgba(255,255,255,0)_100%)] after:content-['']"
							>
								<dd
									class="text-slate-200 grid grid-flow-col w-full overflow-x-auto scrollbar gap-4 mt-2 transition-all duration-200 scroll-smooth"
								>
									{#each movieDetail.credits.crew as crew}
										<CardActors cast={crew} />
									{/each}
								</dd>
								<button
									aria-label="Thu gọn"
									class="mt-2 absolute top-0 -right-10 flex items-center translate-y-1/2 transition-all duration-200"
									onclick={(e) => {
										e.preventDefault();
										showAllCrew = false;
									}}
									use:tooltip={{ text: m.reuse_collapse(), position: 'top' }}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="icon icon-tabler icon-tabler-chevron-left h-7 w-7 text-slate-300 bg-neutral-800 hover:text-neonPink-500 hover:bg-neutral-600 active:text-slate-300 active:bg-slate-800 rounded-full p-1 cursor-pointer transition-all duration-200"
										viewBox="0 0 24 24"
										stroke-width="2"
										stroke="currentColor"
										fill="none"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<path stroke="none" d="M0 0h24v24H0z" fill="none" />
										<path d="M15 6l-6 6l6 6" />
									</svg>
								</button>
							</div>
						{/if}
					</div>
					{/if}
				</dl>
			</div>
			<p
				class="text-slate-200 opacity-0 lg:opacity-100 group-hover:opacity-0 lg:group-hover:translate-x-3 transition-all duration-150"
			>
				{m.tmdbPage_movieContent()} ⇀
			</p>
			<!-- end movie infor -->
			
			<div class="mt-4 mb-4">
				<StarRating
					movieId={movieDetail.id}
					user={page.data.user}
					initialScore={page.data.rating?.userScore ?? 0}
					avgScore={page.data.rating?.avgScore ?? 0}
					totalRatings={page.data.rating?.totalRatings ?? 0}
				/>
			</div>

			<div class="flex flex-wrap gap-3 mt-4">
				{#if myListMoviesStore.value}
					<button
						aria-label="Lưu yêu thích"
						class="opacity-100 transition duration-200 ease-in-out px-4 py-2 bg-white/20 backdrop-blur-xs hover:bg-slate-900/40 rounded-full flex items-center cursor-pointer"
						use:tooltip={{
							text: `${movieListed ? m.reuse_remove_favorite() : m.reuse_save_favorite()}`,
							position: 'top-right'
						}}
						onclick={async (e) => {
							movieSource;
							e.preventDefault();
							await moviesHandler.updateMyListMovies(movieDetail, 'tmdb');
						}}
					>
						{#if movieListed}
							<IconUserMinus class="w-6 h-6 text-neonPink-500 cursor-pointer mr-2" />
							<p class="text-slate-200">{m.reuse_remove_favorite()}</p>
						{:else}
							<IconPlus class="w-6 h-6 text-gray-200 cursor-pointer mr-2" />
							<p class="text-slate-200">{m.reuse_save_favorite()}</p>
						{/if}
					</button>
				{/if}

				<button
					aria-label="Thêm vào danh sách phát"
					class="opacity-100 transition duration-200 ease-in-out px-4 py-2 bg-white/20 backdrop-blur-xs hover:bg-slate-900/40 rounded-full flex items-center cursor-pointer"
					use:tooltip={{
						text: m.playlist_add_movie(),
						position: 'top-right'
					}}
					onclick={(e) => {
						e.preventDefault();
						if (!page.data.user) {
							showLoginModal = true;
						} else {
							showPlaylistModal = true;
						}
					}}
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-gray-200 cursor-pointer mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
					</svg>
					<p class="text-slate-200">{m.playlist_add_movie()}</p>
				</button>
			</div>
		</div>
	</div>
</div>

<LoginModal bind:open={showLoginModal} />
{#if page.data.user}
	<AddToPlaylistModal
		bind:open={showPlaylistModal}
		movieId={movieDetail.id}
		title={movieDetail.title || movieDetail.original_title}
		posterPath={movieDetail.poster_path}
		isTv={false}
	/>
{/if}
<section
	class="relative w-full h-fit bg-gradient-to-b from-slate-950 to-transparent overflow-hidden pb-24 md:pb-10"
>
	<SectionMovieRelate
		movieSource="tmdb"
		slug={movieDetail.id.toString()}
		currentMovieName={getLocale() === 'vi' ? movieDetail.title : movieDetail.original_title}
	/>
</section>
