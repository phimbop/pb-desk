<script lang="ts">
	import { serializeSchema } from '$lib/helper/security';
	import { fade } from 'svelte/transition';
	import MenuTrending from '$lib/Components/Menu/MenuTrending.svelte';
	import { moviesNewAddStore } from '$lib/runes/movieStore.svelte';
	import { page } from '$app/state';
	import { websiteUrl } from '$lib';
	import Seo from '$lib/Components/SEO/Seo.svelte';
	import { m } from '$lib/paraglide/messages';

	$effect(() => {
		if (page.data?.moviesAddedNew && page.data.moviesAddedNew.length > 0) {
			moviesNewAddStore.value = page.data.moviesAddedNew;
		}
	});
</script>

<Seo
	title={m.phim_moi_seo_title()}
	metadescription={m.phim_moi_seo_description()}
	slug={`${websiteUrl}/phim-moi`}
>
	{@html serializeSchema({
       "@context": "https://schema.org",
       "@type": "BreadcrumbList",
       "itemListElement": [{
         "@type": "ListItem",
         "position": 1,
         "name": `${m.sidebar_new_title()} ${m.reuse_movies()}`,
         "item": `${websiteUrl}/phim-moi`
       }]
    })}
</Seo>
<section in:fade={{ duration: 200 }} class="w-full mt-4 md:mt-20">
	<div class="w-full h-full mx-auto my-5 flex justify-center">
		<MenuTrending />
	</div>
</section>
