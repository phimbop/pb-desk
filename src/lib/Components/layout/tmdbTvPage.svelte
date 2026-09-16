<script lang="ts">
	import { page } from '$app/state';
	import '$lib/css/carousel.css';
	import {
		clickAdslink,
		DOMAIN_TMDB_IMAGE_CDN,
		DOMAIN_TMDB_IMAGE_ORIGINAL,
		openExternalUrl,
		websiteUrl
	} from '$lib';
	import { serializeSchema } from '$lib/helper/security';
	import IconPlus from '$lib/Components/Icon/IconPlus.svelte';
	import IconUserMinus from '$lib/Components/Icon/IconUserMinus.svelte';
	import Play from '$lib/Components/Icon/Play.svelte';
	import Seo from '$lib/Components/SEO/Seo.svelte';
	import tooltip from '$lib/helper/tooltip';
	import {
		isPlaying,
		moviesHandler,
		myListMoviesStore,
		sidebarOpen
	} from '$lib/runes/movieStore.svelte';
	import CardActors from '$lib/Components/Card/CardActors.svelte';
	import CardVideoPlay from '$lib/Components/Card/CardVideoPlay.svelte';
	import LoadingImage from '$lib/Components/Image/LoadingImage.svelte';
	import Image from '$lib/Components/Image/Image.svelte';
	import SectionMovieRelate from '$lib/Components/Section/SectionMovieRelate.svelte';
	import Select from '$lib/Components/Select/Select.svelte';
	import SelectItem from '$lib/Components/Select/SelectItem.svelte';
	import { tmdbTvSeasonNumber, tmdbTvStore } from '$lib/runes/tmdbTv.svelte';
	import { onMount } from 'svelte';
	import ButtonPrimary from '../Button/ButtonPrimary.svelte';
	import IconArrowRight from '../Icon/IconArrowRight.svelte';
	import IconArrowLeft from '../Icon/IconArrowLeft.svelte';
	import type { TvSeriesDetail } from '../../../types/Tmdb';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import LoginModal from '../Auth/LoginModal.svelte';
	import AddToPlaylistModal from '../Playlist/AddToPlaylistModal.svelte';
	import StarRating from '$lib/Components/Rating/StarRating.svelte';

	interface Props {
		tvDetail: TvSeriesDetail;
		watchPercent?: number;
		currentEpisode?: string | number;
		movieSource: movieResource;
	}
	let { tvDetail = $bindable(), currentEpisode = $bindable(), movieSource }: Props = $props();
	let scrollY = $state(0);
	let showAllActors = $state(false);
	let showAllCrew = $state(false);
	let seclectedSeason = $derived(m.reuse_season() + ' ' + tmdbTvSeasonNumber.value);
	$effect(() => {
		if (tvDetail) {
			isPlaying.value = false;
		}
	});
	let showSlideDetail = $state(false);
	let showMovieInfor = $state(false);
	let showPlaylistModal = $state(false);
	let showLoginModal = $state(false);
	let carouselEl = $state<HTMLDivElement>();
	let listEl = $state<HTMLDivElement>();
	let nextBtn = $state<HTMLButtonElement>();
	let prevBtn = $state<HTMLButtonElement>();
	let randomkey = $state(0);
	let movieListed = $derived(
		myListMoviesStore.value.some((item) => 
			(item.id && tvDetail.id && item.id == tvDetail.id) ||
			(item.slug && (tvDetail as any).slug && item.slug === (tvDetail as any).slug)
		)
	);
	// $inspect('tmdbTvStore: ', tmdbTvStore.value);
	// $inspect('myListMoviesStore value: ', myListMoviesStore.value);
	const showSlideDetailFunc = () => {
		if (!showSlideDetail) {
			carouselEl?.classList.remove('showDetail');
		} else {
			carouselEl?.classList.remove('next', 'prev');
			carouselEl?.classList.add('showDetail');
		}
	};
	/* 1. Khai báo timer dạng number (browser) hoặc ReturnType<typeof setTimeout> */
	let unblockTimer: ReturnType<typeof setTimeout> | null = null;

	/* 2. Dọn sạch khi destroy (gọi trong onMount return) */
	export const cleanupCarousel = () => {
		if (unblockTimer) {
			clearTimeout(unblockTimer);
			unblockTimer = null;
		}
		unblock(); // restore pointer-events
	};

	/* 3. Unblock – idempotent */
	const unblock = () => {
		if (nextBtn) nextBtn.style.pointerEvents = 'auto';
		if (prevBtn) prevBtn.style.pointerEvents = 'auto';
		/* không set null ở đây nữa, để cleanupTimer quản lý */
	};

	/* 4. Block – always cancel previous */
	const block = () => {
		if (unblockTimer) clearTimeout(unblockTimer);

		if (nextBtn) nextBtn.style.pointerEvents = 'none';
		if (prevBtn) prevBtn.style.pointerEvents = 'none';

		unblockTimer = setTimeout(() => {
			unblock();
			unblockTimer = null;
		}, 700);
	};
	/* 5. Các hàm xử lý slide (giữ nguyên logic, thêm guard) */
	const showSlider = (type: 'next' | 'prev') => {
		if (!listEl || !carouselEl) return;
		block();
		carouselEl.classList.remove('next', 'prev');

		const items = Array.from(listEl.children) as HTMLElement[];
		if (!items.length) return;

		if (type === 'next') {
			listEl.appendChild(items[0]);
			carouselEl.classList.add('next');
		} else {
			listEl.prepend(items[items.length - 1]);
			carouselEl.classList.add('prev');
		}
		// console.log('🚀 ~ showSlider : run');
		const season = (listEl.children[1] as HTMLElement).dataset.season!;
		updateSeasonNumber(parseInt(season));
	};

	const selectSlide = (season: number, writeStore = true) => {
		if (!listEl || !carouselEl) return;
		const items = Array.from(listEl.children) as HTMLElement[];
		if (!items.length) return;

		const targetIdx = items.findIndex((li) => Number(li.dataset.season) === season);
		if (targetIdx === -1) return;

		const diff = targetIdx - 1; // active luôn ở 1
		if (diff === 0) {
			updateSeasonNumber(season, writeStore);
			return; // đang ở đúng vị trí
		}

		block();
		carouselEl.classList.remove('next', 'prev');

		if (diff > 0) {
			for (let i = 0; i < diff; i++) listEl.appendChild(items[i]);
			carouselEl.classList.add('next');
		} else {
			for (let i = 0; i < -diff; i++) listEl.prepend(items[items.length - 1 - i]);
			carouselEl.classList.add('prev');
		}
		// console.log('🚀 ~ selectSlide : run');
		updateSeasonNumber(season, writeStore);
	};

	const updateSeasonNumber = (seasonNumber: number, writeStore = true) => {
		tmdbTvSeasonNumber.value = seasonNumber.toString();
		if (!writeStore) return;

		const idx = tmdbTvStore.value.findIndex((i) => i.tvId === tvDetail.id);
		if (idx !== -1) {
			// clone phần tử & gán lại array
			tmdbTvStore.value = tmdbTvStore.value.with(idx, {
				...tmdbTvStore.value[idx],
				currentSeason: seasonNumber
			});
		} else {
			tmdbTvStore.value = [
				...tmdbTvStore.value,
				{ tvId: tvDetail.id, currentSeason: seasonNumber, tvSeriesDetail: tvDetail }
			];
		}
	};
	onMount(async () => {
		randomkey = Math.floor(
			Math.random() * (tvDetail.images?.logos?.length || 0)
		);
		return cleanupCarousel();
	});
	/* ---------- init season ---------- */
	// chỉ chạy 1 lần khi có tvDetail
	$effect(() => {
		if (!tvDetail.id) return;
		isPlaying.value = false;
		// console.log('🚀 ~ effect run: ');
		const stored = tmdbTvStore.value.find((i) => i.tvId == tvDetail.id);
		if (stored) {
			// console.log('🚀 ~ effect run: stored');
			selectSlide(parseInt(stored.currentSeason), false);
		} else {
			// console.log('🚀 ~ effect run: not stored');
			selectSlide(tvDetail.seasons[0].season_number, false);
		}
	});
	$effect(() => {
		if (tvDetail) {
			showSlideDetail = false;
		}
	});
</script>

<svelte:window bind:scrollY />
<Seo
	title={tvDetail.name +
		' | ' +
		tvDetail.original_name +
		' (' +
		tvDetail.first_air_date.slice(0, 4) +
		') 4K FULL HD 1080p Vietsub Online miễn phí'}
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
		'@type': 'TVSeries',
		numberOfSeasons: tvDetail.seasons?.length,
		numberOfEpisodes: tvDetail.number_of_episodes || undefined,
		actor: tvDetail.credits?.cast ? tvDetail.credits.cast.map((cast: any) => {
			return {
				'@type': 'Person',
				name: cast.name
			};
		}) : [],
		aggregateRating: {
			'@type': 'AggregateRating',
			bestRating: '10',
			ratingCount: tvDetail.vote_count > 0 ? tvDetail.vote_count : 1,
			ratingValue: tvDetail.vote_average.toFixed(1) ?? 1,
			worstRating: '0'
		},
		description: tvDetail.overview,
		director: {
			'@type': 'Person',
			name: tvDetail.credits?.crew?.find((item: any) => item.job === 'Director')?.name
		},
		name:
			tvDetail.name + ' | ' + tvDetail.original_name + ' ' + tvDetail.first_air_date.slice(0, 4),
		image: `${DOMAIN_TMDB_IMAGE_CDN}/t/p/original${tvDetail.poster_path}`,
		url: `${page.url}`,
		dateCreated: tvDetail.first_air_date ?? '',
		sameAs: [
			tvDetail.id ? `https://www.themoviedb.org/tv/${tvDetail.id}` : '',
			tvDetail.external_ids?.imdb_id ? `https://www.imdb.com/title/${tvDetail.external_ids.imdb_id}` : '',
			tvDetail.external_ids?.wikidata_id ? `https://www.wikidata.org/wiki/${tvDetail.external_ids.wikidata_id}` : ''
		].filter(Boolean)
	}}
>
	{#if tvDetail.credits?.cast}
		{#each tvDetail.credits.cast as cast}
			<meta property="video:actor" content={cast.name} />
		{/each}
	{/if}
	<meta
		property="video:director"
		content={tvDetail.credits?.crew?.find((item: any) => item.job === 'Director')?.name}
	/>
	<meta property="video:release_date" content={tvDetail.first_air_date} />
	{#each tvDetail.genres as tag}
		<meta property="video:tag" content={tag.name} />
	{/each}
	{@html serializeSchema({
		 "@context": "https://schema.org",
		 "@type": "BreadcrumbList",
		 "itemListElement": [{
		   "@type": "ListItem",
		   "position": 1,
		   "name": "TV Series",
		   "item": `${websiteUrl}/tv`
		 },{
		   "@type": "ListItem",
		   "position": 2,
		   "name": tvDetail.name,
		   "item": `${page.url}`
		 }]
	})}
</Seo>
{#snippet btnPlay()}
	{#if !isPlaying.value}
		<a
			href="#play"
			onclick={async (e) => {
				e.preventDefault();
				openExternalUrl(clickAdslink);
				isPlaying.value = true;
				// await updatePlayedList();
				window.location.href = `${page.url.pathname}/season-1/tap-1`;
			}}
			aria-label={isPlaying.value ? 'Pause' : 'Play'}
		>
			<Play />
		</a>
	{/if}
{/snippet}
{#snippet bgImage()}
	{#if tvDetail.backdrop_path && !isPlaying.value}
		<div
			class="relative sm:inset-0 w-full h-80 sm:h-screen overflow-hidden"
			style="
	transform: translateY({scrollY * 0.8}px);
	will-change: transform;"
		>
			<Image
				src="{DOMAIN_TMDB_IMAGE_ORIGINAL}{tvDetail.backdrop_path}"
				alt={tvDetail.name}
				isCritical={true}
				class="w-full h-full object-cover"
			/>
		</div>
	{:else if tvDetail.id && isPlaying.value}
		<div class="relative z-10 w-full h-fit min-h-[300px] md:w-screen md:h-screen">
			<div class="absolute top-0 left-0 w-full z-50 h-8 bg-black"></div>
			<CardVideoPlay tmdbId={tvDetail.id} season={1} episode={1} />
		</div>
	{:else}
		<LoadingImage />
	{/if}
{/snippet}
{#snippet h1()}
	<div class="flex items-start justify-end flex-col">
		{#key tmdbTvSeasonNumber.value}
			<div class="flex items-center space-x-3 mb-4">
				<p
					class="text-neonPink-500 opacity-0 text-xl animate-show-content delay-200 {isPlaying.value
						? 'md:opacity-0'
						: ''}"
				>
					{m.reuse_season()}
					{tmdbTvSeasonNumber.value}
				</p>
			</div>
		{/key}
		<h1
			class="animate-show-content font-semibold text-3xl lg:text-6xl text-slate-200 max-w-[320px] lg:max-w-full {isPlaying.value
				? 'md:opacity-0'
				: 'opacity-100'}"
		>
			{getLocale() === 'vi' ? tvDetail.name : ''} ({tvDetail.original_name})
		</h1>
	</div>
{/snippet}
{#snippet Carousel()}
	{#key tvDetail}
		<div bind:this={carouselEl} class="carousel">
			<div bind:this={listEl} class="list">
				{#each tvDetail.seasons as season}
					<div class="item" data-season={season.season_number}>
						<div
							class="img-wrapper relative after:absolute after:inset-0 overflow-hidden"
							style="mask-image: radial-gradient(ellipse 45% 40% at center, black 0%, transparent 120%); -webkit-mask-image: radial-gradient(ellipse 35% 40% at center, white 0%, transparent 120%);"
						>
							<img
								src={season.poster_path
									? `${DOMAIN_TMDB_IMAGE_CDN}/t/p/original${season.poster_path}`
									: ''}
								alt={season.name}
							/>
						</div>
						<div class="introduce">
							{#if tvDetail.images?.logos?.[randomkey]}
								<img
									src="{DOMAIN_TMDB_IMAGE_CDN}/t/p/w300{tvDetail.images.logos[randomkey].file_path}"
									alt={tvDetail.name}
									class="title w-96 my-2 object-cover justify-end"
								/>
							{/if}
							<div class="topic text-slate-200 hidden">{tvDetail.name}</div>
							<div class="des text-white hidden">
								{season.overview ? season.overview : null}
							</div>
							<!-- <button
							class="seeMore text-slate-200 cursor-pointer hover:text-neonPink-500 transition-colors duration-150 ease-in-out"
							>Chi tiết &#8599</button
						> -->
						</div>
						<div class="detail lg:max-h-[30vh] lg:overflow-y-scroll scrollbar">
							{#if tvDetail.images?.logos?.[randomkey]}
								<img
									src="{DOMAIN_TMDB_IMAGE_CDN}/t/p/w300{tvDetail.images.logos[randomkey].file_path}"
									alt={tvDetail.name}
									class="w-96 my-2 object-cover title mr-0, ml-auto"
								/>
							{/if}
							<div class="des text-slate-200">
								{season.overview ? season.overview : tvDetail.overview}
							</div>
							<div class="specifications text-slate-200 justify-end">
								<div>
									<p>{m.reuse_air_day()}</p>
									<p>{new Date(season.air_date).toLocaleDateString('vi-VN')}</p>
								</div>
								<div>
									<p>{m.reuse_season()}</p>
									<p id="seasonDetail">{season.season_number}</p>
								</div>
								<div>
									<p>{m.reuse_episodes()}</p>
									<p>{season.episode_count}</p>
								</div>
								<div>
									<p>{m.reuse_vote_average()}</p>
									<p>{season.vote_average}</p>
								</div>
							</div>
							<div class="">
								<ButtonPrimary
									onclick={(e: any) => {
										e.preventDefault();
										openExternalUrl(clickAdslink);
										isPlaying.value = true;
										// await updatePlayedList();
										window.location.href = `${page.url.pathname}/season-${season.season_number}/tap-1`;
									}}
									class="cursor-pointer py-3 px-10 mt-10 z-[999999]"
									>{m.reuse_watch()}</ButtonPrimary
								>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/key}
{/snippet}
<div class="relative w-full h-fit sm:h-screen overflow-hidden flex flex-col justify-end">
	<div
		class="w-full h-full absolute bg-[linear-gradient(40deg,#0f172a_24.16%,rgba(6,10,23,0)_56.61%),linear-gradient(0deg,#0f172a_3.91%,rgba(6,10,23,0)_69.26%)] inset-x-0 z-10 pointer-events-none"
	></div>
	<div class="relative sm:absolute sm:bottom-0 w-full h-fit sm:h-full inset-0">
		{#if tvDetail.seasons.length > 1}
			{@render Carousel()}
		{:else}
			{@render btnPlay()}
			{@render bgImage()}
		{/if}
	</div>
	<div
		class="relative w-full h-fit sm:bottom-0 p-4 md:px-8 z-20 grid lg:grid-cols-3 md:grid-cols-1 gap-4 {isPlaying.value
			? 'hidden'
			: 'opacity-100'}"
	>
		{@render h1()}
		<div
			class="flex flex-col items-start justify-start lg:justify-end lg:items-center mt-10 lg:mt-0"
		>
			<div
				class="flex flex-wrap gap-2 items-start lg:flex md:items-center justify-between lg:justify-center w-full"
			>
				<div class="text-slate-400 flex items-center">
					{#key tvDetail}
						<Select bind:value={seclectedSeason} class="border-none lg:min-w-30">
							{#snippet children({ close })}
								{#each tvDetail.seasons as item}
									<SelectItem
										class={tmdbTvSeasonNumber.value === item.season_number.toString()
											? 'bg-neutral-900 text-neonPink-500'
											: ''}
										value={item.season_number}
										{close}
										onclick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											selectSlide(item.season_number);
											sidebarOpen.value = true;
										}}
									>
										{m.reuse_season()}
										{item.season_number}
									</SelectItem>
								{/each}
							{/snippet}
						</Select>
					{/key}
				</div>
				<div
					class="grid grid-flow-col items-center gap-2 {tvDetail.seasons.length > 1
						? ''
						: 'hidden'}"
				>
					<button
						onclick={() => {
							showSlider('prev');
						}}
						bind:this={prevBtn}
						id="prev"
						class="text-slate-400 flex justify-center items-center px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 opacity-100 transition duration-150 ease-in-out bg-white/20 backdrop-blur-xs hover:bg-slate-900/40 rounded-full cursor-pointer min-w-20"
					>
						<IconArrowLeft />
					</button>
					<button
						onclick={() => {
							showSlideDetail = !showSlideDetail;
							showSlideDetailFunc();
						}}
						id="back-none"
						class="text-slate-400 flex justify-center items-center px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 opacity-100 transition duration-150 ease-in-out bg-white/20 backdrop-blur-xs hover:bg-slate-900/40 rounded-full cursor-pointer min-w-20"
						>{showSlideDetail ? m.reuse_list() : m.reuse_detail()}</button
					>
					<button
						onclick={() => {
							showSlider('next');
						}}
						bind:this={nextBtn}
						id="next"
						class="text-slate-400 flex justify-center items-center px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 opacity-100 transition duration-150 ease-in-out bg-white/20 backdrop-blur-xs hover:bg-slate-900/40 rounded-full cursor-pointer min-w-20"
						><IconArrowRight />
					</button>
				</div>
			</div>
		</div>
		<div
			onmouseleave={() => {
				showMovieInfor = false;
			}}
			class=" flex flex-col lg:justify-end relative"
		>
			<!-- movie infor  -->
			<div
				class="lg:opacity-0 lg:translate-y-[5%] {showMovieInfor
					? 'lg:translate-y-0 lg:opacity-100'
					: ''} transition-all duration-150 lg:max-h-[30vh] lg:overflow-y-scroll"
			>
				{#if tvDetail.overview}
					<p class="text-slate-400 pb-4 pt-2">
						{m.reuse_overview()}: <span class="text-slate-200">{tvDetail.overview}</span>
					</p>
				{/if}
				<div
					class="flex flex-col items-center-safe gap-2 mt-4 lg:mt-0 lg:flex-row lg:items-start lg:gap-0"
				></div>
				<dl>
					<div class="grid grid-cols-10 gap-2">
						<dt class="text-slate-400 col-span-3">{m.reuse_countries()}:</dt>
						<dd class="text-slate-200 col-span-7 flex items-center space-x-2">
							{#each tvDetail.production_countries as country, i}
								<p>{country.name}{i < tvDetail.production_countries.length - 1 ? ', ' : ''}</p>
							{/each}
						</dd>
					</div>
					<div class="grid grid-cols-10 gap-2">
						<dt class="text-slate-400 col-span-3">{m.reuse_genres()}:</dt>
						<dd class="text-slate-200 col-span-7 flex items-center flex-wrap">
							{#each tvDetail.genres as genre, i}
								<p class="mr-2">{genre.name}{i < tvDetail.genres.length - 1 ? ', ' : ''}</p>
							{/each}
						</dd>
					</div>
					{#if tvDetail.networks.length > 0}
						<div class="grid grid-cols-10 gap-2">
							<dt class="text-slate-400 col-span-3">{m.reuse_networks()}:</dt>
							<dd class="text-slate-200 col-span-7 flex items-center flex-wrap">
								{#each tvDetail.networks as network, i}
									<p class="mr-2">{network.name}{i < tvDetail.networks.length - 1 ? ', ' : ''}</p>
								{/each}
							</dd>
						</div>
					{/if}
					{#if tvDetail.first_air_date}
						<div class="grid grid-cols-10 gap-2">
							<dt class="text-slate-400 col-span-3">{m.reuse_year()}:</dt>
							<dd class="text-slate-200 col-span-7 flex items-center space-x-2">
								<p>{tvDetail.first_air_date.slice(0, 4)}</p>
							</dd>
						</div>
					{/if}
					{#if tvDetail.credits?.crew?.find((item: any) => item.job === 'Director')}
						<div class="grid grid-cols-10 gap-2">
							<dt class="text-slate-400 col-span-3">{m.reuse_directors()}:</dt>
							<dd class="text-slate-200 col-span-7 flex items-center space-x-2">
								<p>{tvDetail.credits.crew.find((item: any) => item.job === 'Director')?.name}</p>
							</dd>
						</div>
					{/if}
					{#if tvDetail.production_companies.length > 0}
						<div class="grid grid-cols-10 gap-2">
							<dt class="text-slate-400 col-span-3">{m.reuse_production_companies()}:</dt>
							<dd class="text-slate-200 col-span-7 flex items-center flex-wrap">
								{#each tvDetail.production_companies as production, i}
									<p class="mr-2">
										{production.name}{i < tvDetail.production_companies.length - 1 ? ', ' : ''}
									</p>
								{/each}
							</dd>
						</div>
					{/if}

					{#if tvDetail.credits?.cast && tvDetail.credits.cast.length > 0}
						<div class="grid grid-cols-10 gap-2 transition-all duration-200">
							<dt class="text-slate-400 col-span-3 mt-2">{m.reuse_actors()}:</dt>
							{#if !showAllActors}
							<dd
								class="text-slate-200 col-span-7 grid grid-cols-10 gap-4 mt-2 overflow-x-auto transition-all duration-200 scroll-smooth"
							>
								{#each tvDetail.credits.cast as cast, i}
									{#if i < 5}
										<CardActors {cast} />
									{/if}
								{/each}
								{#if tvDetail.credits.cast.length > 5}
									<button
										aria-label="Xem thêm"
										class="flex items-center -translate-y-1/4"
										onclick={(e) => {
											e.preventDefault();
											showAllActors = true;
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
									{#each tvDetail.credits.cast as cast}
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
					{#if tvDetail.credits?.crew && tvDetail.credits.crew.length > 0}
					<div class="grid grid-cols-10 gap-2 transition-all duration-200">
						<dt class="text-slate-400 col-span-3 mt-2">{m.reuse_crews()}:</dt>
						{#if !showAllCrew}
							<dd
								class="text-slate-200 col-span-7 grid grid-cols-10 gap-4 mt-2 overflow-x-auto transition-all duration-[3s] scroll-smooth"
							>
								{#each tvDetail.credits.crew as crew, i}
									{#if i < 5}
										<CardActors cast={crew} />
									{/if}
								{/each}
								{#if tvDetail.credits.crew.length > 5}
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
									{#each tvDetail.credits.crew as crew}
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
				onmouseenter={() => {
					showMovieInfor = true;
				}}
				class="text-slate-200 opacity-0 {showMovieInfor
					? 'lg:opacity-0 lg:translate-x-3'
					: 'lg:opacity-100 cursor-pointer'} transition-all duration-150 pt-4"
			>
				{m.reuse_content()} ⇀
			</p>
			<!-- end movie infor -->
			
			<div class="mt-4 mb-4">
				<StarRating
					movieId={tvDetail.id}
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
							await moviesHandler.updateMyListMovies(tvDetail, 'tmdbTv');
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
<section
	class="relative w-full h-fit bg-gradient-to-b from-slate-900 to-transparent overflow-hidden pb-24 md:pb-10"
>
	<SectionMovieRelate
		movieSource="tmdbTv"
		slug={tvDetail.id.toString()}
		currentMovieName={tvDetail.name}
	/>
</section>

<LoginModal bind:open={showLoginModal} />
{#if page.data.user}
	<AddToPlaylistModal
		bind:open={showPlaylistModal}
		movieId={tvDetail.id}
		title={tvDetail.name || tvDetail.original_name}
		posterPath={tvDetail.poster_path}
		isTv={true}
	/>
{/if}
