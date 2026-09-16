<script lang="ts">
	import { tmdbImageUrl } from '$lib';
	import CommonHelper from '$lib/helper/commentHelper';
	import tooltip from '$lib/helper/tooltip';
	import { m } from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
	import type { TmdbMovieDetail } from '../../../types/Tmdb';
	import Image from '../Image/Image.svelte';
	interface Props {
		cast: 
		| TmdbMovieDetail['credits']['cast'][0]
		| TmdbMovieDetail['credits']['crew'][0]
		| any;
	}

	let { cast }: Props = $props();
</script>

<div
	class="grid grid-cols-3 bg-slate-700/50 hover:bg-slate-700/20 p-2 gap-2 rounded-sm backdrop-blur-xl items-center transition-all duration-150"
>
	<div class="col-span-1">
		<div class="flex flex-col items-center">
			<a
				href="/dien-vien/{CommonHelper.stringToSlug(cast.name)}/{cast.id}"
				class="flex items-center justify-center w-24 h-24 overflow-hidden object-cover rounded-full cursor-pointer border border-neutral-700"
				use:tooltip={{ text: cast.name, position: 'top' }}
			>
				{#if cast.profile_path}
					<Image src="{tmdbImageUrl}{cast.profile_path}" alt={cast.name} />
				{:else}
					<img src="https://ui-avatars.com/api/name={cast.name}" alt={cast.name} />
				{/if}
			</a>
		</div>
	</div>
	<div class="col-span-2 flex flex-col">
		<a
			href="/dien-vien/{CommonHelper.stringToSlug(cast.name)}/{cast.id}"
			use:tooltip={{ text: cast.name, position: 'top' }}
		>
			<h2 class="primary-text text-2xl">{cast.name}</h2>
		</a>
		<div class="flex items-center flex-wrap gap-2">
			{#if cast.known_for && cast.known_for.length > 0}
			<p class="text-slate-400">{m.cardActorList_known_for()}</p>
			{#each cast.known_for as item}
			{#if item.title || item.original_title || item.name || item.original_name}
				<a
					href={localizeHref(item.first_air_date || item.media_type === 'tv'
						? `/tv/${CommonHelper.stringToSlug(item.name || item.original_name)}/${item.id}`
						: `/phim/${CommonHelper.stringToSlug(item.title || item.original_title)}/${item.id}`)}
					class="flex items-center justify-center cursor-pointer text-slate-400 hover:text-neonPink-500 transition duration-150"
				>
					<span>{item.title ?? item.original_title ?? item.name ?? item.original_name}</span>
				</a>
			{/if}
			{/each}
			{/if}
		</div>
	</div>
</div>
