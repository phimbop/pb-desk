<script lang="ts">
	import { page } from "$app/state";
	import { websiteUrl } from "$lib";
	import Seo from "$lib/Components/SEO/Seo.svelte";
	import { m } from "$lib/paraglide/messages";
</script>

<Seo title={m.footer_disclaimer()} metadescription={m.footer_disclaimer()} slug={`${page.url}`} >
</Seo>

<section class="w-full h-full flex justify-center items-center p-20 relative">
	<div class="container mx-auto max-w-3xl">
		<p class="text-slate-200">{m.disclaimer_text()}</p>
	</div>
</section>
