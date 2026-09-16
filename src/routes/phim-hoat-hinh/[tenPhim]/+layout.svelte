<script lang="ts">
	import { page } from '$app/state';
	import ButtonSecondary from '$lib/Components/Button/ButtonSecondary.svelte';
	import { clickOutside } from '$lib/helper/clickOutSide';
	import tooltip from '$lib/helper/tooltip';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { kkPhimboTapPhimStore, resetPlayedTime } from '$lib/runes/kkPhimStore.svelte';
	import { isPlaying, playedListStore, sidebarOpen } from '$lib/runes/movieStore.svelte';
	import { onMount } from 'svelte';
	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
	const kkPhimHoatHinhDetail: kkPhimboDetailType = $derived(page.data.kkPhimHoatHinhDetail);
	let checkMovieEpisodes = $derived((movieSlug: string, episodes: string) => {
		const a = kkPhimboTapPhimStore.value;
		let found = false;
		try {
			for (const movie of a) {
				if (movie.movie === movieSlug && movie.episodes === episodes) {
					found = true;
					break;
				}
			}
			return found;
		} catch (error) {
			return false;
		}
	});
	onMount(async () => {
		await kkPhimboTapPhimStore.load();
		await playedListStore.load();
	});
</script>

{#key page.url}
	<section class="w-full h-screen flex relative">
		<div
			use:clickOutside={() => {
				if (sidebarOpen.value) {
					sidebarOpen.value = !sidebarOpen.value;
				}
			}}
			class="{sidebarOpen.value
				? 'w-3/4 md:w-1/6 opacity-100 translate-x-0'
				: 'opacity-0 -translate-x-full w-0 -ml-8'} transition-all duration-200 backdrop-blur-lg bg-slate-600/10 p-4 overflow-y-auto"
		>
			<div class="relative w-full h-6 mb-4 flex items-center space-x-2 justify-between">
				<p class="line-clamp-1 text-slate-400">Danh sách tập phim</p>
				<button
					aria-label="Close sidebar"
					class="p-2 rounded-full hover:bg-black/30 text-slate-400 hover:text-neonPink-500 cursor-pointer transition-all duration-200"
					onclick={() => (sidebarOpen.value = !sidebarOpen.value)}
					use:tooltip={{ text: 'Đóng', position: 'right' }}
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
			{#if kkPhimHoatHinhDetail?.episodes?.[0]?.server_data}
				{#each kkPhimHoatHinhDetail.episodes[0].server_data as episodes}
					<a
						href="/phim-hoat-hinh/{kkPhimHoatHinhDetail.movie.slug}/{episodes.slug}"
						onclick={() => {
							if (
								playedListStore.value.some((item) => item._id === kkPhimHoatHinhDetail.movie?._id)
							) {
								playedListStore.value = playedListStore.value.map((item) => {
									if (item._id === kkPhimHoatHinhDetail.movie?._id) {
										resetPlayedTime.value = true;
										return { ...item, playedTime: 0 };
									} else {
										return item;
									}
								});
							}
							if (
								kkPhimboTapPhimStore.value.some(
									(item) => item.movie === kkPhimHoatHinhDetail.movie.slug
								)
							) {
								kkPhimboTapPhimStore.value = kkPhimboTapPhimStore.value.map((item) => {
									if (item.movie === kkPhimHoatHinhDetail.movie.slug) {
										return { ...item, episodes: episodes.slug };
									} else {
										return item;
									}
								});
							} else {
								kkPhimboTapPhimStore.value = [
									...kkPhimboTapPhimStore.value,
									{ movie: kkPhimHoatHinhDetail.movie.slug, episodes: episodes.slug }
								];
							}
						}}
						class="relative flex items-center {checkMovieEpisodes(
							kkPhimHoatHinhDetail.movie.slug,
							episodes.slug
						)
							? 'text-neonPink-500'
							: 'text-slate-400'} p-2 bg-black/60 rounded-sm hover:bg-black/30 hover:text-neonPink-500 focus:text-neonPink-600 cursor-pointer transition-all duration-200 mb-1 list-none group"
					>
						<span
							class=" absolute -translate-x-1 opacity-0 transform group-hover:translate-x-1 group-hover:opacity-100 {checkMovieEpisodes(
								kkPhimHoatHinhDetail.movie.slug,
								episodes.slug
							)
								? 'opacity-100 translate-x-1'
								: ''} transition-all duration-200">▶</span
						>
						<span
							class="transform translate-x-0 group-hover:translate-x-5 {checkMovieEpisodes(
								kkPhimHoatHinhDetail.movie.slug,
								episodes.slug
							)
								? 'translate-x-5'
								: ''} transition-all duration-200">{episodes.name}</span
						>
					</a>
				{/each}
			{/if}
		</div>
		<div
			class="{sidebarOpen.value
				? 'translate-x-3/4 w-full -ml-[75%] md:ml-0 md:w-5/6 md:translate-x-0'
				: 'translate-x-0'} w-full transition-all duration-200 relative"
		>
			<nav
				aria-label="breadcrumb"
				class="{isPlaying.value
					? 'opacity-0'
					: 'opacity-100'} absolute top-1 left-3 md:top-10 md:left-10 font-bold text-slate-200 md:px-0 transition-all duration-150 flex items-center z-50"
			>
				<a href="/" class="line-clamp-1">{m.breadcrumb_home()} </a> <span class="mx-2">⇀</span>
				<a href="/phim-hoat-hinh" class="line-clamp-1"> Anime</a>
				{#if kkPhimHoatHinhDetail?.movie}
					<span class="mx-2">⇀</span>
					<a class="line-clamp-1" href="/phim-hoat-hinh/{kkPhimHoatHinhDetail.movie.slug}"
						>{getLocale() === 'vi'
							? kkPhimHoatHinhDetail.movie.name
							: kkPhimHoatHinhDetail.movie.origin_name}</a
					>
					{#if page.url.pathname !== `/phim-hoat-hinh/${kkPhimHoatHinhDetail.movie.slug}`}
						<span class="mx-2">⇀</span>
						<a class="line-clamp-1" href={page.url.pathname}
							>{page.url.pathname.split('/').pop() || ''}</a
						>
					{/if}
				{/if}
			</nav>

			<ButtonSecondary
				aria-label="Open sidebar"
				class="{isPlaying.value
					? 'opacity-0'
					: 'opacity-100'} backdrop-blur-2xl border-[0.5px] border-white/20 px-4 py-1 rounded-full text-slate-400 hover:text-white cursor-pointer transition-all duration-200 absolute top-8 left-3 md:top-20 md:left-10 z-50 flex items-center"
				onclick={(e: any) => {
					e.stopPropagation();
					sidebarOpen.value = !sidebarOpen.value;
				}}
			>
				{#if !sidebarOpen.value}
					<p>{m.reuse_episodes()}</p>
				{/if}
			</ButtonSecondary>
			{@render children?.()}
		</div>
	</section>
{/key}
