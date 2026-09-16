<script lang="ts">
	import { DOMAIN_TMDB_IMAGE_CDN } from '$lib';
	import CommonHelper from '$lib/helper/commentHelper';
	import { localizeHref } from '$lib/paraglide/runtime';
	import type { NetworkProviderItem } from '../../../types/Tmdb';

	let { item }: { item: NetworkProviderItem } = $props();
</script>

<div
	class="w-16 h-16 object-cover overflow-hidden rounded-full border-[0.5px] border-slate-400/20 flex items-center justify-center grayscale hover:grayscale-0"
>
	<a
		href={localizeHref(`/${CommonHelper.stringToSlug(item.provider_name)}/${item.provider_id}`)}
		rel="noopener noreferrer"
		><img src="{DOMAIN_TMDB_IMAGE_CDN}/t/p/original{item.logo_path}" alt={item.provider_name} /></a
	>
</div>
