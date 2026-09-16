<script lang="ts">
	import { serializeSchema } from '$lib/helper/security';
	import { page } from '$app/state';
	import { DOMAIN_KKPHIM_IMAGE, websiteUrl, patternKKImageDomain, getKKImageUrl } from '$lib';
	import IconPlus from '$lib/Components/Icon/IconPlus.svelte';
	import IconUserMinus from '$lib/Components/Icon/IconUserMinus.svelte';
	import Play from '$lib/Components/Icon/Play.svelte';
	import Seo from '$lib/Components/SEO/Seo.svelte';
	import WatchPercent from '$lib/Components/watchPercent.svelte';
	import tooltip from '$lib/helper/tooltip';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { kkPhimboTapPhimStore, resetPlayedTime } from '$lib/runes/kkPhimStore.svelte';
	import { moviesHandler, myListMoviesStore, playedListStore } from '$lib/runes/movieStore.svelte';
	import LoginModal from '$lib/Components/Auth/LoginModal.svelte';
	import AddToPlaylistModal from '$lib/Components/Playlist/AddToPlaylistModal.svelte';
	import StarRating from '$lib/Components/Rating/StarRating.svelte';
	import SectionMovieRelate from '$lib/Components/Section/SectionMovieRelate.svelte';
	import Image from '$lib/Components/Image/Image.svelte';

	const kkPhimHoatHinhDetail: kkPhimboDetailType = $derived(page.data.kkPhimHoatHinhDetail);
	let currentEpisode = $derived(
		kkPhimboTapPhimStore.value.find((item) => item.movie === kkPhimHoatHinhDetail?.movie?.slug)
			?.episodes
	);
	let movieListed = $derived(
		myListMoviesStore.value.some((item) => 
			(item._id && kkPhimHoatHinhDetail?.movie?._id && item._id === kkPhimHoatHinhDetail.movie._id) ||
			(item.slug && kkPhimHoatHinhDetail?.movie?.slug && item.slug === kkPhimHoatHinhDetail.movie.slug)
		)
	);
	let playedTime = $derived(
		playedListStore.value.find((item) => item._id === kkPhimHoatHinhDetail?.movie?._id)?.playedTime ??
			0
	);
	let duration = $derived(
		playedListStore.value.find((item) => item._id === kkPhimHoatHinhDetail?.movie?._id)?.duration ?? 0
	);
	let watchPercent = $derived(duration && isFinite(duration) && duration > 0 ? Math.round((playedTime! / duration!) * 100) : 0);
	let showPlaylistModal = $state(false);
	let showLoginModal = $state(false);
</script>

{#if kkPhimHoatHinhDetail?.movie}
	<Seo
		title={kkPhimHoatHinhDetail.movie.name +
			' | ' +
			kkPhimHoatHinhDetail.movie.origin_name +
			' (' +
			(kkPhimHoatHinhDetail.movie.year?.toString() ?? '') +
			') 4K FULL HD 1080p'}
		metadescription={kkPhimHoatHinhDetail.movie.name +
			' ' +
			kkPhimHoatHinhDetail.movie.origin_name +
			' ' +
			kkPhimHoatHinhDetail.movie.content}
		slug={`${page.url}`}
		image={`${kkPhimHoatHinhDetail.movie.poster_url}`}
		keywordsPlus={kkPhimHoatHinhDetail.movie.name}
		jsonLd={{
			'@context': 'https://schema.org',
			'@type': 'Movie',
			actor: (kkPhimHoatHinhDetail.movie.actor || []).map((actor) => {
				return {
					'@type': 'Person',
					name: actor
				};
			}),
			description: kkPhimHoatHinhDetail.movie.content.replace(/\\/g, ''),
			director: {
				'@type': 'Person',
				name: (kkPhimHoatHinhDetail.movie.director || []).join(', ')
			},
			name:
				kkPhimHoatHinhDetail.movie.name +
				' | ' +
				kkPhimHoatHinhDetail.movie.origin_name +
				' (' +
				(kkPhimHoatHinhDetail.movie.year?.toString() ?? '') +
				') 4K FULL HD 1080p Vietsub Online miễn phí',
			image: `${kkPhimHoatHinhDetail.movie.poster_url}`,
			url: `${page.url}`,
			dateCreated: kkPhimHoatHinhDetail.movie.year?.toString() ?? ''
		}}
	>
		<meta property="video:duration" content={kkPhimHoatHinhDetail.movie.time} />
		{#each kkPhimHoatHinhDetail.movie.actor || [] as cast}
			<meta property="video:actor" content={cast} />
		{/each}
		{#each kkPhimHoatHinhDetail.movie.director || [] as director}
			<meta property="video:director" content={director} />
		{/each}
		<meta property="video:release_date" content={kkPhimHoatHinhDetail.movie.year?.toString() ?? ''} />
		{@html serializeSchema({
			"@context": "https://schema.org",
			"@type": "BreadcrumbList",
			"itemListElement": [{
				"@type": "ListItem",
				"position": 1,
				"name": "Phim hoạt hình",
				"item": `${websiteUrl}/phim-hoat-hinh`
			},{
				"@type": "ListItem",
				"position": 2,
				"name": `${kkPhimHoatHinhDetail.movie.name}`,
				"item": `${page.url}`
			}]
		})}
	</Seo>
	<div class="relative w-full h-fit sm:h-screen overflow-hidden">
		<div
			class="w-full h-full absolute -bottom-2 bg-linear-to-t from-slate-950 to-transparent inset-x-0 z-10 pointer-events-none"
		></div>
		<div class="relative sm:absolute w-full h-fit sm:h-screen inset-0">
			<a
				aria-label="Play phim hoạt hình"
				href="/phim-hoat-hinh/{kkPhimHoatHinhDetail.movie.slug}/{currentEpisode
					? currentEpisode
					: (kkPhimHoatHinhDetail.episodes?.[0]?.server_data?.[0]?.slug ?? 'tap-1')}"
				onclick={() => {
					resetPlayedTime.value = false;
					if (kkPhimboTapPhimStore.value.some((item) => item.movie === kkPhimHoatHinhDetail.movie.slug)) {
						kkPhimboTapPhimStore.value = kkPhimboTapPhimStore.value.map((item) => {
							if (item.movie === kkPhimHoatHinhDetail.movie.slug && !currentEpisode) {
								return { ...item, episodes: kkPhimHoatHinhDetail.episodes?.[0]?.server_data?.[0]?.slug ?? 'tap-1' };
							} else {
								return item;
							}
						});
					} else {
						kkPhimboTapPhimStore.value = [
							...kkPhimboTapPhimStore.value,
							{
								movie: kkPhimHoatHinhDetail.movie.slug,
								episodes: kkPhimHoatHinhDetail.episodes?.[0]?.server_data?.[0]?.slug ?? 'tap-1'
							}
						];
					}
				}}
			>
				<Play />
			</a>
			<div class="relative sm:inset-0 w-full h-80 sm:h-screen overflow-hidden">
				<Image
					src={getKKImageUrl(kkPhimHoatHinhDetail.movie.thumb_url)}
					alt={kkPhimHoatHinhDetail.movie.name}
					isCritical={true}
					class="w-full h-full object-cover"
				/>
			</div>
		</div>
		<div
			class="relative sm:absolute w-full h-fit sm:bottom-0 p-4 md:px-8 z-20 grid lg:grid-cols-3 md:grid-cols-1 gap-4"
		>
			<h1
				class="flex items-end font-semibold text-3xl lg:text-6xl text-slate-200 max-w-[320px] lg:max-w-full"
			>
				{getLocale() === 'vi' ? kkPhimHoatHinhDetail.movie.name : ''} ({kkPhimHoatHinhDetail.movie.origin_name})
			</h1>
			<div
				class="flex flex-col items-start justify-start lg:justify-end lg:items-center mt-10 lg:mt-0"
			>
				<div
					class="grid grid-cols-2 md:grid-cols-3 gap-2 items-start lg:flex md:items-center justify-start lg:justify-around w-full"
				>
					<p class="text-slate-400">
						{m.reuse_year()}: <span class="text-slate-200">{kkPhimHoatHinhDetail.movie.year}</span>
					</p>
					<p class="text-slate-400">
						{m.reuse_runtime()}: <span class="text-slate-200">{kkPhimHoatHinhDetail.movie.time}</span>
					</p>
					<p class="text-slate-400">
						{m.reuse_status()}:
						<span class="text-slate-200">{kkPhimHoatHinhDetail.movie.episode_current}</span>
					</p>
					<div class="flex items-center space-x-2">
						<p class="text-slate-400">{m.reuse_watched()}:</p>
						<WatchPercent {watchPercent} />
					</div>
				</div>
			</div>
			<div class="group flex flex-col lg:justify-end relative">
				<!-- movie info  -->
				<div
					class="lg:opacity-0 lg:translate-y-[5%] lg:group-hover:translate-y-0 lg:group-hover:opacity-100 transition-all duration-150 lg:max-h-[30vh] lg:overflow-y-scroll lg:scroll-smooth"
				>
					<p class="text-slate-400">
						{m.reuse_directors()}: <span class="text-slate-200">{(kkPhimHoatHinhDetail.movie.director || []).join(', ')}</span>
					</p>
					<p class="text-slate-400">
						{m.reuse_actors()}: <span class="text-slate-200">{(kkPhimHoatHinhDetail.movie.actor || []).join(', ')}</span>
					</p>
					<p class="text-slate-400 my-4">
						{m.reuse_genres()}:
						{#each kkPhimHoatHinhDetail.movie.category || [] as category}
							<a href="/{category.slug}" target="_blank"
								><span
									class="text-slate-200 text-sm font-semibold mr-2 p-1 rounded-sm bg-neonPink-900 cursor-pointer hover:bg-neonPink-900/70 transition-all duration-200"
									>{category.name}</span
								></a
							>
						{/each}
					</p>
					<p class="text-slate-400">
						{m.reuse_overview()}: <span class="text-slate-200">{kkPhimHoatHinhDetail.movie.content}</span>
					</p>
				</div>
				<p
					class="text-slate-200 opacity-0 lg:opacity-100 group-hover:opacity-0 lg:group-hover:translate-x-3 transition-all duration-150"
				>
					{m.reuse_content()} ⇀
				</p>
				<!-- end movie info -->
				
				<div class="mt-4 mb-4">
					<StarRating
						movieId={kkPhimHoatHinhDetail.movie._id}
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
								e.preventDefault();
								await moviesHandler.updateMyListMovies(kkPhimHoatHinhDetail.movie, 'kk');
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
			movieId={kkPhimHoatHinhDetail.movie._id}
			title={kkPhimHoatHinhDetail.movie.name}
			posterPath={kkPhimHoatHinhDetail.movie.poster_url}
			isTv={true}
		/>
	{/if}
	<section
		class="relative w-full h-fit bg-gradient-to-b from-slate-950 to-transparent overflow-hidden pb-10 sm:pb-0 sm:px-8"
	>
		{#if kkPhimHoatHinhDetail.movie.category?.[0]?.slug}
			<SectionMovieRelate
				slug={kkPhimHoatHinhDetail.movie.category[0].slug}
				currentMovieName={getLocale() === 'vi'
					? kkPhimHoatHinhDetail.movie.name
					: kkPhimHoatHinhDetail.movie.origin_name}
			/>
		{/if}
	</section>
{/if}
