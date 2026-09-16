<script lang="ts">
	import { page } from '$app/state';
	import { clickAdslink, openExternalUrl } from '$lib';
	import { clickOutside } from '$lib/helper/clickOutSide';
	import CommonHelper from '$lib/helper/commentHelper';
	import tooltip from '$lib/helper/tooltip';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { isPlaying, sidebarOpen } from '$lib/runes/movieStore.svelte';
	import { tmdbTvHandler, tmdbTvStore } from '$lib/runes/tmdbTv.svelte';
	import type { TvSeriesDetail } from '../../../types/Tmdb';
	import ButtonSecondary from '../Button/ButtonSecondary.svelte';
	import IconArrowBack from '../Icon/IconArrowBack.svelte';
	interface Props {
		children?: import('svelte').Snippet;
		checkMovieEpisodes: boolean | any | undefined;
		tvDetail: TvSeriesDetail | any;
		movieSource: movieResource;
	}
	let { children, checkMovieEpisodes, tvDetail = $bindable(), movieSource }: Props = $props();
	let seasonNumber = $derived(
		tvDetail.id && tmdbTvStore.state === 'ready'
			? tmdbTvStore.value.find((i) => i.tvId === tvDetail.id)?.currentSeason
				? Number(tmdbTvStore.value.find((i) => i.tvId === tvDetail.id)?.currentSeason)
				: tvDetail.seasons[0]?.season_number
			: null
	);
	let checkTvEpisodes = $derived((tvId: string, season: string, episode: string) => {
		const a = tmdbTvStore.value;
		let found = false;
		try {
			for (const tv of a) {
				if (tv.tvId == tvId && tv.currentSeason == season && tv.currentEpisode == episode) {
					found = true;
					break;
				}
			}
			return found;
		} catch (error) {
			return false;
		}
	});
</script>

{#snippet breadcrumb()}
	<nav
		aria-label="breadcrumb"
		class="{isPlaying.value
			? 'opacity-0'
			: 'opacity-100'} absolute top-1 left-3 md:top-10 md:left-10 font-bold text-slate-200 md:px-0 transition-all duration-150 flex items-center z-50"
	>
		<a href="/" class="line-clamp-1">{m.breadcrumb_home()} </a>
		<span class="mx-2">⇀</span>
		<a href="/tv" class="line-clamp-1"> Tv </a>
		<span class="mx-2">⇀</span>
		<a href={page.url.pathname.split('/').slice(0, 3).join('/')} class="line-clamp-1"
			>{getLocale() === 'vi' ? tvDetail.name : tvDetail.original_name}
		</a>
		{#if page.url.pathname.includes('/season')}
			<span class="mx-2">⇀</span>
			<a href={page.url.pathname} class="line-clamp-1"
				>{page.url.pathname.split('/').pop() || ''}
			</a>
		{/if}
	</nav>
{/snippet}
{#snippet Episodes()}
	{#key page.url}
		{#await tmdbTvHandler.getTvSeasonDetail(parseInt(page.params.tvId!), seasonNumber) then seasonDetail}
			{#each seasonDetail.episodes as episode}
				<a
					onclick={() => {
						isPlaying.value = true;
						openExternalUrl(clickAdslink);
					}}
					href="/tv/{CommonHelper.stringToSlug(
						tvDetail.name
					)}/{tvDetail.id}/season-{seasonNumber}/tap-{episode.episode_number}"
					class="relative flex items-center {checkTvEpisodes(
						tvDetail.id,
						seasonNumber,
						episode.episode_number
					)
						? 'text-neonPink-500'
						: 'text-slate-400'} p-2 bg-black/60 rounded-sm hover:bg-black/30 hover:text-neonPink-500 focus:text-neonPink-600 cursor-pointer transition-all duration-200 mb-1 list-none group"
				>
					<span
						class=" absolute -translate-x-1 opacity-0 transform group-hover:translate-x-1 group-hover:opacity-100 {false
							? 'opacity-100 translate-x-1'
							: ''} transition-all duration-200">▶</span
					>
					<span
						class="transform translate-x-0 group-hover:translate-x-5 {false
							? 'translate-x-5'
							: ''} transition-all duration-200">{m.reuse_episode()} {episode.episode_number}</span
					>
				</a>
			{/each}
		{/await}
	{/key}
{/snippet}
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
		<div class="relative w-full h-6 mb-4 flex items-center space-x-2 justify-between">
			<p class="line-clamp-1 text-slate-400">{m.tmdbTvLayout_episodes_list()}</p>
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
		{@render Episodes()}
	</div>
	<div
		class="{sidebarOpen.value
			? 'translate-x-3/4 w-full -ml-[75%] md:ml-0 md:w-5/6 md:translate-x-0'
			: 'translate-x-0'} w-full transition-all duration-200 relative"
	>
		{@render breadcrumb()}
		{#if isPlaying.value}
			<button
				type="button"
				aria-label={m.reuse_back()}
				class="absolute left-10 top-10 md:top-20 md:left-10 z-50 text-slate-200 hover:text-neonPink-500 cursor-pointer bg-transparent border-none p-0 focus:outline-hidden transition-all duration-200"
				onclick={(e) => {
					e.stopPropagation();
					isPlaying.value = !isPlaying.value;
				}}
				use:tooltip={{ text: m.reuse_back(), position: 'right' }}
			>
				<IconArrowBack class="md:w-10 md:h-10 text-slate-200" />
			</button>
		{:else}
			<ButtonSecondary
				class=" {isPlaying.value
					? 'hidden md:opacity-0'
					: 'opacity-100'} border-[0.5px] border-white/20 hover:text-slate-50 px-4 py-1 rounded-full text-slate-400 cursor-pointer transition-all duration-200 absolute top-10 left-10 md:top-20 md:left-10 z-50 flex items-center"
				onclick={(e: any) => {
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
