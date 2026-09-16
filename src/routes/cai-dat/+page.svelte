<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { localizeHref } from '$lib/paraglide/runtime';

	onMount(() => {
		goto(localizeHref('/settings'), { replaceState: true });
	});
</script>
