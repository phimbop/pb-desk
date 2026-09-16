<script lang="ts">
	import { DOMAIN_TMDB_IMAGE_CDN } from '$lib';
	import CommonHelper from '$lib/helper/commentHelper';
	import tooltip from '$lib/helper/tooltip';
	interface Props {
		cast: TmdbMovieDetail['credits']['cast'][0] | TmdbMovieDetail['credits']['crew'][0] | any;
	}

	let { cast }: Props = $props();
</script>

<div class="flex flex-col items-center">
	<a
		href="/dien-vien/{CommonHelper.stringToSlug(cast.name)}/{cast.id}"
		class="flex items-center justify-center w-12 h-12 overflow-hidden object-cover rounded-full cursor-pointer border border-neutral-700"
		use:tooltip={{ text: cast.name, position: 'top' }}
	>
		{#if cast.profile_path}
			<img
				src="{DOMAIN_TMDB_IMAGE_CDN}/t/p/w300{cast.profile_path}"
				alt={cast.name}
				loading="lazy"
			/>
		{:else}
			<img src="https://ui-avatars.com/api/name={cast.name}" alt={cast.name} loading="lazy" />
		{/if}
	</a>
	{#if cast.character}
		<p class="mt-1 flex items-center justify-center flex-wrap">{cast.character}</p>
	{:else}
		<p class="mt-1 flex items-center justify-center flex-wrap">{cast.job ?? ''}</p>
	{/if}
</div>
