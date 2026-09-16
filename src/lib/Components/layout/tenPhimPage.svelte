<script lang="ts">
	import { page } from '$app/state';
	import { DOMAIN_KKPHIM_IMAGE, patternKKImageDomain, getKKImageUrl } from '$lib';
	import IconPlus from '$lib/Components/Icon/IconPlus.svelte';
	import IconUserMinus from '$lib/Components/Icon/IconUserMinus.svelte';
	import Play from '$lib/Components/Icon/Play.svelte';
	import Seo from '$lib/Components/SEO/Seo.svelte';
	import WatchPercent from '$lib/Components/watchPercent.svelte';
	import tooltip from '$lib/helper/tooltip';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { kkPhimboTapPhimStore, resetPlayedTime } from '$lib/runes/kkPhimStore.svelte';
	import { moviesHandler, myListMoviesStore } from '$lib/runes/movieStore.svelte';
	import SectionMovieRelate from '../Section/SectionMovieRelate.svelte';
	import LoginModal from '../Auth/LoginModal.svelte';
	import AddToPlaylistModal from '../Playlist/AddToPlaylistModal.svelte';
	import StarRating from '$lib/Components/Rating/StarRating.svelte';
	import Image from '../Image/Image.svelte';

	interface Props {
		movieDetail: any;
		watchPercent: number;
		movieListed: boolean;
		currentEpisode?: string | number;
		movieSource: movieResource;
	}
	let {
		movieDetail,
		watchPercent,
		movieListed = $bindable(),
		currentEpisode = $bindable(),
		movieSource
	}: Props = $props();
	let structLink = $derived.by(() => {
		switch (movieSource) {
			case 'animation':
			case 'kkPhimLe':
			case 'kkPhimBo':
				return movieDetail.movie;
			default:
				return movieDetail.movie ?? movieDetail;
		}
	});
	let scrollY = $state(0);
	let showPlaylistModal = $state(false);
	let showLoginModal = $state(false);
</script>

{#snippet btnPlay()}
	{#if movieSource === 'animation' || movieSource === 'kkPhimLe'}
		<a
			aria-label="Play phim"
			href="/phim-le/{movieDetail.movie.slug}/{currentEpisode ? currentEpisode : 'vietsub0'}"
			onclick={() => {
				resetPlayedTime.value = false;
				if (kkPhimboTapPhimStore.value.some((item) => item.movie === movieDetail.movie.slug)) {
					kkPhimboTapPhimStore.value = kkPhimboTapPhimStore.value.map((item) => {
						if (item.movie === movieDetail.movie.slug && !currentEpisode) {
							return { ...item, episodes: 'vietsub0' };
						} else {
							return item;
						}
					});
				} else {
					kkPhimboTapPhimStore.value = [
						...kkPhimboTapPhimStore.value,
						{
							movie: movieDetail.movie.slug,
							episodes: 'vietsub0'
						}
					];
				}
			}}
		>
			<Play />
		</a>
	{/if}
{/snippet}
{#snippet bgImage()}
	{#if movieSource === 'animation' || movieSource === 'kkPhimLe'}
		<div
			class="relative sm:inset-0 w-full h-80 sm:h-screen overflow-hidden"
			style="
                transform: translateY({scrollY * 0.8}px);
                will-change: transform;"
		>
			<Image
				src={getKKImageUrl(movieDetail.movie.thumb_url)}
				alt={movieDetail.movie.name}
				isCritical={true}
				class="w-full h-full object-cover"
			/>
		</div>
	{/if}
{/snippet}
{#snippet h1()}
	<h1
		class="flex items-end font-semibold text-3xl lg:text-6xl text-slate-200 max-w-[320px] lg:max-w-full"
	>
		{#if movieSource === 'animation' || movieSource === 'kkPhimLe'}
			{getLocale() === 'vi' ? movieDetail.movie.name : ''} ({movieDetail.movie.origin_name})
		{/if}
	</h1>
{/snippet}
<svelte:window bind:scrollY />
<div class="relative w-full h-fit sm:h-screen overflow-hidden">
	<div
		class="w-full h-full absolute -bottom-2 bg-linear-to-t from-slate-950 to-transparent inset-x-0 z-10 pointer-events-none"
	></div>
	<div class="relative sm:absolute w-full h-fit sm:h-full inset-0">
		{@render btnPlay()}
		{@render bgImage()}
	</div>
	<div
		class="relative sm:absolute w-full h-fit sm:bottom-0 p-4 md:px-8 z-20 grid lg:grid-cols-3 md:grid-cols-1 gap-4"
	>
		{@render h1()}
		<div
			class="flex flex-col items-start justify-start lg:justify-end lg:items-center mt-10 lg:mt-0"
		>
			<div
				class="grid grid-cols-2 md:grid-cols-3 gap-2 items-start lg:flex md:items-center justify-start lg:justify-around w-full"
			>
				<p class="text-slate-400">
					{m.reuse_year()}: <span class="text-slate-200">{structLink.year}</span>
				</p>
				<p class="text-slate-400">
					{m.reuse_runtime()}: <span class="text-slate-200">{structLink.time}</span>
				</p>
				<p class="text-slate-400">
					{m.reuse_status()}: <span class="text-slate-200">{structLink.episode_current}</span>
				</p>
				<div class="flex items-center space-x-2">
					<p class="text-slate-400">{m.reuse_watched()}:</p>
					<WatchPercent {watchPercent} />
				</div>
			</div>
		</div>
		<div class="group flex flex-col lg:justify-end relative">
			<!-- movie infor  -->
			<div
				class="lg:opacity-0 lg:translate-y-[5%] lg:group-hover:translate-y-0 lg:group-hover:opacity-100 transition-all duration-150 lg:max-h-[30vh] lg:overflow-y-scroll"
			>
				<p class="text-slate-400">
					{m.reuse_directors()}: <span class="text-slate-200">{structLink.director}</span>
				</p>
				<p class="text-slate-400">
					{m.reuse_actors()}: <span class="text-slate-200">{structLink.actor}</span>
				</p>
				<p class="text-slate-400 my-4">
					{m.reuse_genres()}:
					{#each structLink.category as category}
						<a href="/{category.slug}" target="_blank"
							><span
								class="text-slate-200 text-sm font-semibold mr-2 p-1 rounded-sm bg-neonPink-900 cursor-pointer hover:bg-neonPink-900/70 transition-all duration-200"
								>{category.name}</span
							></a
						>
					{/each}
				</p>
				<p class="text-slate-400">
					{m.reuse_overview()}: <span class="text-slate-200">{structLink.content}</span>
				</p>
			</div>
			<p
				class="text-slate-200 opacity-0 lg:opacity-100 group-hover:opacity-0 lg:group-hover:translate-x-3 transition-all duration-150"
			>
				{m.reuse_content()} ⇀
			</p>
			<!-- end movie infor -->
			
			<div class="mt-4 mb-4">
				<StarRating
					movieId={structLink._id}
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
							await moviesHandler.updateMyListMovies(
								structLink,
								(movieSource === 'kkPhimBo' || movieSource === 'kkPhimLe' || movieSource === 'animation') ? 'kk' : movieSource
							);
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
		movieId={structLink._id}
		title={structLink.name}
		posterPath={structLink.poster_url}
		isTv={movieSource === 'kkPhimBo' || movieSource === 'animation' || structLink.type === 'series'}
	/>
{/if}
<section
	class="relative w-full h-fit bg-gradient-to-b from-slate-950 to-transparent overflow-hidden pb-24 md:pb-10"
>
	<SectionMovieRelate
		slug={structLink.category[0].slug}
		currentMovieName={getLocale() === 'vi' ? structLink.name : structLink.origin_name}
	/>
</section>
