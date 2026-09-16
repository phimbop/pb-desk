<script lang="ts">
	import { DOMAIN_TMDB_IMAGE_CDN } from '$lib';
	import CommonHelper from '$lib/helper/commentHelper';
	import tooltip from '$lib/helper/tooltip';
	import { m } from '$lib/paraglide/messages';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import { moviesHandler, myListMoviesStore } from '../../runes/movieStore.svelte';
	import IconHeartFill from '../Icon/IconHeartFill.svelte';
	import IconPlus from '../Icon/IconPlus.svelte';
	import Play from '../Icon/Play.svelte';
	import Star from '../Icon/Star.svelte';
	import Image from '../Image/Image.svelte';
	let {
		movie,
		showDate = false,
		class: className = '',
		source = 'tmdb',
		isCritical = false
	}: {
		movie: Movie | TmdbMovieDetail | TvSeriesDetail | any;
		showDate?: boolean;
		class?: string;
		source?: movieResource;
		isCritical?: boolean;
	} = $props();
	let movieListed = $derived(
		Array.isArray(myListMoviesStore.value) && myListMoviesStore.value.some((item: any) => 
			(item.id && movie?.id && item.id == movie.id) ||
			(item._id && movie?._id && item._id == movie._id) ||
			(item.slug && movie?.slug && item.slug == movie.slug)
		)
	);
</script>

<a
	href={localizeHref(movie.first_air_date
		? `/tv/${CommonHelper.stringToSlug(movie.name || movie.title)}/${movie.id}`
		: `/phim/${CommonHelper.stringToSlug(movie.title || movie.name)}/${movie.id}`)}
	class="w-full h-fit grid grid-cols-1 gap-2 group/mfilter {className}"
>
	<div class="overflow-hidden w-full rounded-sm aspect-2/3 cursor-pointer relative group z-10">
		<button
			aria-label="Add to My List from movie filter"
			class="{movieListed
				? 'opacity-100'
				: 'opacity-0'} group-hover:opacity-100 transition duration-200 ease-in-out absolute top-1 right-1 z-10 p-2 bg-white/20 backdrop-blur-xs hover:bg-slate-900/40 rounded-full flex items-center justify-center"
			use:tooltip={{
				text: movieListed ? m.reuse_remove_favorite() : m.reuse_save_favorite(),
				position: 'top-right'
			}}
			onclick={async (e) => {
				e.preventDefault();
				await moviesHandler.updateMyListMovies(movie, source);
			}}
		>
			{#if movieListed}
				<IconHeartFill class="w-6 h-6 text-neonPink-500 cursor-pointer" />
			{:else}
				<IconPlus class="w-6 h-6 text-gray-200 cursor-pointer" />
			{/if}
		</button>
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
						? new Date(movie.release_date || movie.first_air_date).toLocaleString('vi-VN', {
								day: 'numeric',
								month: 'short',
								year: 'numeric'
							})
						: (movie.release_date?.slice(0, 4) ?? movie.first_air_date?.slice(0, 4) ?? '')}
				</span>
				<div class="text-sm text-slate-200 flex items-center gap-1">
					<Star />
					{movie.vote_average?.toFixed(1) ?? ''}
				</div>
			</div>
		</div>
		<Image
			class="object-cover w-full h-full aspect-2/3 group-hover:scale-110 transition duration-200 ease-in-out rounded-sm"
			src="{DOMAIN_TMDB_IMAGE_CDN}/t/p/w300{movie.poster_path}"
			alt={movie.title || movie.name}
			{isCritical}
		/>
	</div>
	<div class="w-full flex items-center flex-wrap mb-4">
		<h2
			class="text-slate-200 group-hover/mfilter:text-neonPink-500 transition duration-200 ease-in-out truncate"
		>
			{movie.title || movie.name}
		</h2>
	</div>
</a>
