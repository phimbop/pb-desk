<script lang="ts">
	import { DOMAIN_TMDB_IMAGE_CDN } from "$lib";

	interface Props {
		movie: Movie;
	}

	let { movie }: Props = $props();
</script>

<div
	class="overflow-hidden w-full h-full rounded-[80px] aspect-video cursor-pointer relative group z-10"
>
	<!-- <div class=" w-full h-80 absolute z-50 -top-2  bg-linear-to-b from-neutral-950 to-transparent inset-x-0" /> -->
	<!-- <div class=" w-full h-full absolute z-10 bg-linear-to-tl from-neutral-950 to-transparent " /> -->
	<!-- <div class=" w-full h-full absolute z-10 bg-linear-to-tr from-neutral-950 to-transparent " /> -->
	<div
		class=" w-full h-80 absolute z-10 -bottom-2 bg-linear-to-t from-neutral-950 to-transparent inset-x-0"
	></div>
	<!-- <div class="absolute z-50 top-1/2 h-full w-full bg-neutral-950/90 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div> -->
	<div
		class="rounded-3xl z-10 opacity-0 group-hover:opacity-100 transition duration-200 ease-in-out cursor-pointer absolute from-[rgba(120,119,198,0.2)] to-transparent bg-linear-to-t inset-x-0 -bottom-2 text-white flex items-end"
	>
		<div>
			<div
				class=" p-4 space-y-3 text-xl group-hover:opacity-100 group-hover:translate-y-0 translate-y-4 pb-20 transform transition duration-200 ease-in-out"
			>
				<h3>
					<span
						class="bg-linear-to-t from-transparent to-slate-200 bg-clip-text text-5xl text-transparent font-bold"
					>
						{movie.title}
					</span>
				</h3>
				<div class="opacity-60 text-sm">
					{movie.overview}
				</div>
			</div>
		</div>
	</div>
	<img
		class="object-cover w-full aspect-video group-hover:scale-110 transition duration-200 ease-in-out rounded-3xl"
		src="{DOMAIN_TMDB_IMAGE_CDN}/t/p/original{movie.backdrop_path}"
		alt={movie.title}
	/>
</div>
