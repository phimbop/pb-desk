<script lang="ts">
	import IconPlay from '../Icon/IconPlay.svelte';
	import Image from '../Image/Image.svelte';
	import { getKKImageUrl } from '$lib';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	let {
		movie,
		showDate,
		imgSize
	}: { movie: NonNullable<kkPhimboType['data']>['items'][0]; showDate: boolean; imgSize: string } = $props();
</script>

<a
	href="/{movie.type == 'single' ? 'phim-le' : 'phim-bo'}/{movie.slug}"
	class="w-full h-full grid grid-cols-10 group/mfilter relative cursor-pointer"
>
	<div class="w-full col-span-4 bg-slate-900 rounded-tl-3xl rounded-bl-3xl">
		<div class="absolute top-6 left-4 z-50 max-w-[50%]">
			<h2
				class="text-slate-200 group-hover/mfilter:text-neonPink-500 transition duration-200 ease-in-out font-extrabold text-3xl line-clamp-3 text-ellipsis"
			>
				{getLocale() === 'vi' ? movie.name : ''} ({movie.origin_name})
			</h2>
		</div>
		<div class="absolute bottom-8 left-4 flex items-center space-x-2">
			<IconPlay class="w-6 h-6" />
			<p class="text-slate-200 transition duration-200 ease-in-out text-wrap font-extrabold z-50">
				{m.cardMovieFeature_watchMovieContent()}
			</p>
		</div>
	</div>
	<div
		class="overflow-hidden w-full h-60 rounded-tr-3xl rounded-br-3xl aspect-video cursor-pointer relative group z-10 col-span-6"
	>
		<div
			class="z-20 transition duration-200 ease-in-out cursor-pointer absolute from-slate-900 to-transparent bg-linear-to-r inset-x-0 bottom-0 text-white flex w-full h-full -translate-x-1"
		></div>
		<Image
			isCritical={true}
			class="object-cover w-full h-full aspect-video ease-in-out rounded-tr-3xl rounded-br-3xl"
			src="{getKKImageUrl(movie.poster_url)}?width={imgSize}"
			alt={movie.name}
			srcset="{getKKImageUrl(movie.poster_url)}?width={imgSize} 1200w"
			sizes="(max-width: 600px) 79px, (max-width: 1200px) 400px, 1200px"
		/>
	</div>

	<div
		class="rounded-bl-3xl rounded-br-3xl z-10 opacity-0 group-hover/mfilter:opacity-100 transition duration-200 ease-in-out cursor-pointer absolute from-neonPink-800 to-transparent bg-linear-to-t inset-x-0 bottom-0 text-white flex w-full h-1/2"
	>
		<div
			class="w-full h-full p-4 flex opacity-0 items-end justify-between group-hover/mfilter:opacity-100 group-hover/mfilter:translate-y-0 translate-y-4 transition-all duration-200 ease-in-out"
		>
			<span class="text-sm text-slate-200">
				{showDate ? (movie.year ?? '') : ''}
			</span>
			<div class="text-sm text-slate-200 flex items-center gap-1">
				{movie.type === 'single' ? m.reuse_movies() : m.reuse_series()}
			</div>
		</div>
	</div>
</a>
