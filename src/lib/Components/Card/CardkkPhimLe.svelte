<script lang="ts">
	import { getKKImageUrl } from '$lib';
	import tooltip from '$lib/helper/tooltip';
	import { getLocale } from '$lib/paraglide/runtime';
	import { moviesHandler, myListMoviesStore } from '../../runes/movieStore.svelte';
	import IconHeartFill from '../Icon/IconHeartFill.svelte';
	import IconPlus from '../Icon/IconPlus.svelte';
	import Play from '../Icon/Play.svelte';
	import Image from '../Image/Image.svelte';
	let {
		movie,
		showDate,
		class: className = '',
		type = ''
	}: { movie: any; showDate?: boolean; class?: string; type?: string } = $props();
	let movieListed = $derived(
		myListMoviesStore.value.some((item: any) => 
			(item._id && movie._id && item._id == movie._id) ||
			(item.slug && movie.slug && item.slug == movie.slug)
		)
	);
	let resolvedType = $derived(
		type ||
		(movie.type === 'single'
			? 'phim-le'
			: movie.type === 'hoathinh'
				? 'phim-hoat-hinh'
				: 'phim-bo')
	);
	let targetUrl = $derived(
		resolvedType.startsWith('/')
			? `${resolvedType}/${movie.slug}`
			: `/${resolvedType}/${movie.slug}`
	);
</script>

<a
	href={targetUrl}
	class="w-full h-fit grid grid-cols-1 gap-2 group/mfilter {className}"
>
	<div class="overflow-hidden w-full rounded-sm aspect-2/3 cursor-pointer relative group z-10">
		<button
			aria-label="Add to My List phim le"
			class="{movieListed
				? 'opacity-100'
				: 'opacity-0'} group-hover:opacity-100 transition duration-200 ease-in-out absolute top-1 right-1 z-10 p-2 bg-white/20 backdrop-blur-xs hover:bg-slate-900/40 rounded-full flex items-center justify-center"
			use:tooltip={{
				text: `${movieListed ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}`,
				position: 'top-right'
			}}
			onclick={async (e) => {
				e.preventDefault();
				console.log('🚀 ~ file: +page.svelte:41 ~ onclick add movie to my list phimle...:');
				await moviesHandler.updateMyListMovies(movie, 'kk');
				console.log('🚀 ~ file: +page.svelte:41 ~ onclick add movie to my list phimle...FINISH!!');
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
					{showDate ? (movie.year ?? '') : ''}
				</span>
				<div class="text-sm text-slate-200 flex items-center gap-1">
					{movie.time ?? ''}
				</div>
			</div>
		</div>
		<Image
			class="object-cover w-full h-full aspect-2/3 group-hover:scale-110 transition duration-200 ease-in-out rounded-sm"
			src={getKKImageUrl(movie.poster_url || movie.thumb_url)}
			alt={movie.name}
			srcset="{getKKImageUrl(movie.poster_url || movie.thumb_url)}?width=300 1200w, {getKKImageUrl(movie.poster_url || movie.thumb_url)}?width=300 300w, {getKKImageUrl(movie.poster_url || movie.thumb_url)}?width=79 79w"
			sizes="(max-width: 600px) 300px, (max-width: 1200px) 300px, 1200px"
		/>
	</div>
	<div class="w-full flex items-center flex-wrap mb-4">
		<h3
			class="text-slate-200 group-hover/mfilter:text-neonPink-500 transition duration-200 ease-in-out truncate"
		>
			{getLocale() === 'vi' ? movie.name : movie.origin_name}
		</h3>
	</div>
</a>
