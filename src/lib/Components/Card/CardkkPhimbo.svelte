<script lang="ts">
	import { getKKImageUrl } from '$lib';
	import tooltip from '$lib/helper/tooltip';
	import { moviesHandler, myListMoviesStore } from '$lib/runes/movieStore.svelte';
	import IconHeartFill from '../Icon/IconHeartFill.svelte';
	import IconPlus from '../Icon/IconPlus.svelte';
	import Play from '../Icon/Play.svelte';
	import Image from '../Image/Image.svelte';
	 let {movie, showDate, class: className = ''} : {movie: NonNullable<kkPhimboType['data']>['items'][0], showDate: boolean, class: string} = $props();
	let movieListed = $derived(
		myListMoviesStore.value.some((item: any) => 
			(item._id && movie._id && item._id == movie._id) ||
			(item.slug && movie.slug && item.slug == movie.slug)
		)
	);
</script>

<a
	href="/phim-bo/{movie.slug}"
	class="w-full h-full grid grid-cols-1 gap-2 group/mfilter {className}"
>
	<div class="overflow-hidden w-full rounded-sm aspect-2/3 cursor-pointer relative group z-10">
		<button
			aria-label="Add to My List"
			class="{movieListed
				? 'opacity-100'
				: 'opacity-0'} group-hover:opacity-100 transition duration-200 ease-in-out absolute top-1 right-1 z-10 p-2 bg-white/20 backdrop-blur-xs hover:bg-slate-900/40 rounded-full flex items-center justify-center"
			use:tooltip={{
				text: `${movieListed ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}`,
				position: 'top-right'
			}}
			onclick={async (e) => {
				e.preventDefault();
				await moviesHandler.updateMyListMovies(movie, 'kk');
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
					{showDate ? movie.year ?? '' : ''}
				</span>
				<div class="text-sm text-slate-200 flex items-center gap-1">
					{movie.episode_current ?? ''}
				</div>
			</div>
		</div>
		<Image
			class="object-cover w-full h-full aspect-2/3 group-hover:scale-110 transition duration-200 ease-in-out rounded-sm"
			src={getKKImageUrl(movie.poster_url)}
			alt={movie.name}
			srcset="{getKKImageUrl(movie.poster_url)}?width=1200 1200w, {getKKImageUrl(movie.poster_url)}?width=300 300w, {getKKImageUrl(movie.poster_url)}?width=79 79w"
			sizes="(max-width: 600px) 79px, (max-width: 1200px) 300px, 1200px"
		/>
	</div>
	<div class="w-full flex items-center flex-wrap mb-4">
		<h2
			class="text-slate-200 group-hover/mfilter:text-neonPink-500 transition duration-200 ease-in-out truncate"
		>
			{movie.name}
		</h2>
	</div>
</a>
