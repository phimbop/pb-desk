<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { moviesHandler } from '$lib/runes/movieStore.svelte';
	import LoadingSubBlur from '$lib/Components/LoadingSubBlur.svelte';

	let slug = $derived(page.params.slug as string);

	onMount(async () => {
		try {
			const res = await moviesHandler.kkPhimboGetMovieDetail(slug);
			if (res?.movie?.type === 'single') {
				goto(`/phim-le/${slug}`, { replaceState: true });
			} else if (res?.movie?.type === 'hoathinh') {
				goto(`/phim-hoat-hinh/${slug}`, { replaceState: true });
			} else {
				goto(`/phim-bo/${slug}`, { replaceState: true });
			}
		} catch {
			goto(`/phim-le/${slug}`, { replaceState: true });
		}
	});
</script>

<div class="w-full h-screen relative flex items-center justify-center">
	<LoadingSubBlur />
</div>
