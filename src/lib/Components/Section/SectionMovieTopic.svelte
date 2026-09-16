<script lang="ts">
	import { fade } from "svelte/transition";
	import CardMyMoviesList from "../Card/CardMyMoviesList.svelte";
	import IconArrowRight from "../Icon/IconArrowRight.svelte";
	import { m } from "$lib/paraglide/messages";

	interface Props {
		title: string;
		movieList?: TopMovieList[];
		loaded?: boolean;
	}
	let { title, movieList = [], loaded = false }: Props = $props();

	let endIndex = $state(8);
</script>

<section transition:fade class="w-full h-fit relative my-10 container mx-auto">
	<div class="flex items-center space-x-2 mb-5">
		<h2 class="text-2xl font-bold text-slate-200 px-2 md:px-0">{title}</h2>
		{#if loaded && movieList.length > 0}
			<button
				class="group flex w-fit items-center gap-4 rounded-full border-none p-1 pl-4 transition-all duration-200 cursor-pointer active:text-neonPink-500 active:scale-95"
				onclick={() => {
					if (endIndex < movieList.length) {
						endIndex = movieList.length;
					} else {
						endIndex = 8;
					}
				}}
			>
				<span class="dark:border-background block h-4 w-0.5 border-l bg-zinc-700"></span>
				<span class="text-slate-400 text-sm"
					>{endIndex !== movieList.length ? m.sectionmovietopic_btn_xem_them() : m.sectionmovietopic_btn_thu_gon()}</span
				>
				<div class="bg-background group-hover:bg-muted size-6 overflow-hidden rounded-full duration-500">
					<div class="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
						<span class="flex size-6">
							<IconArrowRight class="m-auto size-3 text-slate-400" />
						</span>
						<span class="flex size-6">
							<IconArrowRight class="m-auto size-3 text-slate-400" />
						</span>
					</div>
				</div>
			</button>
		{/if}
	</div>

	{#if !loaded}
		<!-- Skeleton Loader -->
		<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 px-2 md:px-0 w-full h-full">
			{#each Array(8) as _, i (i)}
				<div class="w-full h-full grid grid-cols-1 gap-2 animate-pulse">
					<div class="overflow-hidden w-full rounded-sm aspect-2/3 bg-slate-800/60 relative"></div>
					<div class="w-full flex items-center mb-4">
						<div class="h-4 bg-slate-800/60 rounded-xs w-3/4"></div>
					</div>
				</div>
			{/each}
		</div>
	{:else if movieList.length > 0}
		<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 px-2 md:px-0 w-full h-full">
			{#each movieList.slice(0, endIndex) as movie, i (movie.movie?._id || movie.movie?.id || movie.movie?.slug || i)}
				<CardMyMoviesList showDate={false} class="" showWatchedTime={false} movie={movie.movie} />
			{/each}
		</div>
	{:else}
		<div class="text-slate-500 text-sm px-2 md:px-0 py-4">{m.sectionmovietopic_empty()}</div>
	{/if}
</section>
