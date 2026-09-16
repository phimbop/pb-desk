<script lang="ts">
	import type { Movie } from '$lib/types';
	import { api } from '$lib/ipc';
	import { onMount } from 'svelte';

	interface Props {
		movie: Movie;
		showDate?: boolean;
		class?: string;
	}

	let { movie, showDate = true, class: className = '' }: Props = $props();

	let isFav = $state(false);

	onMount(async () => {
		try {
			isFav = await api.isFavorite(movie.slug);
		} catch {
			// ignore
		}
	});

	const toggleFav = async (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		try {
			isFav = await api.toggleFavorite({
				movie_slug: movie.slug,
				movie_name: movie.name,
				origin_name: movie.origin_name,
				poster_url: movie.poster_url || movie.thumb_url,
				year: movie.year,
				quality: movie.quality,
				episode_current: movie.episode_current
			});
		} catch (err) {
			console.error('Failed to toggle favorite:', err);
		}
	};
</script>

<div
	class="group relative flex flex-col rounded-xl overflow-hidden bg-neutral-900/60 border border-slate-800/80 hover:border-slate-700 transition-all duration-300 hover:shadow-xl hover:shadow-black/60 {className}"
>
	<!-- Poster Container with Aspect Ratio -->
	<a href="/phim/{movie.slug}" class="relative w-full aspect-[2/3] overflow-hidden bg-neutral-950 block">
		<img
			src={movie.poster_url || movie.thumb_url}
			alt={movie.name}
			class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
			loading="lazy"
		/>

		<!-- Gradient Vignette -->
		<div class="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>

		<!-- Top Badges -->
		<div class="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
			<div class="flex items-center space-x-1">
				{#if movie.quality}
					<span class="px-1.5 py-0.5 rounded bg-amber-500/90 text-slate-950 font-extrabold text-[10px] shadow-sm uppercase">
						{movie.quality}
					</span>
				{/if}
				{#if movie.lang}
					<span class="px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-slate-200 font-semibold text-[10px] border border-white/10">
						{movie.lang}
					</span>
				{/if}
			</div>

			<!-- Favorite Button -->
			<button
				onclick={toggleFav}
				class="pointer-events-auto p-1.5 rounded-full bg-neutral-950/70 backdrop-blur-md text-slate-300 hover:text-neonPink-400 hover:scale-110 active:scale-95 transition-all shadow-md"
				title={isFav ? 'Bỏ lưu' : 'Lưu phim'}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="w-3.5 h-3.5 {isFav ? 'fill-neonPink-500 text-neonPink-500' : 'text-slate-300'}"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					fill="none"
				>
					<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
					<path d="M18 7v14l-6 -4l-6 4v-14a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4z"/>
				</svg>
			</button>
		</div>

		<!-- Play Button on Hover -->
		<div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
			<div class="w-12 h-12 rounded-full bg-neonPink-500/90 text-white flex items-center justify-center shadow-lg shadow-neonPink-500/50 transform group-hover:scale-100 scale-75 transition-transform duration-300">
				<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 fill-current translate-x-0.5" viewBox="0 0 24 24">
					<path d="M8 5v14l11-7z"/>
				</svg>
			</div>
		</div>

		<!-- Bottom Episode Tag -->
		{#if movie.episode_current}
			<div class="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
				<span class="px-2 py-0.5 rounded-md bg-neonPink-950/80 border border-neonPink-500/30 text-neonPink-300 text-[10px] font-semibold backdrop-blur-sm">
					{movie.episode_current}
				</span>
				{#if showDate && movie.year}
					<span class="text-[11px] font-bold text-slate-300 drop-shadow">
						{movie.year}
					</span>
				{/if}
			</div>
		{/if}
	</a>

	<!-- Title Details -->
	<div class="p-2.5 flex flex-col justify-between flex-1 space-y-1">
		<a href="/phim/{movie.slug}" class="block group-hover:text-neonPink-400 transition-colors">
			<h3 class="text-xs sm:text-sm font-bold text-slate-200 line-clamp-1 leading-snug" title={movie.name}>
				{movie.name}
			</h3>
			{#if movie.origin_name}
				<p class="text-[11px] text-slate-400/80 line-clamp-1 italic" title={movie.origin_name}>
					{movie.origin_name}
				</p>
			{/if}
		</a>
	</div>
</div>
