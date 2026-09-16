<script lang="ts">
	import { websiteUrl } from '$lib';
	import { serializeSchema } from '$lib/helper/security';
	import type { Thing, WithContext } from 'schema-dts';
	import { getLocale, locales, localizeHref } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages';

	interface Props {
		metadescription?: string | undefined;
		title: string | undefined;
		image?: string | undefined;
		slug?: string | undefined;
		ogType?: string | undefined;
		keywordsPlus?: string | undefined;
		jsonLd?: Thing | WithContext<Thing> | undefined;
		children?: import('svelte').Snippet;
	}

	let {
		metadescription = $bindable(''),
		title = $bindable(''),
		image = $bindable(`${websiteUrl}/assets/images/phimbop-logo.webp`),
		slug = $bindable(websiteUrl),
		ogType = 'website',
		keywordsPlus = $bindable(''),
		jsonLd = $bindable(),
		children
	}: Props = $props();

	const siteTitle = ' PHIMBOP';

	const openGraphLocales: Record<string, string> = {
		vi: 'vi_VN',
		en: 'en_US',
		hi: 'hi_IN',
		ja: 'ja_JP',
		ko: 'ko_KR',
		tr: 'tr_TR',
		id: 'id_ID',
		zh: 'zh_CN',
		ru: 'ru_RU',
		de: 'de_DE',
		fr: 'fr_FR',
		es: 'es_ES',
		it: 'it_IT',
		pt: 'pt_PT',
		pl: 'pl_PL',
		nl: 'nl_NL',
		be: 'be_BY'
	};

	let currentLocale = $derived(getLocale());
	let ogLocale = $derived(openGraphLocales[currentLocale] || 'en_US');

	let keywords = $derived(m.seo_default_keywords ? m.seo_default_keywords() : 'phimbop, watch movies online, FULL HD');
	let pageTitle = $derived(`${title} | ${siteTitle}`);
	let ogDescriptionPrefix = $derived(m.seo_og_desc_prefix ? m.seo_og_desc_prefix() : 'Description from phimbop:');
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={metadescription?.slice(0, 160)} />
	<meta name="keywords" content={keywords + ' ' + keywordsPlus} />
	<meta name="twitter:title" content={pageTitle} />
	<meta name="twitter:description" content={'@Phimbop - ' + ' ' + metadescription} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:image" content={image} />
	<meta name="twitter:site" content="@phimbop" />
	<meta name="twitter:creator" content="@phimbop" />

	<!-- Dynamic og:locale -->
	<meta property="og:locale" content={ogLocale} />
	<meta property="og:type" content={ogType} />
	<meta property="og:site_name" content={siteTitle} />
	<meta property="og:url" content={slug} />
	<meta property="og:title" content={pageTitle} />

	<!-- Localized Open Graph Description Prefix -->
	<meta property="og:description" content={`${ogDescriptionPrefix} ${metadescription}`} />
	<meta property="og:image" content={image} />
	<meta property="og:image:alt" content={title + ' - phimbop'} />

	<link rel="canonical" href={slug} />

	<!-- Dynamic Localized Alternate Links (Hreflang SEO) -->
	<link rel="alternate" hreflang="x-default" href={localizeHref(slug, { locale: 'en' })} />
	{#each locales as locale}
		<link rel="alternate" hreflang={locale} href={localizeHref(slug, { locale })} />
	{/each}

	{#if jsonLd}
		{@const data = { "@context": "https://schema.org", ...(jsonLd as any) }}
		{@html serializeSchema(data)}
	{/if}
	{@render children?.()}
</svelte:head>
