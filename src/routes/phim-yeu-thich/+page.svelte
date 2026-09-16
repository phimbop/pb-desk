<script lang="ts">
	import { fade } from 'svelte/transition';
	import MenuUser from '$lib/Components/Menu/UserTab/MenuUser.svelte';
	import { websiteUrl } from '$lib';
	import { m } from '$lib/paraglide/messages';
</script>

<svelte:head>
	<title>{m.menuUser_items_label_favorites()} | BOP</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<section in:fade={{ duration: 200 }} class="w-full mt-4 md:mt-20">
	<div class="w-full h-full mx-auto my-5 flex justify-center">
		<MenuUser />
	</div>
</section>
