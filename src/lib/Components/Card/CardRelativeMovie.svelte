<script lang="ts">
	import { tmdbImageUrl } from "$lib";
	import CommonHelper from "$lib/helper/commentHelper";
	import LoadingImage from "../Image/LoadingImage.svelte";

	interface Props {
		movie: Movie;
	}

	let { movie }: Props = $props();

</script>
<a href="/phim/{CommonHelper.stringToSlug(movie.title)}/{movie.id}" class="flex rounded-xl overflow-hidden w-full group/rmovie hover:cursor-pointer">
    <div class="flex items-center justify-center object-cover overflow-hidden w-12 h-16">
        {#if movie.poster_path}
        <img src="{tmdbImageUrl + movie.poster_path}" alt="{movie.title}">
        {:else}
        <LoadingImage />
        {/if}
    </div>
    <div class="flex flex-1 flex-col ml-2 group-hover/rmovie:bg-neutral-800 transition-all duration-200">
        <h2 class="text-lg primary-text flex flex-wrap group-hover/rmovie:text-neonPink-500 transition-all duration-200">{movie.title}</h2>
        <div class="flex items-center gap-2 text-slate-200">
            <p class="text-sm">{movie.release_date?.slice(0, 4) ?? ''}</p>
            <svg
						xmlns="http://www.w3.org/2000/svg"
						class="icon icon-tabler icon-tabler-star-filled w-4 h-4"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						fill="none"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path stroke="none" d="M0 0h24v24H0z" fill="none" />
						<path
							d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z"
							stroke-width="0"
							fill="currentColor"
						/>
					</svg>
            <p class="text-sm">{movie.vote_average?.toFixed(1) ?? ''}</p>
        </div>
    </div> 

</a>