<script lang="ts">
	import { serializeSchema } from '$lib/helper/security';
	import { page } from '$app/state';
	import {
		moviesNewAddStore,
		myListMoviesStore,
		playedListStore,
		tmdbFilterMoviesStore
	} from '$lib/runes/movieStore.svelte';
	import CardMovieFeature from '$lib/Components/Card/CardMovieFeature.svelte';
	import MarqueeSlider from '$lib/Components/Slider/MarqueeSlider.svelte';
	import { getKKImageUrl, networkProviders, websiteUrl } from '$lib';
	import TabMoiThem from '$lib/Components/Menu/TabMoiThem.svelte';
	import CardkkPhimLe from '$lib/Components/Card/CardkkPhimLe.svelte';
	import CardMovieFilter from '$lib/Components/Card/CardMovieFilter.svelte';
	import CardMyMoviesList from '$lib/Components/Card/CardMyMoviesList.svelte';
	import TabThongKe from '$lib/Components/Menu/TabThongKe.svelte';
	import Seo from '$lib/Components/SEO/Seo.svelte';
	import { sortPlayedList } from '$lib/helper/sortListPlayedMovie';
	import { lazyLoad } from '$lib/helper/lazyload';
	import SectionMovieTopic from '$lib/Components/Section/SectionMovieTopic.svelte';
	import Footer from '$lib/Components/Footer.svelte';
	import SectionBanner from '$lib/Components/Section/SectionBanner.svelte';
	import { onMount } from 'svelte';
	import { m } from '$lib/paraglide/messages';

	const kkPhimLeItems = $derived(page.data.KkPhimle?.data?.items ?? []);
	const kkPhimBoItems = $derived(page.data.kkPhimbo?.data?.items ?? []);
	const popularActorsResults = $derived(page.data.popularActors?.results ?? []);
	const tmdbPopularResults = $derived(page.data.tmdbPopular?.results ?? []);
	const sortedPlayedList = $derived(sortPlayedList(playedListStore.value));
	let loadTabThongKe = $state(false);
	let loadPopularActor = $state(false);
	let loadKkPhimLe = $state(false);
	let loadKkPhimBo = $state(false);

	// Thêm topic mới = thêm 1 dòng vào mảng này. Không cần sửa endpoint/component.
	const topicSections = [
		{ title: m.sectionmovietopic_cung_dau(), topic: 'cung-dau' },
		{ title: m.sectionmovietopic_tltp(), topic: 'tltp' },
		{ title: m.sectionmovietopic_chua_lanh(), topic: 'chua-lanh' },
		{ title: m.sectionmovietopic_thanh_xuan(), topic: 'thanh-xuan' },
		{ title: m.sectionmovietopic_gia_dinh(), topic: 'gia-dinh' }
	];
	let topicsLoaded = $state(false);
	let topicMovies = $state<Record<string, any[]>>({});

	const loadTopicSections = async () => {
		try {
			const topicMap: Record<string, string> = {
				'cung-dau': 'co-trang',
				'tltp': 'tai-lieu',
				'chua-lanh': 'tam-ly',
				'thanh-xuan': 'hoc-duong',
				'gia-dinh': 'gia-dinh'
			};
			const results = await Promise.all(
				topicSections.map(async (s) => {
					const cat = topicMap[s.topic] || s.topic;
					try {
						const res = await fetch(`https://phimapi.com/v1/api/the-loai/${cat}?page=1&limit=8`);
						const data = await res.json();
						const items = data.data?.items || [];
						return { topic: s.topic, movies: items.map((m: any) => ({ movie: m })) };
					} catch {
						return { topic: s.topic, movies: [] };
					}
				})
			);
			const mapping: Record<string, any[]> = {};
			for (const r of results) {
				mapping[r.topic] = r.movies;
			}
			topicMovies = mapping;
		} catch (error) {
			console.error(error);
			topicMovies = {};
		} finally {
			topicsLoaded = true;
		}
	};

	const schema = {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		'@id': `${websiteUrl}/#organization`,
		name: 'PHIMBOP',
		url: websiteUrl,
		logo: `${websiteUrl}/favicon.ico`,
		email: 'phimbop@duck.com',
		sameAs: ['https://t.me/phimbop_group', 'https://x.com/phimbop_xyz']
	};

	const kkMovieGenres = [
		{ _id: '9822be111d2ccc29c7172c78b8af8ff5', name: m.kkMovieGenres_action(), slug: 'hanh-dong' },
		{ _id: 'bb2b4b030608ca5984c8dd0770f5b40b', name: m.kkMovieGenres_romance(), slug: 'tinh-cam' },
		{ _id: 'ba6fd52e5a3aca80eaaf1a3b50a182db', name: m.kkMovieGenres_comedy(), slug: 'hai-huoc' },
		{ _id: '3a17c7283b71fa84e5a8d76fb790ed3e', name: m.kkMovieGenres_period(), slug: 'co-trang' },
		{
			_id: 'a7b065b92ad356387ef2e075dee66529',
			name: m.kkMovieGenres_psychological(),
			slug: 'tam-ly'
		},
		{ _id: '7a035ac0b37f5854f0f6979260899c90', name: m.kkMovieGenres_crime(), slug: 'hinh-su' },
		{ _id: '1bae5183d681b7649f9bf349177f7123', name: m.kkMovieGenres_war(), slug: 'chien-tranh' },
		{ _id: '591bbb2abfe03f5aa13c08f16dfb69a2', name: m.kkMovieGenres_sport(), slug: 'the-thao' },
		{
			_id: '578f80eb493b08d175c7a0c29687cbdf',
			name: m.kkMovieGenres_martialArts(),
			slug: 'vo-thuat'
		},
		{ _id: '68564911f00849030f9c9c144ea1b931', name: m.kkMovieGenres_scifi(), slug: 'vien-tuong' },
		{
			_id: '66c78b23908113d478d8d85390a244b4',
			name: m.kkMovieGenres_adventure(),
			slug: 'phieu-luu'
		},
		{ _id: '0bcf4077916678de9b48c89221fcf8ae', name: m.kkMovieGenres_science(), slug: 'khoa-hoc' },
		{ _id: '4db8d7d4b9873981e3eeb76d02997d58', name: m.kkMovieGenres_horror(), slug: 'kinh-di' },
		{ _id: '252e74b4c832ddb4233d7499f5ed122e', name: m.kkMovieGenres_music(), slug: 'am-nhac' },
		{
			_id: '2276b29204c46f75064735477890afd6',
			name: m.kkMovieGenres_mythology(),
			slug: 'than-thoai'
		},
		{
			_id: '1645fa23fa33651cef84428b0dcc2130',
			name: m.kkMovieGenres_documentary(),
			slug: 'tai-lieu'
		},
		{ _id: 'a2492d6cbc4d58f115406ca14e5ec7b6', name: m.kkMovieGenres_family(), slug: 'gia-dinh' },
		{ _id: '37a7b38b6184a5ebd3c43015aa20709d', name: m.kkMovieGenres_drama(), slug: 'chinh-kich' },
		{ _id: '2fb53017b3be83cd754a08adab3e916c', name: m.kkMovieGenres_mystery(), slug: 'bi-an' },
		{ _id: '01c8abbb7796a1cf1989616ca5c175e6', name: m.kkMovieGenres_school(), slug: 'hoc-duong' },
		{ _id: '268385d0de78827ff7bb25c35036ee2a', name: m.kkMovieGenres_classic(), slug: 'kinh-dien' },
		{ _id: '4b4457a1af8554c282dc8ac41fd7b4a1', name: m.kkMovieGenres_adult(), slug: 'phim-18' }
	];

	onMount(async () => {
		await Promise.all([
			myListMoviesStore.load(),
			tmdbFilterMoviesStore.load(),
			playedListStore.load(),
			moviesNewAddStore.load()
		]);
		if (page.data.moviesAddedNew && page.data.moviesAddedNew.length > 0) {
			moviesNewAddStore.value = page.data.moviesAddedNew;
		}
	});
</script>

<svelte:head>
	{@html serializeSchema(schema)}
	<link rel="dns-prefetch" href="//phimbop.top" />
	<link rel="preconnect" href="https://pbimgsvr.b-cdn.net" crossorigin="anonymous" />
	{#if kkPhimBoItems[0]}
		<link
			rel="preload"
			as="image"
			href="{getKKImageUrl(kkPhimBoItems[0].poster_url)}?width=549"
			fetchpriority="high"
		/>
	{/if}
	{#if kkPhimLeItems[0]}
		<link
			rel="preload"
			as="image"
			href="{getKKImageUrl(kkPhimLeItems[0].poster_url)}?width=363"
			fetchpriority="high"
		/>
	{/if}
</svelte:head>

<Seo title={m.home_seo_title()} metadescription={m.home_seo_metadescription()} slug={websiteUrl} />
<h1 class="sr-only">{m.home_heading_title()}</h1>
<section
	class="w-full h-fit rounded-lg grid grid-cols-1 md:grid-cols-10 gap-4 container mx-auto mt-4 md:mt-24 px-2 md:px-0"
>
	{#if kkPhimLeItems[0]}
		<div class="col-span-1 md:col-span-4">
			<CardMovieFeature movie={kkPhimLeItems[0]} showDate={true} imgSize="363" />
		</div>
	{/if}
	{#if kkPhimBoItems[0]}
		<div class="col-span-1 md:col-span-6">
			<CardMovieFeature movie={kkPhimBoItems[0]} showDate={true} imgSize="549" />
		</div>
	{/if}
</section>
<section
	class="w-full h-fit flex items-center justify-center relative mt-24 md:my-10 container mx-auto"
	data-tg-tour="Click vào các thẻ sau để hiển thị phim theo thể loại"
	data-tg-order="2"
>
	<MarqueeSlider type="movieCategory" List={kkMovieGenres} />
</section>
<section
	class="w-full h-fit flex items-center justify-center relative mt-10 md:my-10 container mx-auto"
>
	<MarqueeSlider type="networkProvider" List={networkProviders} reverse={true} />
</section>

{#if playedListStore.value?.length > 0}
	<section class="w-full h-fit relative my-10 container mx-auto">
		<h2 class="text-2xl font-bold text-slate-200 mb-5 px-2 md:px-0">
			{m.home_recentwatch_movies()}
		</h2>
		<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 px-2 md:px-0 w-full h-full">
			{#each sortedPlayedList.slice(0, 8) as playedMovie (playedMovie._id || playedMovie.id || playedMovie.slug)}
				<CardMyMoviesList movie={playedMovie} class="" showWatchedTime={true} />
			{/each}
		</div>
	</section>
{/if}
{#if moviesNewAddStore.value.length > 0}
	<section class="w-full h-fit relative my-10 container mx-auto">
		<h2 class="text-2xl px-2 md:px-0 font-bold text-slate-200 mb-5">
			{m.home_new_update_movies()}
		</h2>
		<TabMoiThem movieItems={10} />
	</section>
{/if}
<section class="w-full h-fit relative my-10 container mx-auto">
	<h2 class="text-2xl px-2 md:px-0 font-bold text-slate-200 mb-5">{m.home_hot_movies()}</h2>
	<div class="grid grid-cols-2 px-2 md:px-0 md:grid-cols-4 lg:grid-cols-8 gap-4 w-full h-full">
		{#each tmdbPopularResults.slice(0, 8) as movie (movie.id)}
			<CardMovieFilter {movie} showDate={false} class="" />
		{/each}
	</div>
</section>
<section
	class="w-full h-fit relative my-10 container mx-auto"
	use:lazyLoad={() => {
		if (!loadTabThongKe) loadTabThongKe = true;
	}}
>
	{#if loadTabThongKe}
		<TabThongKe />
	{/if}
</section>
<section
	class="w-full h-fit flex items-center justify-center relative mt-24 md:my-10 container mx-auto"
	data-tg-tour="Click vào hình diễn viên để xem chi tiết"
	data-tg-order="3"
	use:lazyLoad={() => {
		if (!loadPopularActor) loadPopularActor = true;
	}}
>
	{#if loadPopularActor}
		<MarqueeSlider type="actor" listActor={popularActorsResults} />
	{/if}
</section>
<section
	class="w-full h-fit relative my-10 container mx-auto"
	use:lazyLoad={() => {
		if (!loadKkPhimLe) loadKkPhimLe = true;
	}}
>
	{#if loadKkPhimLe}
		<h2 class="text-2xl font-bold text-slate-200 mb-5 px-2 md:px-0">
			{m.home_movies_new_update()}
		</h2>
		<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 px-2 md:px-0 w-full h-full">
			{#each kkPhimLeItems.slice(0, 8) as movie (movie._id)}
				<CardkkPhimLe {movie} showDate={true} class="" />
			{/each}
		</div>
	{/if}
</section>
<section
	class="w-full h-fit relative my-10 container mx-auto mb-20 md:mb-0"
	use:lazyLoad={() => {
		if (!loadKkPhimBo) loadKkPhimBo = true;
	}}
>
	{#if loadKkPhimBo}
		<h2 class="text-2xl font-bold text-slate-200 mb-5 px-2 md:px-0">
			{m.home_series_new_update()}
		</h2>
		<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 px-2 md:px-0 w-full h-full">
			{#each kkPhimBoItems.slice(0, 8) as movie (movie._id)}
				<CardkkPhimLe {movie} showDate={true} class="" />
			{/each}
		</div>
	{/if}
</section>
<div
	use:lazyLoad={() => {
		if (!topicsLoaded) loadTopicSections();
	}}
>
	{#each topicSections as section (section.topic)}
		<SectionMovieTopic
			title={section.title}
			movieList={topicMovies[section.topic] ?? []}
			loaded={topicsLoaded}
		/>
	{/each}
</div>
<SectionBanner>
	<div
		class="flex flex-col items-center justify-center space-y-6 bg-[url('/assets/images/pb-feedback.avif')] bg-no-repeat bg-cover bg-center min-h-96 h-full w-full"
	>
		<h3 class="text-3xl md:text-5xl font-bold text-slate-200 md:mb-8">
			{m.sectionFeedback_title()}
		</h3>
		<a
			href="https://t.me/phimbop_group"
			target="_blank"
			class=" border-[0.5px] border-slate-200 rounded-full px-4 py-2 text-slate-50 font-semibold hover:border-neonPink-500 hover:text-slate-100 transition-all duration-150 active:scale-95"
			>{m.sectionFeedback_btn_title()}</a
		>
	</div>
</SectionBanner>
<Footer />
