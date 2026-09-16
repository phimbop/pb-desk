<script lang="ts">
	import '../app.css';
	import { page, navigating } from '$app/state';
	import Sidebar from '$lib/Components/Sidebar/Sidebar.svelte';
	import Nav from '$lib/Components/Header/Nav.svelte';
	import LoadingSubBlur from '$lib/Components/LoadingSubBlur.svelte';
	import UpdateModal from '$lib/Components/Modal/UpdateModal.svelte';
	import { isPlaying } from '$lib/runes/movieStore.svelte';
	import { deLocalizeUrl } from '$lib/paraglide/runtime';
	import { setupGlobalOpener } from '$lib';
	import { isTauri } from '$lib/ipc';
	import { onMount } from 'svelte';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	onMount(() => {
		setupGlobalOpener();

		if (isTauri()) {
			import('@tauri-apps/api/event').then(({ listen }) => {
				listen('movie-update', (event: any) => {
					console.log('[Notification Event Received]:', event.payload);
				});
			});

			// Tự động kiểm tra bản cập nhật mới trong nền sau khi mở ứng dụng 3 giây
			setTimeout(() => {
				import('$lib/services/updater.svelte').then(({ updater }) => {
					updater.checkForUpdates(false);
				});
			}, 3000);
		}
	});

	let showNav = $derived(!isPlaying.value && !deLocalizeUrl(page.url).pathname.startsWith('/tim-kiem'));
</script>

<svelte:head>
	<title>PHIMBOP - Phim gì cũng có!</title>
	<meta name="description" content="Xem phim trực tuyến chất lượng cao, miễn phí trên desktop với PHIMBOP." />
</svelte:head>

<!-- Ambient Radial Gradient Background (Exact pbv5 Purple-Indigo Radial Glow) -->
<div class="fixed left-0 top-0 -z-10 h-full w-full bg-neutral-950 pointer-events-none">
	<div
		class="absolute top-0 z-[-2] h-screen w-screen bg-neutral-950/95 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.6),rgba(255,255,255,0))]"
	></div>
</div>

<div class="grid grid-flow-row mx-auto w-full min-h-screen relative bg-neutral-950 text-slate-100 overflow-x-clip">
	<!-- Left Sidebar (w-16) - Slides out and hides when playing, appears when paused/idle (100% pbv5 clone) -->
	<Sidebar
		class={isPlaying.value ? 'md:w-0 md:flex md:-translate-x-16' : 'md:flex md:w-16 md:translate-x-0'}
	/>

	<!-- Main Content Grid Column - 0 margin when playing, 16 (64px) margin when paused/idle -->
	<div class="grid grid-cols-1 {isPlaying.value ? 'md:ml-0' : 'md:ml-16'} transition-all duration-200 min-w-0">
		<Nav />
		<div class="w-full z-0 relative {showNav ? 'pt-16 md:pt-0' : ''}">
			{#if navigating.to}
				<LoadingSubBlur />
			{/if}
			<main class="w-full">
				{@render children?.()}
			</main>
		</div>
	</div>
</div>

<UpdateModal />
