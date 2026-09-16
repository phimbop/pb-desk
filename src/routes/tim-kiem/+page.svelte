<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import LoadingSubBlur from '$lib/Components/LoadingSubBlur.svelte';

	onMount(() => {
		const q = page.url.searchParams.get('q');
		if (q) {
			goto(`/tim-kiem/phim?q=${encodeURIComponent(q)}`, { replaceState: true });
		} else {
			goto('/tim-kiem/phim', { replaceState: true });
		}
	});
</script>

<div class="w-full min-h-[40vh] relative flex items-center justify-center">
	<LoadingSubBlur />
</div>
