<script lang="ts">
	import { getKKImageUrl, DOMAIN_TMDB_IMAGE_CDN } from '$lib';
	import CommonHelper from '$lib/helper/commentHelper';
	import tooltip from '$lib/helper/tooltip';
	import { m } from '$lib/paraglide/messages';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import type { Movie, TmdbMovieDetail, TvSeriesDetail } from '../../../types/Tmdb';
	import { moviesHandler, myListMoviesStore } from '../../runes/movieStore.svelte';
	import IconPlus from '../Icon/IconPlus.svelte';
	import IconUserMinus from '../Icon/IconUserMinus.svelte';
	import Play from '../Icon/Play.svelte';
	import Star from '../Icon/Star.svelte';
	import Image from '../Image/Image.svelte';
	let {
		movie,
		showDate = false,
		showWatchedTime = false,
		class: className = '',
		isCritical
	}: {
		movie:
			| Movie
			| kkPhimboDetailType
			| kkMovie
			| TmdbMovieDetail
			| PlayerMovieInfo
			| any;
		showDate?: boolean;
		showWatchedTime?: boolean;
		class?: string;
		isCritical?: boolean;
	} = $props();
	let watchPercent = $derived(
		movie.duration && isFinite(movie.duration) && movie.duration > 0
			? Math.round((movie.playedTime / movie.duration) * 100)
			: 0
	);
	let isInMyList = $derived(
		myListMoviesStore.value.some((item) => 
			(item.id && movie.id && item.id == movie.id) || 
			(item._id && movie._id && item._id == movie._id) ||
			(item.slug && movie.slug && item.slug == movie.slug)
		)
	);
	
	let resolvedSource = $derived.by(() => {
		if (movie.source) return movie.source;
		if (
			movie.poster_path?.startsWith('/') ||
			(movie.poster_url?.startsWith('/') && !movie.poster_url.includes('uploads/'))
		) {
			return movie.type === 'tv' ? 'tmdbTv' : 'tmdb';
		}
		if (movie.thumb_url?.includes('uploads/') || movie.poster_url?.includes('uploads/')) {
			return 'op';
		}
		return 'kk';
	});

	let resolvedType = $derived.by(() => {
		if (movie.type) return movie.type;
		if (resolvedSource === 'tmdb') return 'single';
		if (resolvedSource === 'tmdbTv') return 'tv';
		return 'single';
	});

	let isTmdb = $derived(resolvedSource === 'tmdb' || resolvedSource === 'tmdbTv');

	let resolvedImage = $derived.by(() => {
		const raw = movie.poster_url || movie.poster_path || movie.thumb_url || '';
		if (!raw) return '';
		if (isTmdb) {
			if (raw.startsWith('http://') || raw.startsWith('https://')) {
				return raw.replace(/https?:\/\/image\.tmdb\.org/, DOMAIN_TMDB_IMAGE_CDN);
			}
			const clean = raw.startsWith('/') ? raw : `/${raw}`;
			return `${DOMAIN_TMDB_IMAGE_CDN}/t/p/w300${clean}`;
		}
		return getKKImageUrl(raw);
	});
</script>

<a
	href={localizeHref(resolvedSource === 'tmdb'
		? `/phim/${CommonHelper.stringToSlug((movie.name || movie.title || '').toString())}/${movie.id}`
		: resolvedSource === 'tmdbTv'
			? `/tv/${CommonHelper.stringToSlug((movie.name || movie.title || '').toString())}/${movie.id}`
			: resolvedSource === 'kk' && resolvedType === 'single'
				? `/phim-le/${movie.slug}`
				: resolvedType === 'hoathinh'
					? `/phim-hoat-hinh/${movie.slug}`
					: `/phim-bo/${movie.slug}`)}
	class="w-full h-full grid grid-cols-1 gap-2 group/mfilter {className}"
>
	<div class="overflow-hidden w-full rounded-sm aspect-2/3 cursor-pointer relative group z-10">
		<button
			aria-label="Add to My movie List"
			class="opacity-0 group-hover:opacity-100 transition duration-200 ease-in-out absolute top-1 right-1 z-10 p-2 bg-white/20 backdrop-blur-xs hover:bg-slate-900/40 rounded-full flex items-center justify-center"
			use:tooltip={{
				text: isInMyList ? m.reuse_remove_favorite() : m.reuse_save_favorite(),
				position: 'top-right'
			}}
			onclick={async (e) => {
				e.preventDefault();
				await moviesHandler.updateMyListMovies(movie, resolvedSource);
			}}
		>
			{#if isInMyList}
				<IconUserMinus class="w-6 h-6 text-neonPink-500 cursor-pointer" />
			{:else}
				<IconPlus class="w-6 h-6 text-gray-200 cursor-pointer" />
			{/if}
		</button>
		{#if showWatchedTime}
			{#if isTmdb}
				<div
					class="w-10 h-10 absolute top-1 left-1 flex items-center justify-center rounded-full overflow-hidden bg-white/20 backdrop-blur-xs z-10"
					use:tooltip={{
						text: m.tooltip_watched_percentage({ percent: 100 }),
						position: 'top-left'
					}}
				>
					<svg class="w-full h-full transform -rotate-90">
						<circle
							class="text-white/20"
							stroke-width="8"
							stroke="currentColor"
							fill="transparent"
							r="20"
							cx="20"
							cy="20"
						/>
						<circle
							class="text-neonPink-500"
							stroke-width="8"
							stroke-dasharray={20 * 2 * Math.PI}
							stroke-dashoffset={0}
							stroke="currentColor"
							fill="transparent"
							r="20"
							cx="20"
							cy="20"
						/>
					</svg>
					<span class="text-xs text-slate-200 absolute">✓</span>
				</div>
			{:else}
				<div
					class="w-10 h-10 absolute top-1 left-1 flex items-center justify-center rounded-full overflow-hidden bg-white/20 backdrop-blur-xs z-10"
					use:tooltip={{
						text: m.tooltip_watched_percentage({ percent: isNaN(watchPercent) ? 0 : watchPercent }),
						position: 'top-left'
					}}
				>
					<svg class="w-full h-full transform -rotate-90">
						<circle
							class="text-white/20"
							stroke-width="8"
							stroke="currentColor"
							fill="transparent"
							r="20"
							cx="20"
							cy="20"
						/>
						<circle
							class={watchPercent >= 100 ? 'text-neonPink-500' : 'text-white'}
							stroke-width="8"
							stroke-dasharray={20 * 2 * Math.PI}
							stroke-dashoffset={20 * 2 * Math.PI -
								((isNaN(watchPercent) ? 0 : watchPercent) / 100) * (20 * 2 * Math.PI)}
							stroke="currentColor"
							fill="transparent"
							r="20"
							cx="20"
							cy="20"
						/>
					</svg>
					<span class="text-xs text-slate-200 absolute"
						>{isNaN(watchPercent) ? 0 : watchPercent}%</span
					>
				</div>
			{/if}
		{/if}
		<Play
			class="opacity-0 group-hover:opacity-100 transition duration-200 ease-in-out cursor-pointer"
		/>
		<div
			class="rounded-sm z-10 opacity-0 group-hover:opacity-100 transition duration-200 ease-in-out cursor-pointer absolute from-neonPink-800 to-transparent bg-linear-to-t inset-x-0 bottom-0 text-white flex w-full h-1/2"
		>
			<div
				class="w-full h-full p-4 flex opacity-0 items-end justify-between group-hover:opacity-100 group-hover:translate-y-0 translate-y-4 transition-all duration-200 ease-in-out"
			>
				<span class="text-sm text-slate-200">
					{showDate
						? new Date(movie.year).toLocaleString(getLocale(), {
								day: 'numeric',
								month: 'short',
								year: 'numeric'
							})
						: isTmdb
							? movie.year?.slice(0, 4)
							: (movie.year ?? '')}
				</span>
				<div class="text-sm text-slate-200 flex items-center gap-1">
					{#if isTmdb}
						<Star />
						{movie.vote_average.toFixed(1) ?? ''}
					{:else}
						{movie.time ?? ''}
					{/if}
				</div>
			</div>
		</div>
		<Image
			class="object-cover w-full h-full aspect-2/3 group-hover:scale-110 transition duration-200 ease-in-out rounded-sm"
			{isCritical}
			loading={isCritical ? 'eager' : 'lazy'}
			src={resolvedImage}
			alt={movie.name || movie.title || ''}
			srcset={isTmdb
				? `${resolvedImage} 300w`
				: `${resolvedImage}?width=300 1200w, ${resolvedImage}?width=300 300w, ${resolvedImage}?width=79 79w`}
			sizes="(max-width: 600px) 178px, (max-width: 1200px) 178px, 178px"
		/>
	</div>
	<div class="w-full flex items-center flex-wrap mb-4">
		<h3
			class="text-slate-200 group-hover/mfilter:text-neonPink-500 transition duration-200 ease-in-out truncate"
		>
			{getLocale() === 'vi' ? (movie.name || movie.title || '') : (movie.origin_name || movie.name || movie.title || '')}
		</h3>
	</div>
</a>
