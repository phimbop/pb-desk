<script lang="ts">
	import {
		buffering,
		isPaused,
		isPlaying,
		playerVolume,
		playerMuted
	} from '$lib/runes/movieStore.svelte';
	import { Previous } from 'runed';
	import Buffering from '../Buffering.svelte';
	import FullscreenButton from '../buttons/FullscreenButton.svelte';
	import GoogleCast from '../buttons/GoogleCast.svelte';
	import MuteButton from '../buttons/MuteButton.svelte';
	import NextButton from '../buttons/NextButton.svelte';
	import PauseOnScreen from '../buttons/PauseOnScreen.svelte';
	import PIPButton from '../buttons/PIPButton.svelte';
	import PlayButton from '../buttons/PlayButton.svelte';
	import PlayOnScreen from '../buttons/PlayOnScreen.svelte';
	import Captions from '../Captions.svelte';
	import ChapterTitle from '../ChapterTitle.svelte';
	import Gestures from '../Gestures.svelte';
	import SettingsMenu from '../menus/SettingsMenu.svelte';
	import TimeSlider from '../sliders/TimeSlider.svelte';
	import VolumeSlider from '../sliders/VolumeSlider.svelte';
	import TimeGroup from '../TimeGroup.svelte';
	import VolumeLowOnScreen from '../buttons/VolumeLowOnScreen.svelte';
	import VolumeHighOnScreen from '../buttons/VolumeHighOnScreen.svelte';
	import VolumeMuteOnScreen from '../buttons/VolumeMuteOnScreen.svelte';
	import BackwardOnScreen from '../buttons/BackwardOnScreen.svelte';
	import ForwardOnScreen from '../buttons/ForwardOnScreen.svelte';
	interface Props {
		HideBtnPlayNext?: boolean;
		onclick: () => void;
		thumbnails?: string | undefined;
	}
	let { HideBtnPlayNext = $bindable(false), onclick, thumbnails = undefined }: Props = $props();
	const previousVolume = new Previous(() => playerVolume.value);
	let isArrowDownPress = $derived(previousVolume.current! > playerVolume.value);
	let isArrowUpPress = $derived(previousVolume.current! < playerVolume.value);
	let isSeekForward = $state('');
	let seekKeyPressCount = $state(1);
	// $inspect('player', vidsLastKeyBoardEvent.value);
	const handleKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'ArrowLeft') {
			isSeekForward = 'bw';
			seekKeyPressCount++;
		} else if (event.key === 'ArrowRight') {
			isSeekForward = 'fw';
			seekKeyPressCount++;
		}
	};
	$effect(() => {
		window.addEventListener('keydown', handleKeyDown, { capture: true });
		// window.addEventListener('keyup', handleKeyUp, { capture: true });

		// Cleanup: Gỡ listener khi component bị hủy
		return () => {
			window.removeEventListener('keydown', handleKeyDown, { capture: true });
			// window.removeEventListener('keyup', handleKeyUp, { capture: true });
		};
	});
</script>

<Gestures />
<Captions />
<div
	class="pointer-events-none grid !grid-cols-12 absolute inset-0 w-full h-full items-center"
>
	<div class="col-span-4 items-center w-full relative">
		{#key seekKeyPressCount}
		{#if isSeekForward === 'bw'}
		<BackwardOnScreen />
		{/if}
		{/key}
	</div>
	<div class="col-span-4">
		{#if buffering.value}
			<Buffering />
		{/if}
		{#if isPaused.value}
			<PauseOnScreen />
		{:else}
			<PlayOnScreen />
		{/if}
		{#if playerVolume.value === 0 || playerMuted.value}
			<VolumeMuteOnScreen />
		{/if}
		{#key playerVolume.value}
			{#if isArrowDownPress && playerVolume.value !== 0}
				<VolumeLowOnScreen />
			{/if}
			{#if isArrowUpPress}
				<VolumeHighOnScreen />
			{/if}
		{/key}
	</div>
	<div class="col-span-4 flex items-center justify-end w-full relative">
		{#key seekKeyPressCount}
		{#if isSeekForward === 'fw'}
		<ForwardOnScreen />
		{/if}
		{/key}
	</div>
</div>
<div class="pointer-events-none flex absolute top-0 sm:top-10 mx-auto items-center justify-center w-full">
	<div class="">
		{#key playerVolume.value}
			<div
				class="opacity-0 animate-bezel-hide flex items-center justify-center text-white bg-slate-500/20 backdrop-blur-md p-1 sm:p-4 rounded-full w-fit h-fit aspect-[1/1]"
			>
				{(playerVolume.value * 100).toFixed(0)} %
			</div>
		{/key}
	</div>
</div>
<media-controls
	class="pointer-events-none absolute inset-0 z-10 flex h-full w-full flex-col bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity data-[visible]:opacity-100"
>
	<media-controls-group
		class="pointer-events-auto flex w-full items-center justify-center mx-auto px-2"
	>
	<div class="flex items-center justify-end w-full">
		<GoogleCast tooltipPlacement="top" />
	</div>
	</media-controls-group>
	<div class="flex-1"></div>
	<media-controls-group
		class="pointer-events-auto flex w-full items-center px-2 justify-center mx-auto"
	>
	</media-controls-group>
	<div class="flex-1"></div>
	<media-controls-group class="flex w-full container items-center md:gap-x-2 justify-center mx-auto md:py-5">
		<PlayButton tooltipPlacement="top start" />
		{#if !HideBtnPlayNext}
			<!-- <div class="md:mx-2"></div> -->
			<NextButton tooltipPlacement="top" {onclick} />
		{/if}
		<TimeSlider {thumbnails} />
		<div class="hidden md:flex items-center">
			<TimeGroup />
		</div>
		<!-- <ChapterTitle /> -->
		<div class="hidden sm:flex items-center px-2 w-full max-w-[150px]">
			<MuteButton tooltipPlacement="top" />
			<VolumeSlider />
		</div>
		<!-- <CaptionButton tooltipPlacement="top" /> -->
		
		<!-- <SettingsMenu placement="top end" tooltipPlacement="top" /> -->
		<!-- <PIPButton tooltipPlacement="top" /> -->
		<FullscreenButton tooltipPlacement="top end" />
	</media-controls-group>
</media-controls>

<style scoped>
	media-controls {
		/* These CSS variables are supported out of the box to easily apply offsets to all tooltips/menus.  */
		--media-tooltip-y-offset: 30px;
		--media-menu-y-offset: 30px;
	}

	media-controls :global(media-volume-slider) {
		--media-slider-preview-offset: 30px;
	}
</style>
