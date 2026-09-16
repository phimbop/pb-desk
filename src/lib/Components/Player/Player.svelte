<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import Hls from 'hls.js';
	import { api } from '$lib/ipc';
	import { appState } from '$lib/stores/appState.svelte';

	interface Props {
		movieSlug: string;
		movieName: string;
		posterUrl: string;
		episodeName: string;
		episodeSlug: string;
		streamUrl: string;
		embedUrl?: string | null;
		initialTime?: number;
		onNextEpisode?: () => void;
	}

	let {
		movieSlug,
		movieName,
		posterUrl,
		episodeName,
		episodeSlug,
		streamUrl,
		embedUrl = null,
		initialTime = 0,
		onNextEpisode
	}: Props = $props();

	let videoElement = $state<HTMLVideoElement | null>(null);
	let hlsInstance: Hls | null = null;
	let isPlaying = $state(false);
	let isBuffering = $state(false);
	let currentTime = $state(0);
	let duration = $state(0);
	let volume = $state(1);
	let isMuted = $state(false);
	let isFullscreen = $state(false);
	let showControls = $state(true);
	let controlsTimeout: any = null;
	let saveInterval: any = null;
	let isEmbedFallback = $state(false);

	$effect(() => {
		appState.isPlaying = isPlaying;
		return () => {
			appState.isPlaying = false;
		};
	});

	const progressPercent = $derived(
		duration > 0 ? (currentTime / duration) * 100 : 0
	);

	const formatTime = (secs: number) => {
		if (isNaN(secs)) return '00:00';
		const h = Math.floor(secs / 3600);
		const m = Math.floor((secs % 3600) / 60);
		const s = Math.floor(secs % 60);
		if (h > 0) {
			return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
		}
		return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
	};

	const saveProgress = async () => {
		if (!movieSlug || currentTime <= 0) return;
		try {
			await api.saveWatchHistory({
				movie_slug: movieSlug,
				movie_name: movieName,
				poster_url: posterUrl,
				episode_name: episodeName,
				episode_slug: episodeSlug,
				link_m3u8: streamUrl,
				duration,
				current_time: currentTime,
				progress_percent: progressPercent
			});
		} catch (err) {
			console.error('Failed to save watch history:', err);
		}
	};

	const initPlayer = () => {
		if (!videoElement) return;

		if (hlsInstance) {
			hlsInstance.destroy();
			hlsInstance = null;
		}

		if (!streamUrl && embedUrl) {
			isEmbedFallback = true;
			return;
		}

		isEmbedFallback = false;

		if (Hls.isSupported()) {
			hlsInstance = new Hls({
				enableWorker: true,
				lowLatencyMode: false,
				backBufferLength: 90
			});

			hlsInstance.loadSource(streamUrl);
			hlsInstance.attachMedia(videoElement);

			hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
				if (initialTime > 0 && videoElement) {
					videoElement.currentTime = initialTime;
				}
				videoElement?.play().catch(() => {});
			});

			hlsInstance.on(Hls.Events.ERROR, (_event, data) => {
				if (data.fatal) {
					switch (data.type) {
						case Hls.ErrorTypes.NETWORK_ERROR:
							hlsInstance?.startLoad();
							break;
						case Hls.ErrorTypes.MEDIA_ERROR:
							hlsInstance?.recoverMediaError();
							break;
						default:
							hlsInstance?.destroy();
							if (embedUrl) isEmbedFallback = true;
							break;
					}
				}
			});
		} else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
			videoElement.src = streamUrl;
			if (initialTime > 0) videoElement.currentTime = initialTime;
			videoElement.play().catch(() => {});
		}
	};

	$effect(() => {
		if (streamUrl && videoElement) {
			initPlayer();
		}
	});

	onMount(() => {
		initPlayer();

		saveInterval = setInterval(() => {
			if (isPlaying) saveProgress();
		}, 5000);
	});

	onDestroy(() => {
		if (saveInterval) clearInterval(saveInterval);
		saveProgress();
		if (hlsInstance) {
			hlsInstance.destroy();
			hlsInstance = null;
		}
	});

	const togglePlay = () => {
		if (!videoElement) return;
		if (videoElement.paused) {
			videoElement.play();
		} else {
			videoElement.pause();
			saveProgress();
		}
	};

	const handleSeek = (e: Event) => {
		const target = e.target as HTMLInputElement;
		const seekTo = (Number(target.value) / 100) * duration;
		if (videoElement) {
			videoElement.currentTime = seekTo;
		}
	};

	const toggleMute = () => {
		if (!videoElement) return;
		videoElement.muted = !videoElement.muted;
		isMuted = videoElement.muted;
	};

	const handleVolume = (e: Event) => {
		const target = e.target as HTMLInputElement;
		const val = Number(target.value);
		volume = val;
		if (videoElement) {
			videoElement.volume = val;
			videoElement.muted = val === 0;
			isMuted = val === 0;
		}
	};

	const toggleFullscreen = () => {
		const container = document.getElementById('player-container');
		if (!container) return;

		if (!document.fullscreenElement) {
			container.requestFullscreen().then(() => {
				isFullscreen = true;
			}).catch(() => {});
		} else {
			document.exitFullscreen().then(() => {
				isFullscreen = false;
			}).catch(() => {});
		}
	};

	const handleMouseMove = () => {
		showControls = true;
		if (controlsTimeout) clearTimeout(controlsTimeout);
		controlsTimeout = setTimeout(() => {
			if (isPlaying) showControls = false;
		}, 3000);
	};
</script>

<div
	id="player-container"
	class="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800 select-none group"
	onmousemove={handleMouseMove}
	role="region"
	aria-label="Video Player"
>
	{#if isEmbedFallback && embedUrl}
		<iframe
			src={embedUrl}
			class="w-full h-full border-0"
			allowfullscreen
			title={movieName}
		></iframe>
	{:else}
		<!-- HTML5 Video Element -->
		<video
			bind:this={videoElement}
			class="w-full h-full object-contain cursor-pointer"
			onclick={togglePlay}
			onplay={() => (isPlaying = true)}
			onpause={() => (isPlaying = false)}
			onwaiting={() => (isBuffering = true)}
			onplaying={() => (isBuffering = false)}
			ontimeupdate={() => {
				if (videoElement) {
					currentTime = videoElement.currentTime;
					duration = videoElement.duration || 0;
				}
			}}
			onended={() => {
				saveProgress();
				if (onNextEpisode) onNextEpisode();
			}}
		>
			<track kind="captions" />
		</video>

		<!-- Center Buffering Spinner -->
		{#if isBuffering}
			<div class="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/40 backdrop-blur-xs">
				<div class="w-12 h-12 rounded-full border-4 border-slate-600 border-t-neonPink-500 animate-spin"></div>
			</div>
		{/if}

		<!-- Custom Controls Overlay -->
		<div
			class="absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-t from-black/90 via-transparent to-black/60 transition-opacity duration-300 pointer-events-none {showControls
				? 'opacity-100 pointer-events-auto'
				: 'opacity-0'}"
		>
			<!-- Top Bar: Movie & Episode Title -->
			<div class="flex items-center justify-between text-white drop-shadow-md">
				<div class="flex items-center space-x-2">
					<h3 class="font-bold text-sm sm:text-base line-clamp-1">{movieName}</h3>
					<span class="px-2 py-0.5 rounded bg-neonPink-500/80 text-[10px] font-bold uppercase">
						{episodeName}
					</span>
				</div>
			</div>

			<!-- Center Play/Pause Big Touch Button -->
			<div class="flex items-center justify-center">
				<button
					onclick={togglePlay}
					class="p-4 rounded-full bg-neonPink-500/80 hover:bg-neonPink-500 text-white shadow-xl hover:scale-110 active:scale-95 transition-all drop-shadow-lg"
				>
					{#if isPlaying}
						<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 fill-current" viewBox="0 0 24 24">
							<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
						</svg>
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 fill-current translate-x-0.5" viewBox="0 0 24 24">
							<path d="M8 5v14l11-7z"/>
						</svg>
					{/if}
				</button>
			</div>

			<!-- Bottom Controls -->
			<div class="space-y-2">
				<!-- Scrub Timeline Bar -->
				<div class="relative flex items-center group/scrub">
					<input
						type="range"
						min="0"
						max="100"
						step="0.1"
						value={progressPercent}
						oninput={handleSeek}
						class="w-full h-1.5 bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-neonPink-500 focus:outline-none"
					/>
				</div>

				<div class="flex items-center justify-between text-white text-xs">
					<div class="flex items-center space-x-4">
						<!-- Play/Pause Icon -->
						<button onclick={togglePlay} class="hover:text-neonPink-400 transition-colors">
							{#if isPlaying}
								<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 fill-current" viewBox="0 0 24 24">
									<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
								</svg>
							{:else}
								<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 fill-current" viewBox="0 0 24 24">
									<path d="M8 5v14l11-7z"/>
								</svg>
							{/if}
						</button>

						<!-- Volume & Mute -->
						<div class="flex items-center space-x-2">
							<button onclick={toggleMute} class="hover:text-neonPink-400 transition-colors">
								{#if isMuted || volume === 0}
									<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<line x1="1" y1="1" x2="23" y2="23"/>
										<path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
										<path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
									</svg>
								{:else}
									<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
										<path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
										<path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
									</svg>
								{/if}
							</button>
							<input
								type="range"
								min="0"
								max="1"
								step="0.05"
								value={isMuted ? 0 : volume}
								oninput={handleVolume}
								class="w-16 sm:w-20 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-neonPink-500"
							/>
						</div>

						<!-- Time display -->
						<span class="font-mono text-[11px] text-slate-300">
							{formatTime(currentTime)} / {formatTime(duration)}
						</span>
					</div>

					<div class="flex items-center space-x-3">
						{#if onNextEpisode}
							<button
								onclick={onNextEpisode}
								class="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold flex items-center space-x-1"
								title="Tập tiếp theo"
							>
								<span>Tập tiếp</span>
								<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
									<path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
								</svg>
							</button>
						{/if}

						<!-- Fullscreen button -->
						<button onclick={toggleFullscreen} class="hover:text-neonPink-400 transition-colors p-1" title="Toàn màn hình">
							<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
							</svg>
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
