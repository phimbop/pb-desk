<script lang="ts">
	import { page } from "$app/state";
	import Seo from "$lib/Components/SEO/Seo.svelte";
	import { getPrivacyContent } from "$lib/data/privacyTranslations";
	import { getLocale, localizeHref } from "$lib/paraglide/runtime";

	let currentLocale = $derived(getLocale());
	let c = $derived(getPrivacyContent(currentLocale));
</script>

<Seo title={c.seoTitle} metadescription={c.seoDescription} slug={`${page.url}`} />

<div class="container mt-20 mx-auto px-4 py-8 max-w-5xl">
	<!-- Header -->
	<header class="mb-8 text-center">
		<h1 class="text-3xl md:text-4xl font-bold primary-text mb-2">{c.title}</h1>
		<p class="text-lg text-slate-400">{c.lastUpdated}</p>
		<div class="mt-4">
			<a href={localizeHref('/')} class="text-slate-200 hover:text-neonPink-500 font-medium">{c.backHome}</a>
		</div>
	</header>

	<!-- Content -->
	<div class="bg-transparent rounded-lg shadow-md p-6 md:p-8 text-slate-100">
		<!-- Introduction -->
		<section class="mb-8">
			<p class="mb-4">{c.welcomeIntro}</p>
		</section>

		<!-- Section 1 -->
		<section class="mb-8">
			<h2 class="text-xl font-bold text-slate-100 mb-4 border-b border-slate-50/20 pb-2">{c.section1.title}</h2>
			<p class="mb-4">{c.section1.desc}</p>
			<ul class="list-disc pl-6 space-y-2">
				<li><span class="font-medium">{c.section1.personalInfoLabel}</span> {c.section1.personalInfoText}</li>
				<li><span class="font-medium">{c.section1.accessDataLabel}</span> {c.section1.accessDataText}</li>
				<li><span class="font-medium">{c.section1.cookieLabel}</span> {c.section1.cookieText}</li>
			</ul>
		</section>

		<!-- Section 2 -->
		<section class="mb-8">
			<h2 class="text-xl font-bold text-slate-100 mb-4 border-slate-50/20 border-b pb-2">{c.section2.title}</h2>
			<ul class="list-disc pl-6 space-y-2">
				{#each c.section2.items as item, i (i)}
					<li>{item}</li>
				{/each}
			</ul>
		</section>

		<!-- Section 3 -->
		<section class="mb-8">
			<h2 class="text-xl font-bold text-slate-100 mb-4 border-slate-50/20 border-b pb-2">{c.section3.title}</h2>
			<p class="mb-4">{c.section3.desc}</p>
			<ul class="list-disc pl-6 space-y-2">
				{#each c.section3.items as item, i (i)}
					<li>{item}</li>
				{/each}
			</ul>
		</section>

		<!-- Section 4 -->
		<section class="mb-8">
			<h2 class="text-xl font-bold text-slate-100 mb-4 border-slate-50/20 border-b pb-2">{c.section4.title}</h2>
			<ul class="list-disc pl-6 space-y-2">
				{#each c.section4.items as item, i (i)}
					<li>{item}</li>
				{/each}
			</ul>
		</section>

		<!-- Section 5 -->
		<section class="mb-8">
			<h2 class="text-xl font-bold text-slate-100 mb-4 border-slate-50/20 border-b pb-2">{c.section5.title}</h2>
			<p>{c.section5.desc}</p>
		</section>

		<!-- Section 6 -->
		<section class="mb-8">
			<h2 class="text-xl font-bold text-slate-100 mb-4 border-slate-50/20 border-b pb-2">{c.section6.title}</h2>
			<p class="mb-4">{c.section6.desc}</p>
			<ul class="list-disc pl-6 space-y-2">
				{#each c.section6.items as item, i (i)}
					<li>{item}</li>
				{/each}
			</ul>
		</section>

		<!-- Section 7 -->
		<section class="mb-8">
			<h2 class="text-xl font-bold text-slate-100 mb-4 border-slate-50/20 border-b pb-2">{c.section7.title}</h2>
			<p>{c.section7.desc}</p>
		</section>

		<!-- Section 8 -->
		<section>
			<h2 class="text-xl font-bold text-slate-100 mb-4 border-slate-50/20 border-b pb-2">{c.section8.title}</h2>
			<p>{c.section8.desc}</p>
		</section>
	</div>
</div>
