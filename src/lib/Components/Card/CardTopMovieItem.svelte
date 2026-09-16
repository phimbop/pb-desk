<script lang="ts">
	import { getKKImageUrl, DOMAIN_TMDB_IMAGE_CDN } from '$lib';
	import CommonHelper from '$lib/helper/commentHelper';
	import IconEyes from '../Icon/IconEyes.svelte';
	import Play from '../Icon/Play.svelte';
	import Star from '../Icon/Star.svelte';
	import Image from '../Image/Image.svelte';
	import Loading1 from '../Loading1.svelte';
	let {movie, showDate = false, style = '', watching = 0, class: className = ''} : {movie: Movie | TmdbMovieDetail | PlayerMovieInfo | any, showDate: boolean, style: string, watching: number, class: string} = $props();
	function formatViews(views: number) {
		if (views >= 1000) {
			return (views / 1000).toFixed(1) + 'k';
		}
		return views.toString();
	}
</script>

<a
	href={movie.source === 'tmdb'
		? `/phim/${CommonHelper.stringToSlug(movie.name.toString())}/${movie.id}`
		: movie.source === 'tmdbTv'
		? `/tv/${CommonHelper.stringToSlug(movie.name.toString())}/${movie.id}`
		: movie.source === 'kk' && movie.type === 'single'
		? `/phim-le/${movie.slug}`
		: movie.type === 'hoathinh'
		? `/phim-hoat-hinh/${movie.slug}`
		: `/phim-bo/${movie.slug}`}
	class="w-svw sm:w-80 max-w-sm flex items-center gap-2 group/mfilter {className}"
	{style}
>
	<div class="overflow-hidden w-16 h-full aspect-3/4 rounded-sm cursor-pointer relative group z-10">
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
						? new Date(movie.year).toLocaleString('vi-VN', {
								day: 'numeric',
								month: 'short',
								year: 'numeric'
						  })
						: movie.source === 'tmdb' || movie.source === 'tmdbTv'
						? movie.year?.slice(0, 4)
						: movie.year ?? ''}
				</span>
				<div class="text-sm text-slate-200 flex items-center gap-1">
					{#if movie.source === 'tmdb' || movie.source === 'tmdbTv'}
						<Star />
						{movie.vote_average.toFixed(1) ?? ''}
					{:else}
						{movie.time ?? ''}
					{/if}
				</div>
			</div>
		</div>
		<Image
			class="object-cover w-full h-full group-hover:scale-110 transition duration-200 ease-in-out rounded-sm"
			src={movie.source === 'tmdb' || movie.source === 'tmdbTv'
				? `${DOMAIN_TMDB_IMAGE_CDN}/t/p/w300${movie.poster_url}`
				: getKKImageUrl(movie.poster_url)}
			alt={movie.name}
			srcset={movie.source === 'tmdb' || movie.source === 'tmdbTv'
				? `${DOMAIN_TMDB_IMAGE_CDN}/t/p/w300${movie.poster_url} 300w`
				: `${getKKImageUrl(movie.poster_url)}?width=1200 1200w, ${getKKImageUrl(movie.poster_url)}?width=178 178w,${getKKImageUrl(movie.poster_url)}?width=79 79w`}
			sizes="(max-width: 600px) 79px, (max-width: 1200px) 178px, 1200px"
		/>
	</div>
	<div class="space-y-4 flex-1 truncate">
		<h2
			class="text-slate-200 group-hover/mfilter:text-neonPink-500 transition duration-200 ease-in-out truncate max-w-sm"
		>
			{movie.name}
		</h2>
		<div class="flex items-center justify-between w-full">
			<p class="text-sm text-slate-200">
				{movie.source === 'tmdb' ? movie.year?.slice(0, 4) : movie.year ?? ''}
			</p>
			{#if watching}
				<Loading1 />
				<div class="flex items-center gap-2">
					<IconEyes class="w-5 h-5 text-slate-50" />
					<p class="text-sm text-slate-50">{formatViews(watching)}</p>
				</div>
			{/if}
		</div>
	</div>
</a>
