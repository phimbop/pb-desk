<script lang="ts">
	import { page } from '$app/state';
	import { DOMAIN_TMDB_IMAGE_CDN, websiteTile, websiteUrl } from '$lib';
	import { serializeSchema } from '$lib/helper/security';
	import IconFacebook from '$lib/Components/Icon/IconFacebook.svelte';
	import IconInstagram from '$lib/Components/Icon/IconInstagram.svelte';
	import IconTiktok from '$lib/Components/Icon/IconTiktok.svelte';
	import IconX from '$lib/Components/Icon/IconX.svelte';
	import IconYoutube from '$lib/Components/Icon/IconYoutube.svelte';
	import Image from '$lib/Components/Image/Image.svelte';
	import Seo from '$lib/Components/SEO/Seo.svelte';
	import SliderActorMovie from '$lib/Components/Slider/SliderActorMovie.svelte';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { moviesHandler } from '$lib/runes/movieStore.svelte';

	let actorId = $derived(page.params.actorId);
	let clientActorDetail = $state<TmdbActorDetailType | null>(null);

	let actorDetail: TmdbActorDetailType = $derived(
		clientActorDetail || page.data?.actorDetail || {
			id: parseInt(actorId || '0') || 0,
			name: '',
			biography: '',
			profile_path: '',
			also_known_as: [],
			gender: 0,
			birthday: '',
			deathday: null,
			place_of_birth: '',
			external_ids: {
				facebook_id: null,
				instagram_id: null,
				tiktok_id: null,
				twitter_id: null,
				youtube_id: null
			},
			movie_credits: { cast: [], crew: [] },
			tv_credits: { cast: [], crew: [] }
		}
	);
	let external_ids = $derived(actorDetail?.external_ids as any);

	let showAllActors = $derived(false);

	$effect(() => {
		if (actorId && (!clientActorDetail || clientActorDetail.id !== parseInt(actorId))) {
			if (page.data?.actorDetail && page.data.actorDetail.id === parseInt(actorId)) {
				clientActorDetail = page.data.actorDetail;
			} else {
				const locale = getLocale() || 'vi-VN';
				moviesHandler.tmdbGetActorInfo(parseInt(actorId), locale).then((res) => {
					if (res) clientActorDetail = res;
				}).catch((err) => {
					console.error('Error fetching actor detail in component:', err);
				});
			}
		}
	});

	$effect(() => {
		if (typeof window !== 'undefined' && !window.console) {
			window.console = {
				...console,
				log: function () {},
				group: function () {},
				error: function () {},
				warn: function () {},
				groupEnd: function () {}
			};
		}
	});
</script>

<Seo
	title={actorDetail.name}
	metadescription={actorDetail.biography}
	slug={`${page.url}`}
	image={`${DOMAIN_TMDB_IMAGE_CDN}/t/p/w300/${actorDetail.profile_path}`}
	keywordsPlus={actorDetail.name + ' ' + actorDetail.also_known_as?.join(', ')}
	jsonLd={{
		'@context': 'https://schema.org',
		'@type': 'Person',
		'@id': `${page.url}#person`,
		name: actorDetail.name,
		description: actorDetail.biography,
		image: `${DOMAIN_TMDB_IMAGE_CDN}/t/p/w300/${actorDetail.profile_path}`,
		birthDate: actorDetail.birthday || undefined,
		deathDate: actorDetail.deathday || undefined,
		sameAs: [
			`https://www.themoviedb.org/person/${actorDetail.id}`,
			external_ids?.imdb_id ? `https://www.imdb.com/name/${external_ids.imdb_id}` : '',
			external_ids?.wikidata_id ? `https://www.wikidata.org/wiki/${external_ids.wikidata_id}` : '',
			external_ids?.facebook_id ? `https://www.facebook.com/${external_ids.facebook_id}` : '',
			external_ids?.instagram_id ? `https://www.instagram.com/${external_ids.instagram_id}` : '',
			external_ids?.twitter_id ? `https://x.com/${external_ids.twitter_id}` : ''
		].filter(Boolean)
	}}
>
	<meta property="profile:first_name" content={actorDetail.name} />
	<meta
		property="profile:gender"
		content={actorDetail.gender === 2
			? 'Nam'
			: actorDetail.gender === 1
				? 'Nữ'
				: 'Chưa cập nhật kịp'}
	/>
	{@html serializeSchema({
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		"itemListElement": [
			{
				"@type": "ListItem",
				"position": 1,
				"name": "Diễn viên",
				"item": `${websiteUrl}/tim-kiem/dien-vien`
			},
			{
				"@type": "ListItem",
				"position": 2,
				"name": actorDetail.name,
				"item": `${page.url}`
			}
		]
	})}
</Seo>

<div class="w-full h-full flex flex-col items-center mx-auto transition-all duration-200 mt-4 md:mt-20">
	<div class="container px-4 md:px-10 grid grid-cols-1 md:grid-cols-10 gap-4">
		<div class="md:col-span-10 grid grid-cols-1 md:grid-cols-10 gap-2">
			<div class="col-span-3 overflow-hidden md:p-4">
				{#key actorDetail.id}
					<div class="w-full aspect-2/3 rounded-xl object-cover overflow-hidden relative">
						<div
							class="w-full h-full absolute bottom-0 left-0 right-0 bg-linear-to-t from-neutral-950 to-transparent z-20"
						></div>
						<Image
							class="rounded-xl"
							alt={actorDetail.name || ''}
							src="{DOMAIN_TMDB_IMAGE_CDN}/t/p/w300/{actorDetail.profile_path || ''}"
						/>
					</div>
				{/key}
			</div>
			<div class="md:col-span-7 space-y-2 p-2 md:p-4">
				<h2 class="text-4xl primary-text">{actorDetail.name}</h2>
				<p class="text-slate-400">{actorDetail.biography}</p>
				<dl>
					{#if actorDetail.also_known_as && actorDetail.also_known_as.length > 0}
						<div class="grid grid-cols-10 gap-2">
							<dt class="text-slate-400 col-span-2">{m.actorpage_content_otherName()}</dt>
							<dd class="text-slate-200 col-span-8 flex items-center gap-2 flex-wrap">
								{#each actorDetail.also_known_as as name, i}
									<p>{name}{i < actorDetail.also_known_as.length - 1 ? ', ' : ''}</p>
								{/each}
							</dd>
						</div>
					{/if}
					<div class="grid grid-cols-10 gap-2">
						<dt class="text-slate-400 col-span-2">{m.actorpage_content_gender()}</dt>
						<dd class="text-slate-200 col-span-8 flex items-center flex-wrap">
							<p>
								{actorDetail.gender === 2
									? m.reuse_male()
									: actorDetail.gender === 1
										? m.reuse_female()
										: m.reuse_unknown()}
							</p>
						</dd>
					</div>
					{#if actorDetail.birthday}
						<div class="grid grid-cols-10 gap-2">
							<dt class="text-slate-400 col-span-2">{m.actorpage_content_birthday()}</dt>
							<dd class="text-slate-200 col-span-8 flex items-center flex-wrap">
								<p class="mr-2">
									{new Date(actorDetail.birthday).toLocaleString(getLocale(), {
										day: 'numeric',
										month: 'short',
										year: 'numeric'
									})}
								</p>
							</dd>
						</div>
					{/if}
					{#if actorDetail.deathday}
						<div class="grid grid-cols-10 gap-2">
							<dt class="text-slate-400 col-span-2">{m.actorpage_content_deathday()}</dt>
							<dd class="text-slate-200 col-span-8 flex items-center flex-wrap">
								<p class="mr-2">
									{new Date(actorDetail.deathday).toLocaleString('vi-VN', {
										day: 'numeric',
										month: 'short',
										year: 'numeric'
									})}
								</p>
							</dd>
						</div>
					{/if}
					{#if actorDetail.place_of_birth}
						<div class="grid grid-cols-10 gap-2">
							<dt class="text-slate-400 col-span-2">{m.actorpage_content_placeOfBirth()}</dt>
							<dd class="text-slate-200 col-span-8 flex items-center flex-wrap">
								<p>{actorDetail.place_of_birth}</p>
							</dd>
						</div>
					{/if}
					{#if external_ids}
						<div class="grid grid-cols-10 gap-2">
							{#if !['facebook_id', 'instagram_id', 'tiktok_id', 'twitter_id', 'youtube_id'].every((key) => external_ids[key] === '' || external_ids[key] === null)}
								<dt class="text-slate-400 col-span-2">{m.actorpage_content_socialAccounts()}</dt>
							{/if}
							<dd class="text-slate-200 col-span-8 flex items-center gap-4 flex-wrap">
								{#if external_ids.instagram_id}
									<a
										href="https://www.instagram.com/{external_ids.instagram_id}"
										target="_blank"
									>
										<IconInstagram
											class="w-6 h-6 text-slate-200 hover:text-neonPink-700 transition duration-200"
										/>
									</a>
								{/if}
								{#if external_ids.facebook_id}
									<a
										href="https://www.facebook.com/{external_ids.facebook_id}"
										target="_blank"
										class="text-slate-200"
									>
										<IconFacebook
											class="w-6 h-6 text-slate-200 hover:text-neonPink-700 transition duration-200"
										/>
									</a>
								{/if}
								{#if external_ids.twitter_id}
									<a href="https://x.com/{external_ids.twitter_id}" target="_blank">
										<IconX
											class="w-6 h-6 text-slate-200 hover:text-neonPink-700 transition duration-200"
										/>
									</a>
								{/if}
								{#if external_ids.tiktok_id}
									<a
										href="https://www.tiktok.com/@{external_ids.tiktok_id}"
										target="_blank"
									>
										<IconTiktok
											class="w-6 h-6 text-slate-200 hover:text-neonPink-700 transition duration-200"
										/>
									</a>
								{/if}
								{#if external_ids.youtube_id}
									<a
										href="https://www.youtube.com/{external_ids.youtube_id}"
										target="_blank"
									>
										<IconYoutube
											class="w-6 h-6 text-slate-200 hover:text-neonPink-700 transition duration-200"
										/>
									</a>
								{/if}
							</dd>
						</div>
					{/if}
				</dl>
				<div class="!my-10">
					{#if (actorDetail.movie_credits && actorDetail.movie_credits.cast && actorDetail.movie_credits.cast.length > 0) || (actorDetail.movie_credits && actorDetail.movie_credits.crew && actorDetail.movie_credits.crew.length > 0)}
						<p class="text-slate-400 font-semibold text-xl mb-4">
							{m.actorpage_feature_films_starring()}
							{actorDetail.name}
						</p>
						<SliderActorMovie
							List={actorDetail.movie_credits &&
							actorDetail.movie_credits.cast &&
							actorDetail.movie_credits.cast.length > 0
								? actorDetail.movie_credits.cast
								: actorDetail.movie_credits.crew}
						/>
					{/if}
					{#if (actorDetail.tv_credits && actorDetail.tv_credits.cast && actorDetail.tv_credits.cast.length > 0) || (actorDetail.tv_credits && actorDetail.tv_credits.crew && actorDetail.tv_credits.crew.length > 0)}
						<p class="text-slate-400 font-semibold text-xl mt-8 mb-4">
							{m.actorpage_TV_drama_series_starring()}
							{actorDetail.name}
						</p>
						<SliderActorMovie
							List={actorDetail.tv_credits &&
							actorDetail.tv_credits.cast &&
							actorDetail.tv_credits.cast.length > 0
								? actorDetail.tv_credits.cast
								: actorDetail.tv_credits.crew}
						/>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
