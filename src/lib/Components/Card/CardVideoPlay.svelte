<!-- Update TmdbTvStore at this component  -->
<script lang="ts">
	import { page } from '$app/state';
	import { debounce } from '$lib/helper/debounce';
	import { apiHandler, isPlaying, playedListStore } from '$lib/runes/movieStore.svelte';
	import { appFetch } from '$lib/ipc';
	import { onMount } from 'svelte';
	import type { TvSeriesDetail } from '../../../types/Tmdb';
	import ButtonSecondary from '../Button/ButtonSecondary.svelte';
	import { tmdbTvStore } from '$lib/runes/tmdbTv.svelte';
	import { m } from '$lib/paraglide/messages';
	type ServerFn = (id: string | number) => string;
	interface Props {
		tmdbId: number | string;
		season?: number | string;
		episode?: number | string;
	}

	let { tmdbId = $bindable(), season = $bindable(), episode = $bindable() }: Props = $props();
	let tvDetail: TvSeriesDetail = $derived(page.data.tvDetail);
	let currentTime = new Date().toISOString();
	const servers: ServerFn[] = [
		(id) => `https://player.phimbop.top/embed/movie/${id}`,
		(id) => `https://player.videasy.net/movie/${id}?color=ffffff`,
		(id) => `https://vidfast.pro/movie/${id}?autoPlay=true&hideServer=true&theme=ffffff`
	];
	const tvServers: ServerFn[] = [
		(id) => `https://player.phimbop.top/embed/tv?tmdb=${id}&season=${season}&episode=${episode}`,
		(id) => `https://player.videasy.net/tv/${id}/${season}/${episode}?color=ffffff`,
		(id) =>
			`https://vidfast.pro/tv/${id}/${season}/${episode}?autoPlay=true&hideServer=true&nextButton=false&theme=ffffff`,
	];
	let loading = $state(false);
	let idx: any = $state(0); // đang test server thứ mấy
	let tried = $state(false); // đã thử xong chưa
	let iframeKey = $state(0); // force re-mount iframe

	// computed: src hiện tại
	let src = $derived(servers[idx](tmdbId.toString()));
	let tvSrc = $derived(tvServers[idx](tmdbId.toString()));

	$effect(() => {
		if (idx >= servers.length) tried = true;
	});

	function next() {
		if (idx < servers.length - 1) {
			idx += 1;
			iframeKey += 1;
		} else {
			tried = true;
		}
	}

	function reloadAll() {
		idx = 0;
		tried = false;
		iframeKey += 1;
	}
	const reportBreakLink = async () => {
		loading = true;
		let res = await appFetch('/api/report-broken-link', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				tmdbId,
				season,
				episode,
				type: season && episode ? 'tv' : 'movie',
				url: page.url.href
			})
		});
		loading = false;
		if (res.ok) {
			alert(m.alert_report_success());
		} else {
			alert(m.alert_error_occurred());
		}
	};
	const updatePlayedList = async () => {
		// only update tv , movie will update at tmdbMoviePage
		if (!season || !episode) return;
		let playerMovieInfo: PlayerMovieInfo = {
			source: 'tmdbTv',
			_id: '',
			id: tvDetail.id,
			content: tvDetail.overview,
			name: tvDetail.name,
			title: tvDetail.name,
			origin_name: tvDetail.original_name,
			playedTime: 0,
			poster_url: tvDetail!.poster_path,
			poster_path: tvDetail!.poster_path,
			thumb_url: tvDetail!.backdrop_path,
			status: 'full',
			year: tvDetail.first_air_date.slice(0, 4),
			time: tvDetail.first_air_date.toString(),
			type: 'tv',
			vote_average: tvDetail.vote_average,
			slug: page.url.pathname.split('/').slice(0, 3).join('/'),
			duration: tvDetail.episode_run_time[0],
			updatedAt: currentTime
		};
			const existingItemIndex = playedListStore.value.findIndex((item) => item.id === tvDetail.id);
			if (existingItemIndex !== -1) {
				// playedListStore.value[existingItemIndex].updatedAt = currentTime;
				playedListStore.value = playedListStore.value.with(existingItemIndex, {
					...playedListStore.value[existingItemIndex],
					updatedAt: currentTime});
			} else {
				playedListStore.value = [...playedListStore.value, playerMovieInfo];
			}
			await apiHandler.srdbRegisterView(playerMovieInfo);
	};
	$effect(() => {
		if (!season || !episode) return;
		const { id } = tvDetail; // lấy id trước
		const newSeason = season;
		const newEpisode = episode;

		/* đọc 1 lần, không dùng `tmdbTvStore.value` sau đó */
		let old = tmdbTvStore.value.find((i) => i.tvId === id);
		if (old && old.currentSeason === newSeason && old.currentEpisode === newEpisode) return;
		const idx = tmdbTvStore.value.findIndex((i) => i.tvId === id);
		if (idx !== -1) {
			tmdbTvStore.value = tmdbTvStore.value.with(idx, {
				...tmdbTvStore.value[idx],
				currentSeason: newSeason,
				currentEpisode: newEpisode,
				tvSeriesDetail: tvDetail
			});
		} else {
			tmdbTvStore.value = [
				...tmdbTvStore.value,
				{ tvId: id, currentSeason: newSeason, currentEpisode: newEpisode, tvSeriesDetail: tvDetail }
			];
		}
	});
	let watchingSessionId = $state('');

	onMount(async() => {
		//  console.log('[Player] onMount, tvDetail =', tvDetail);
		if (typeof window !== 'undefined') {
			let storedSession = window.sessionStorage.getItem('watching_session_id');
			if (!storedSession) {
				storedSession = crypto.randomUUID();
				window.sessionStorage.setItem('watching_session_id', storedSession);
			}
			watchingSessionId = storedSession;
		}

		try {
			await updatePlayedList();
			// console.log('[Player] updatePlayedList done');
		} catch (e) {
			console.error('[Player] updatePlayedList failed', e);
		}
	});

	const sendHeartbeat = async () => {
		if (!tmdbId || !watchingSessionId) return;

		try {
			await appFetch('/api/watching/heartbeat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ movieId: String(tmdbId), sessionId: watchingSessionId })
			});
		} catch (error) {
			console.error('Error sending watching heartbeat:', error);
		}
	};

	$effect(() => {
		if (watchingSessionId && tmdbId) {
			sendHeartbeat();
			const interval = setInterval(sendHeartbeat, 15000);
			return () => {
				clearInterval(interval);
			};
		}
	});
</script>

{#key page.url}
	{#if !tried && !season}
		<div class="relative w-full h-full">
			<button
				class="absolute top-2 left-1/2 transform -translate-x-1/2 z-50 flex w-fit justify-between items-center border-none px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 opacity-100 transition duration-150 ease-in-out bg-white/20 backdrop-blur-xs hover:bg-slate-900/40 rounded-full cursor-pointer text-slate-50"
				onclick={next}
				title="☁ server"
			>
				☁ Server {idx + 1} / {servers.length}
			</button>
			<iframe
				{src}
				data-key={iframeKey}
				class="absolute {idx === 0 ? '-top-8' : ''} w-full h-fit md:h-full z-10"
				frameborder="0"
				allowfullscreen
				title="phimbop.top"
				referrerpolicy="same-origin"
				onerror={next}
			></iframe>
		</div>
	{:else if !tried && season && episode}
		<div class="relative w-full h-full">
			<button
				class="absolute top-2 left-1/2 transform -translate-x-1/2 z-50 flex w-fit justify-between items-center border-none px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 opacity-100 transition duration-150 ease-in-out bg-white/20 backdrop-blur-xs hover:bg-slate-900/40 rounded-full cursor-pointer text-slate-50"
				onclick={next}
				title="☁ server"
			>
				☁ Server {idx + 1} / {servers.length}
			</button>
			<iframe
				src={tvSrc}
				data-key={iframeKey}
				class="absolute {idx === 0 ? '-top-8' : ''} w-full h-fit md:h-full z-10"
				frameborder="0"
				allowfullscreen
				title="phimbop.top"
				referrerpolicy="same-origin"
				onerror={next}
			></iframe>
		</div>
	{:else}
		<div class="p-4 text-center flex flex-col justify-center items-center w-full h-full">
			<p class="mb-2 text-3xl text-slate-200">{m.cardVideoPlay_allServerHasNoMovies()}?</p>
			<div class="flex items-center gap-4">
				<button
					class="flex items-center gap-2 px-4 py-2 transition duration-150 ease-in-out bg-white/20 backdrop-blur-xs hover:bg-white/40 rounded-full cursor-pointer text-slate-50"
					onclick={reloadAll}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="w-4 h-4"
						><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path
							d="M3 3v5h5"
						/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path
							d="M16 16h5v5"
						/></svg
					>
					<p>{m.cardVideoPlay_tryAll()}</p></button
				>
				<ButtonSecondary
					disabled={loading}
					class="disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2 px-4 py-2 transition duration-150 ease-in-out bg-white/20 backdrop-blur-xs hover:bg-white/40 rounded-full cursor-pointer text-slate-50"
					onclick={debounce(reportBreakLink, 3000)}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="w-4 h-4"
						><path
							d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"
						/><path d="M12 9v4" /><path d="M12 17h.01" /></svg
					>
					<p>{m.cardVideoPlay_reportLink()}</p></ButtonSecondary
				>
				<ButtonSecondary
					onclick={() => (window.location.href = `/`)}
					class="flex items-center gap-2"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="w-4 h-4"
						><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" /><path
							d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
						/></svg
					>
					<p>{m.breadcrumb_home()}</p></ButtonSecondary
				>
			</div>
		</div>
	{/if}
{/key}
