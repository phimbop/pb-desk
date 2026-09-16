<script lang="ts">
	import { page } from '$app/state';
	import { clickOutside } from '$lib/helper/clickOutSide';
	import tooltip from '$lib/helper/tooltip';
	import { kkPhimboTapPhimStore, resetPlayedTime } from '$lib/runes/kkPhimStore.svelte';
	import { isPlaying, playedListStore, sidebarOpen } from '../../runes/movieStore.svelte';
	import { onMount } from 'svelte';
	import ButtonSecondary from '../Button/ButtonSecondary.svelte';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	interface Props {
		children?: import('svelte').Snippet;
		checkMovieEpisodes: boolean | any;
		movieDetail: any;
		movieSource: 'kkPhimBo' | 'kkPhimLe' | 'tmdb' | 'animation';
	}

	let { children, checkMovieEpisodes, movieDetail, movieSource }: Props = $props();
	onMount(async () => {
		await playedListStore.load();
		if (movieSource === 'kkPhimLe') {
			await kkPhimboTapPhimStore.load();
		}
	});
</script>

{#snippet Episodes()}
	{#if movieSource === 'animation'}
		{#each movieDetail.episodes[0].server_data as episodes}
			<a
				href="/phim-hoat-hinh/{movieDetail.movie.slug}/{episodes.slug}"
				onclick={() => {
					resetPlayedTime.value = true;
					// update playedList time to 0
					if (playedListStore.value.some((item) => item._id === movieDetail.movie?._id)) {
						playedListStore.value = playedListStore.value.map((item) => {
							if (item._id === movieDetail.movie?._id) {
								return { ...item, playedTime: 0 };
							} else {
								return item;
							}
						});
					}
					if (kkPhimboTapPhimStore.value.some((item) => item.movie === movieDetail.movie.slug)) {
						kkPhimboTapPhimStore.value = kkPhimboTapPhimStore.value.map((item) => {
							if (item.movie === movieDetail.movie.slug) {
								return { ...item, episodes: episodes.slug };
							} else {
								return item;
							}
						});
					} else {
						kkPhimboTapPhimStore.value = [
							...kkPhimboTapPhimStore.value,
							{ movie: movieDetail.movie.slug, episodes: episodes.slug }
						];
					}
				}}
				class="relative flex items-center {checkMovieEpisodes(movieDetail.movie.slug, episodes.slug)
					? 'text-neonPink-500'
					: 'text-slate-400'} p-2 bg-black/60 rounded-sm hover:bg-black/30 hover:text-neonPink-500 focus:text-neonPink-600 cursor-pointer transition-all duration-200 mb-1 list-none group"
			>
				<span
					class=" absolute -translate-x-1 opacity-0 transform group-hover:translate-x-1 group-hover:opacity-100 {checkMovieEpisodes(
						movieDetail.movie.slug,
						episodes.slug
					)
						? 'opacity-100 translate-x-1'
						: ''} transition-all duration-200">▶</span
				>
				<span
					class="transform translate-x-0 group-hover:translate-x-5 {checkMovieEpisodes(
						movieDetail.movie.slug,
						episodes.slug
					)
						? 'translate-x-5'
						: ''} transition-all duration-200">{episodes.name}</span
				>
			</a>
		{/each}
	{:else if movieSource === 'kkPhimLe' && movieDetail.episodes.length > 1}
		{#each movieDetail.episodes as episodes, i}
			<a
				href="/phim-le/{movieDetail.movie.slug}/{i === 0 ? 'vietsub0' : 'thuyet-minh' + i}"
				onclick={() => {
					// resetPlayedTime.value = true;
					// // update playedList time to 0
					// 	if (playedListStore.value.some((item) => item._id === movieDetail.movie?._id)) {
					// 		playedListStore.value = playedListStore.value.map((item) => {
					// 			if (item._id === movieDetail.movie?._id) {
					// 				return { ...item, playedTime: 0 };
					// 			} else {
					// 				return item;
					// 			}
					// 		});
					// 	}
					if (kkPhimboTapPhimStore.value.some((item) => item.movie === movieDetail.movie.slug)) {
						kkPhimboTapPhimStore.value = kkPhimboTapPhimStore.value.map((item) => {
							if (item.movie === movieDetail.movie.slug) {
								return { ...item, episodes: i === 0 ? 'vietsub0' : 'thuyet-minh' + i };
							} else {
								return item;
							}
						});
					} else {
						kkPhimboTapPhimStore.value = [
							...kkPhimboTapPhimStore.value,
							{ movie: movieDetail.movie.slug, episodes: i === 0 ? 'vietsub0' : 'thuyet-minh' + i }
						];
					}
				}}
				class="relative flex items-center {checkMovieEpisodes(
					movieDetail.movie.slug,
					i === 0 ? 'vietsub0' : 'thuyet-minh' + i
				)
					? 'text-neonPink-500'
					: 'text-slate-400'} p-2 bg-black/60 rounded-sm hover:bg-black/30 hover:text-neonPink-500 focus:text-neonPink-600 cursor-pointer transition-all duration-200 mb-1 list-none group"
			>
				<span
					class=" absolute -translate-x-1 opacity-0 transform group-hover:translate-x-1 group-hover:opacity-100 {checkMovieEpisodes(
						movieDetail.movie.slug,
						i === 0 ? 'vietsub0' : 'thuyet-minh' + i
					)
						? 'opacity-100 translate-x-1'
						: ''} transition-all duration-200">▶</span
				>
				<span
					class="transform translate-x-0 group-hover:translate-x-5 {checkMovieEpisodes(
						movieDetail.movie.slug,
						i === 0 ? 'vietsub0' : 'thuyet-minh' + i
					)
						? 'translate-x-5'
						: ''} transition-all duration-200">{i === 0 ? 'Vietsub' : 'Thuyết minh'}</span
				>
			</a>
		{/each}
	{/if}
{/snippet}
{#snippet breadcrumb()}
	<nav
		aria-label="breadcrumb"
		class="{isPlaying.value
			? 'opacity-0'
			: 'opacity-100'} absolute top-1 left-3 md:top-10 md:left-10 font-bold text-slate-200 md:px-0 transition-all duration-150 flex items-center z-50"
	>
		<a href="/" class="line-clamp-1">{m.breadcrumb_home()} </a>
		{#if movieSource === 'animation'}
			<span class="mx-2">⇀</span>
			<a href="/phim-hoat-hinh" class="line-clamp-1"> {m.reuse_animation()}</a>
		{:else if movieSource === 'kkPhimLe'}
			<span class="mx-2">⇀</span>
			<a href="/phim-le" class="line-clamp-1"> {m.reuse_movies()}</a>
		{/if}
		{#if movieSource === 'animation'}
			<span class="mx-2">⇀</span>
			<a class="line-clamp-1" href="/phim-hoat-hinh/{movieDetail.movie.slug}"
				>{movieDetail.movie.name}</a
			>
		{:else if movieSource === 'kkPhimLe'}
			<span class="mx-2">⇀</span>
			<a class="line-clamp-1" href="/phim-le/{movieDetail.movie.slug}"
				>{getLocale() === 'vi' ? movieDetail.movie.name : movieDetail.movie.origin_name}</a
			>
		{/if}
		{#if movieSource === 'animation' && page.url.pathname !== `/phim-hoat-hinh/${movieDetail.movie.slug}`}
			<span class="mx-2">⇀</span>
			<a class="line-clamp-1" href={page.url.pathname}>{page.url.pathname.split('/').pop() || ''}</a
			>
		{/if}
	</nav>
{/snippet}
{#key page.url}
	<section class="w-full min-h-screen flex relative">
		<div
			use:clickOutside={() => {
				if (sidebarOpen.value) {
					sidebarOpen.value = !sidebarOpen.value;
				}
			}}
			class="{sidebarOpen.value
				? 'w-3/4 md:w-1/6 opacity-100 translate-x-0'
				: 'opacity-0 -translate-x-full w-0 -ml-8'} transition-all duration-200 backdrop-blur-lg bg-slate-600/10 p-4 overflow-y-auto h-screen"
		>
			{#if movieSource !== 'kkPhimLe' || (movieSource === 'kkPhimLe' && movieDetail.episodes.length > 1)}
				<div class="relative w-full h-6 mb-4 flex items-center space-x-2 justify-between">
					<p class="line-clamp-1 text-slate-400">{m.reuse_episodes()}</p>
					<button
						aria-label="Close sidebar"
						class="p-2 rounded-full hover:bg-black/30 text-slate-400 hover:text-neonPink-500 cursor-pointer transition-all duration-200"
						onclick={() => (sidebarOpen.value = !sidebarOpen.value)}
						use:tooltip={{ text: m.reuse_close(), position: 'right' }}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="icon icon-tabler icon-tabler-x w-4 h-4"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							fill="none"
							stroke-linecap="round"
							stroke-linejoin="round"
							><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M18 6l-12 12" /><path
								d="M6 6l12 12"
							/></svg
						>
					</button>
				</div>
			{/if}
			{@render Episodes()}
		</div>
		<div
			class="{sidebarOpen.value
				? 'translate-x-3/4 w-full -ml-[75%] md:ml-0 md:w-5/6 md:translate-x-0'
				: 'translate-x-0'} w-full transition-all duration-200 relative"
		>
			{@render breadcrumb()}
			{#if movieSource !== 'kkPhimLe' || (movieSource === 'kkPhimLe' && movieDetail.episodes.length > 1)}
				<ButtonSecondary
					aria-label="Open sidebar"
					class="{isPlaying.value
						? 'opacity-0'
						: 'opacity-100'} border-[0.5px] border-white/20 px-4 py-1 rounded-full text-slate-400 cursor-pointer transition-all duration-200 absolute top-8 left-3 md:top-20 md:left-10 z-50 flex items-center"
					onclick={(e: MouseEvent) => {
						e.stopPropagation();
						sidebarOpen.value = !sidebarOpen.value;
					}}
				>
					{#if !sidebarOpen.value}
						<p>{m.reuse_episode()}</p>
					{/if}
				</ButtonSecondary>
			{/if}
			{@render children?.()}
		</div>
	</section>
{/key}
