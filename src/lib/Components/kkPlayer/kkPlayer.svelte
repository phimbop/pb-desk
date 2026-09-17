<script lang="ts">
	import 'vidstack/player/styles/base.css';
	import { onMount } from 'svelte';
	import { isHLSProvider, type MediaCanPlayEvent, type MediaProviderChangeEvent } from 'vidstack';
	import type { MediaPlayerElement } from 'vidstack/elements';
	import VideoLayout from './layouts/VideoLayout.svelte';
	import {
		buffering,
		isPaused,
		isPlaying,
		isSeeking,
		moviesHandler,
		playedListStore,
		playerVolume,
		playerMuted,
		apiHandler
	} from '$lib/runes/movieStore.svelte';
	import { clickAdslink, openExternalUrl, patternKKImageDomain, getProxyStreamUrl } from '$lib';
	import Hls from 'hls.js';
	import CommonHelper from '$lib/helper/commentHelper';
	import { page } from '$app/state';
	import { api } from '$lib/ipc';

	if (typeof window !== 'undefined') {
		(window as any).Hls = Hls;
	}

	let player = $state<MediaPlayerElement | undefined>(undefined);
	let svkk = ['phim1280.tv', 'kkphimplayer6.com', 'kkphimplayer7.com'];
	let s = ['https://s', 'https://v'];
	let pb = 'b-cdn.net';
	let pbsv = 'https://pbsvr-s';
	let lastExecutionTime = 0;
	let hasTriggeredInitialAd = false;
	let watchingSessionId = '';
	let heartbeatInterval: any;
	let failedSegments = $state<Array<{ start: number; end: number; sn: number }>>([]);
	let segmentRetryCount = new Map<number, number>(); // sn -> retry count
	const MAX_SEGMENT_RETRIES = 2;
	let fatalRecoveryCount = 0;
	let activeHlsInstance: any = null;
	const MAX_FATAL_RECOVERIES = 5;
	let playerCurrentTime = $state(0);
	let playerDuration = $state(0);
	let playerWaiting = $state(false);

	// Helper to check if a range is fully buffered
	function isRangeBuffered(media: HTMLMediaElement, start: number, end: number): boolean {
		const buffered = media.buffered;
		for (let i = 0; i < buffered.length; i++) {
			if (buffered.start(i) <= start + 0.5 && buffered.end(i) >= end - 0.5) {
				return true;
			}
		}
		return false;
	}

	$effect(() => {
		if (playerCurrentTime > 0 && failedSegments.length > 0) {
			const media = (player?.provider as any)?.video || (player as any)?.media;
			if (media) {
				const failedIndex = failedSegments.findIndex(
					(f) => playerCurrentTime >= f.start - 0.3 && playerCurrentTime < f.end
				);
				if (failedIndex !== -1) {
					const failedFrag = failedSegments[failedIndex];
					const nextPos = failedFrag.end + 0.1;
					console.warn(`[KKPlayer] Playhead reached failed segment range [${failedFrag.start}, ${failedFrag.end}] (currentTime: ${playerCurrentTime}). Seeking to ${nextPos}`);

					// Remove this segment from failed list so we don't seek repeatedly
					failedSegments.splice(failedIndex, 1);

					if (playerDuration && nextPos >= playerDuration - 5) {
						console.warn("[KKPlayer] Failed segment is at the end of the movie. Triggering playNext/ended.");
						if (player) {
							player.currentTime = playerDuration;
						} else {
							media.currentTime = playerDuration;
						}
						videoEnded = true;
						if (clickBtnNext) {
							clickBtnNext();
						}
					} else {
						if (player) {
							player.currentTime = nextPos;
						} else {
							media.currentTime = nextPos;
						}
						const hlsInstance = activeHlsInstance;
						if (hlsInstance) {
							setTimeout(() => {
								hlsInstance.startLoad(nextPos);
							}, 50);
						}
					}
				}
			}
		}
	});

	const sendHeartbeat = async () => {
		if (!playMovieInfo) return;
		const movieId = playMovieInfo._id || playMovieInfo.id || playMovieInfo.slug;
		if (!movieId) return;

		try {
			await api.recordWatchingHeartbeat(String(movieId), watchingSessionId);
		} catch (error) {
			console.error('Error sending watching heartbeat:', error);
		}
	};

	const updateMovieProgress = (movieTime: number) => {
		if (!playMovieInfo?._id) {
			console.warn("[KKPlayer] updateMovieProgress aborted: playMovieInfo._id is missing!", playMovieInfo);
			return;
		}
		playMovieInfo.playedTime = movieTime;

		const currentList = playedListStore.value || [];
		const index = currentList.findIndex((item) => item._id === playMovieInfo._id);
		let updatedItem: PlayerMovieInfo;

		if (index !== -1) {
			if (currentList[index].playedTime === movieTime) {
				return;
			}

			const updated = [...currentList];
			updatedItem = {
				...currentList[index],
				playedTime: movieTime,
				duration: playMovieInfo.duration,
				updatedAt: new Date().toISOString()
			};
			updated[index] = updatedItem;
			playedListStore.value = updated;
		} else {
			updatedItem = {
				_id: playMovieInfo._id,
				playedTime: movieTime,
				duration: playMovieInfo.duration,
				content: playMovieInfo.content,
				id: playMovieInfo.id,
				name: playMovieInfo.name,
				slug: playMovieInfo.slug,
				type: playMovieInfo.type,
				time: playMovieInfo.time,
				origin_name: playMovieInfo.origin_name,
				poster_url: playMovieInfo.source === 'kk'
					? (playMovieInfo.poster_url?.replace(patternKKImageDomain, '').replace(/^\//, '') || '')
					: (playMovieInfo.poster_url || ''),
				vote_average: playMovieInfo.vote_average,
				status: playMovieInfo.status,
				year: playMovieInfo.year,
				source: playMovieInfo.source,
				thumb_url: playMovieInfo.source === 'kk'
					? (playMovieInfo.thumb_url?.replace(patternKKImageDomain, '').replace(/^\//, '') || '')
					: (playMovieInfo.thumb_url || ''),
				updatedAt: new Date().toISOString()
			};
			playedListStore.value = [
				...currentList,
				updatedItem
			];
		}

		// Sync progress to server database
		apiHandler.srdbUpdatePlayingProgress(updatedItem).catch((err) => {
			console.error("Failed to sync play progress to server:", err);
		});
	};
	const updateCurrentTime = CommonHelper.throttle((currentTime: number) => {
		updateMovieProgress(currentTime);
	}, 10000);
	interface Props {
		videoSrc?: string;
		videoTitle?: string;
		posterSrc?: string;
		posterAlt?: string;
		HideBtnPlayNext?: boolean;
		videoEnded?: boolean | undefined;
		playedTime?: number;
		playMovieInfo?: PlayerMovieInfo | undefined | any;
		clickBtnNext?: () => void;
	}

	let {
		videoSrc = '',
		videoTitle = '',
		posterSrc = '',
		posterAlt = '',
		HideBtnPlayNext = false,
		videoEnded = $bindable(undefined),
		playedTime = 0,
		playMovieInfo = $bindable(undefined),
		clickBtnNext
	}: Props = $props();
	let initialTime = (() => {
		if (playedListStore.state === 'ready') {
			const record = playedListStore.value.find(
				(item) => item.slug === (page.params as any).tenPhim || item.slug === (page.params as any).slug
			);
			return record?.playedTime ?? 0;
		}
		return 0;
	})();
	const src = $derived.by(() => {
		if (videoSrc) {
			if (videoSrc.includes('vip.')) {
				return getProxyStreamUrl(videoSrc);
			}
			let hasMatched = false;
			let temp = videoSrc;
			for (const url of svkk) {
				if (temp.includes(url)) {
					temp = temp.replace(url, pb);
					hasMatched = true;
				}
			}
			if (hasMatched) {
				for (const url of s) {
					temp = temp.replace(url, pbsv);
				}
			}
			return temp;
		}
		return '';
	});

	$effect(() => {
		// Reset error counters when source changes
		if (videoSrc) {
			failedSegments = [];
			segmentRetryCount.clear();
			fatalRecoveryCount = 0;
			activeHlsInstance = null;
		}
	});

	onMount(async (): Promise<any> => {

		// Generate or retrieve a session ID for tracking active watching presence
		if (typeof window !== 'undefined') {
			let storedSession = window.sessionStorage.getItem('watching_session_id');
			if (!storedSession) {
				storedSession = crypto.randomUUID();
				window.sessionStorage.setItem('watching_session_id', storedSession);
			}
			watchingSessionId = storedSession;

			(window as any).Hls = Hls;
			if (typeof document !== 'undefined') {
				const hlsCdnUrls = [
					'https://cdn.jsdelivr.net/npm/hls.js@^1.5.0/dist/hls.min.js',
					'https://cdn.jsdelivr.net/npm/hls.js@^1.5.0/dist/hls.js'
				];
				for (const url of hlsCdnUrls) {
					if (!document.querySelector(`script[src="${url}"]`)) {
						const dummyScript = document.createElement('script');
						dummyScript.type = 'text/plain';
						dummyScript.src = url;
						document.head.appendChild(dummyScript);
					}
				}
			}
		}
		// Add event listeners before importing the bundle to avoid missing initial events during element upgrade
		player!.addEventListener('can-play', onCanPlay as any);
		player!.addEventListener('provider-setup', onProviderSetup as any);
		player!.addEventListener('provider-change', onProviderChange as any);

		// @ts-ignore
		await import('vidstack/bundle');
		if (!player) return;
		player.currentTime = playMovieInfo?.playedTime;
		if (playMovieInfo) {
			let pattern = /https:\/\/img\.phimapi\.com|https:\/\/phimimg\.com/g;
			playMovieInfo.poster_url = playMovieInfo?.poster_url.replace(pattern, '');
			playMovieInfo.thumb_url = playMovieInfo?.thumb_url.replace(pattern, '');
			apiHandler.srdbRegisterView(playMovieInfo).catch((e) => {
				console.error("Failed to log watch progress to database:", e);
			});
		}

		if (player.provider) {
			handleProvider(player.provider);
		}

		// Subscribe to state updates.
		const unsubscribe = player!.subscribe(
			({ paused, waiting, seeking, ended, playing, currentTime, duration, volume, muted }) => {
				try {
					// console.log("KKPlayer subscribe callback: playing =", playing, "paused =", paused, "duration =", duration);
					playerCurrentTime = currentTime;
					playerDuration = duration;
					playerWaiting = waiting;
					buffering.value = waiting;
					isPaused.value = paused;
					isSeeking.value = seeking;
					videoEnded = ended;
					if (!paused) {
						updateCurrentTime(currentTime);
					}
					if (playMovieInfo && duration && isFinite(duration) && duration > 0) {
						playMovieInfo.duration = duration;
					}
					isPlaying.value = playing;
					if (playing && !paused && !hasTriggeredInitialAd) {
						triggerInitialAd();
					}
					onSeeking(seeking);
					playerVolume.value = volume;
					playerMuted.value = muted;

					// Heartbeat presence management
					if (playing && !paused && !ended) {
						if (!heartbeatInterval) {
							sendHeartbeat();
							heartbeatInterval = setInterval(sendHeartbeat, 15000);
						}
					} else {
						if (heartbeatInterval) {
							clearInterval(heartbeatInterval);
							heartbeatInterval = undefined;
						}
					}
				} catch (e) {
					console.error("Error in player state subscription:", e);
				}
			}
		);

		return () => {
			unsubscribe();
			player?.removeEventListener('can-play', onCanPlay as any);
			player?.removeEventListener('provider-change', onProviderChange as any);
			isPlaying.value = false;
			if (heartbeatInterval) {
				clearInterval(heartbeatInterval);
				heartbeatInterval = undefined;
			}
		};
	});

	// onDestroy(async () => {
	// 	// This call will destroy the player and all child instances.
	// 	player!.destroy();
	// 	await moviesHandler.srdbStopWatching(playMovieInfo);
	// });

	// beforeNavigate(async (navigation) => {
	// 	if (navigation.type === 'leave' || navigation.willUnload === true) {
	// 		await moviesHandler.srdbStopWatching(playMovieInfo);
	// 	}
	// });
	function handleProvider(provider: any) {
		if (isHLSProvider(provider) && Hls.isSupported()) {
			provider.config = {
				lowLatencyMode: true,
				maxBufferHole: 2,
				highBufferWatchdogPeriod: 2,
				startPosition: initialTime,
				// Configure retry policy: no retries on HTTP errors (403/404 won't self-heal)
				fragLoadPolicy: {
					default: {
						maxTimeToFirstByteMs: 2500,
						maxLoadTimeMs: 10000,
						timeoutRetry: {
							maxNumRetry: 2,
							retryDelayMs: 500,
							maxRetryDelayMs: 1000
						},
						errorRetry: {
							maxNumRetry: 0,
							retryDelayMs: 0,
							maxRetryDelayMs: 0
						}
					}
				}
			};
			provider.library = Hls;

			provider.onInstance((hlsInstance: any) => {
				if (activeHlsInstance === hlsInstance) {
					return;
				}
				activeHlsInstance = hlsInstance;
				if (typeof window !== 'undefined') {
					(window as any).hlsInstance = hlsInstance;
				}
				hlsInstance.on(Hls.Events.ERROR, (event: any, data: any) => {
					console.warn("[KKPlayer] HLS Error:", data.details, data);
					const media = hlsInstance.media || provider.video;

					// Check if this error is related to fragment/segment load or parsing failure
					const isFragmentError =
						data.details === Hls.ErrorDetails.FRAG_LOAD_ERROR ||
						data.details === Hls.ErrorDetails.FRAG_LOAD_TIMEOUT ||
						data.details === Hls.ErrorDetails.FRAG_PARSING_ERROR ||
						data.details === Hls.ErrorDetails.FRAG_DECRYPT_ERROR;

					const isForbiddenOrNotFound = data.response && (data.response.code === 403 || data.response.code === 404);

					if (isFragmentError && data.frag) {
						if (isForbiddenOrNotFound || data.fatal) {
							console.warn(`[HLS Error Handler] Segment error sn: ${data.frag.sn}, details: ${data.details}, code: ${data.response?.code}. Adding to failedSegments.`);

							// Add to failed segments array if not already present
							const exists = failedSegments.some(f => f.sn === data.frag.sn);
							if (!exists) {
								failedSegments.push({
									start: data.frag.start,
									end: data.frag.start + data.frag.duration,
									sn: data.frag.sn
								});
							}

							if (media) {
								const fragEnd = data.frag.start + data.frag.duration;
								const currentTime = media.currentTime;

								// If the playhead is currently stuck inside or very close to this failed segment,
								// we seek past it immediately and resume load.
								if (currentTime >= data.frag.start - 0.2 && currentTime < fragEnd) {
									const nextPos = fragEnd + 0.1;
									console.warn(`[HLS Error Handler] Playhead is already stuck inside/near the failed segment. Seeking immediately: ${currentTime} -> ${nextPos}`);

									// Remove from list since we are seeking now
									const index = failedSegments.findIndex(f => f.sn === data.frag.sn);
									if (index !== -1) {
										failedSegments.splice(index, 1);
									}

									if (media.duration && nextPos >= media.duration - 5) {
										console.warn("[HLS Error Handler] Immediate seek target is near the end of the movie. Ending playback.");
										if (player) {
											player.currentTime = media.duration;
										} else {
											media.currentTime = media.duration;
										}
										videoEnded = true;
										if (clickBtnNext) {
											clickBtnNext();
										}
									} else {
										hlsInstance.stopLoad();
										if (player) {
											player.currentTime = nextPos;
										} else {
											media.currentTime = nextPos;
										}
										setTimeout(() => {
											hlsInstance.startLoad(nextPos);
										}, 50);
									}
								} else {
									// If the playhead is NOT near the failed segment, we do NOT seek yet.
									// BUT if it is a fatal error, HLS.js has stopped loading.
									if (data.fatal) {
										const retries = segmentRetryCount.get(data.frag.sn) || 0;
										if (retries >= MAX_SEGMENT_RETRIES || fatalRecoveryCount >= MAX_FATAL_RECOVERIES) {
											console.warn(`[HLS Error Handler] Max retries reached for sn:${data.frag.sn} (retries: ${retries}, totalRecoveries: ${fatalRecoveryCount}). Skipping segment permanently. Waiting for playhead to approach.`);
											// We do NOT call startLoad here to avoid infinite request looping.
											// HLS.js remains in stopped state. When playhead reaches the gap,
											// the Svelte $effect will seek past it and call startLoad.
										} else {
											segmentRetryCount.set(data.frag.sn, retries + 1);
											fatalRecoveryCount++;
											console.warn(`[HLS Error Handler] Fatal fragment error in the future. Recovery attempt ${retries + 1}/${MAX_SEGMENT_RETRIES} for sn:${data.frag.sn} (total: ${fatalRecoveryCount}/${MAX_FATAL_RECOVERIES}). Retrying segment load.`);
											hlsInstance.startLoad(data.frag.start);
										}
									}
								}
							}
						}
					} else if (data.fatal) {
						switch (data.type) {
							case Hls.ErrorTypes.NETWORK_ERROR:
								fatalRecoveryCount++;
								if (fatalRecoveryCount >= MAX_FATAL_RECOVERIES) {
									console.error('[HLS Error Handler] Fatal network error. Max recoveries reached, stopping.', data);
								} else {
									console.error(`[HLS Error Handler] Fatal network error. Retry ${fatalRecoveryCount}/${MAX_FATAL_RECOVERIES}...`, data);
									const currentPos = media ? media.currentTime : (playerCurrentTime || 0);
									hlsInstance.startLoad(currentPos);
								}
								break;
							case Hls.ErrorTypes.MEDIA_ERROR:
								fatalRecoveryCount++;
								if (fatalRecoveryCount >= MAX_FATAL_RECOVERIES) {
									console.error('[HLS Error Handler] Fatal media error. Max recoveries reached, stopping.', data);
								} else {
									console.error(`[HLS Error Handler] Fatal media error. Recovery ${fatalRecoveryCount}/${MAX_FATAL_RECOVERIES}...`, data);
									hlsInstance.recoverMediaError();
								}
								break;
							default:
								console.error('[HLS Error Handler] Unrecoverable error:', data);
								break;
						}
					}
				});
			});
		}
	}

	function onProviderSetup(event: any) {
		const provider = event.detail;
		handleProvider(provider);
	}

	function onProviderChange(event: MediaProviderChangeEvent) {
		const provider = event.detail;
		handleProvider(provider);
	}

	function triggerInitialAd() {
		if (!hasTriggeredInitialAd) {
			hasTriggeredInitialAd = true;
			lastExecutionTime = Date.now();
			openExternalUrl(clickAdslink);
		}
	}

	// We can listen for the `can-play` event to be notified when the player is ready.
	function onCanPlay(event: MediaCanPlayEvent) {
		// ...
		triggerInitialAd();
	}
	let intervalId: number | undefined | any;
	function onSeeking(seeking: boolean) {
		if (seeking && !intervalId) {
			intervalId = setInterval(() => {
				const currentTime = new Date().getTime();
				if ((currentTime - lastExecutionTime) / 1000 / 60 >= 10) {
					openExternalUrl(clickAdslink);
					lastExecutionTime = currentTime;
				}
			}, 600000);
		} else if (!seeking && intervalId) {
			clearInterval(intervalId);
			intervalId = undefined;
		}
	}
</script>

<media-player
	class="w-full h-full bg-black/80 text-white font-sans overflow-hidden ring-media-focus data-focus:ring-neonPink-500 media-player relative"
	title={videoTitle}
	keyTarget="document"
	crossOrigin
	playsInline
	autoPlay
	bind:this={player}
	{src}
	currentTime={initialTime}
>
	<media-provider> </media-provider>
	<VideoLayout onclick={clickBtnNext!} {HideBtnPlayNext} />
</media-player>
