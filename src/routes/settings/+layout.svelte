<script lang="ts">
	import { page } from '$app/state';
	import IconList from '$lib/Components/Icon/IconList.svelte';
	import { clickOutside } from '$lib/helper/clickOutSide';
	import tooltip from '$lib/helper/tooltip';
	import { m } from '$lib/paraglide/messages';
	import { localizeHref, deLocalizeHref } from '$lib/paraglide/runtime';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
	let sidebarSearchOpen = $state(true);

	let currentPath = $derived(deLocalizeHref(page.url.pathname));
</script>

{#key page.url}
	<section class="w-full h-full flex relative">
		<div
			use:clickOutside={() => {
				if (sidebarSearchOpen) {
					sidebarSearchOpen = !sidebarSearchOpen;
				}
			}}
			class="{sidebarSearchOpen
				? 'w-3/4 md:w-1/6 opacity-100 translate-x-0 mr-[5/6]'
				: 'opacity-0 -translate-x-full w-0 -ml-8'} transition-all duration-200 backdrop-blur-lg bg-slate-600/10 p-4 h-[calc(100dvh-4rem)] md:h-dvh sticky top-16 md:top-0"
		>
			<div class="w-full h-6 mb-4 flex items-center space-x-2 justify-between">
				<h1 class="font-bold text-slate-200 px-2 md:px-0 transition-all duration-150">
					<a href={localizeHref('/')}>{m.breadcrumb_home()}</a> /
					<a href={page.url.pathname}
						>{currentPath === '/settings'
							? m.sidebar_settings_title()
							: currentPath === '/settings/about'
							? `${m.sidebar_settings_title()} / ${m.pageAboutUs_seo_title()}`
							: `${m.sidebar_settings_title()} / ${m.pageAboutUs_docs()}`}</a
					>
				</h1>
				<button
					aria-label="Close sidebar"
					class="p-2 rounded-full hover:bg-black/30 text-slate-400 hover:text-neonPink-500 cursor-pointer transition-all duration-200"
					onclick={() => (sidebarSearchOpen = !sidebarSearchOpen)}
					use:tooltip={{ text: m.reuse_close(), position: 'right' }}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="icon icon-tabler icon-tabler-x w-4 h-4"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						fill="none"
						stroke-linecap="round"
						stroke-linejoin="round"
						><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M18 6l-12 12" /><path
							d="M6 6l12 12"
						/></svg
					>
				</button>
			</div>
			<div class="grid grid-cols-1">
				<a
					href={localizeHref('/settings')}
					class="relative flex items-center {currentPath === '/settings'
						? 'text-neonPink-500'
						: 'text-slate-400'} p-2 bg-black/60 rounded-sm hover:bg-black/30 hover:text-neonPink-500 focus:text-neonPink-600/80 cursor-pointer transition-all duration-200 mb-1 list-none group"
				>
					<span
						class="absolute -translate-x-1 opacity-0 transform group-hover:translate-x-1 group-hover:opacity-100 {currentPath ===
						'/settings'
							? 'opacity-100 translate-x-1'
							: ''} transition-all duration-200"
					>
						✔
					</span>
					<span
						class="transform translate-x-0 group-hover:translate-x-5 {currentPath ===
						'/settings'
							? 'translate-x-5'
							: ''} transition-all duration-200">{m.sidebar_settings_title()}</span
					>
				</a>
				<a
					href={localizeHref('/settings/about')}
					class="relative flex items-center {currentPath === '/settings/about'
						? 'text-neonPink-500'
						: 'text-slate-400'} p-2 bg-black/60 rounded-sm hover:bg-black/30 hover:text-neonPink-500 focus:text-neonPink-600/80 cursor-pointer transition-all duration-200 mb-1 list-none group"
				>
					<span
						class="absolute -translate-x-1 opacity-0 transform group-hover:translate-x-1 group-hover:opacity-100 {currentPath ===
						'/settings/about'
							? 'opacity-100 translate-x-1'
							: ''} transition-all duration-200"
					>
						✔
					</span>
					<span
						class="transform translate-x-0 group-hover:translate-x-5 {currentPath ===
						'/settings/about'
							? 'translate-x-5'
							: ''} transition-all duration-200">{m.pageAboutUs_seo_title()} - Phimbop</span
					>
				</a>
				<a
					href={localizeHref('/settings/docs')}
					class="relative flex items-center {currentPath ===
					'/settings/docs'
						? 'text-neonPink-500'
						: 'text-slate-400'} p-2 bg-black/60 rounded-sm hover:bg-black/30 hover:text-neonPink-500 focus:text-neonPink-600/80 cursor-pointer transition-all duration-200 mb-1 list-none group"
				>
					<span
						class="absolute -translate-x-1 opacity-0 transform group-hover:translate-x-1 group-hover:opacity-100 {currentPath ===
						'/settings/docs'
							? 'opacity-100 translate-x-1'
							: ''} transition-all duration-200">✔</span
					>
					<span
						class="transform translate-x-0 group-hover:translate-x-5 {currentPath ===
						'/settings/docs'
							? 'translate-x-5'
							: ''} transition-all duration-200">{m.pageAboutUs_docs()}</span
					>
				</a>
			</div>
		</div>
		<div
			class="{sidebarSearchOpen
				? 'translate-x-3/4 w-full -ml-[75%] md:ml-0 md:w-5/6 md:translate-x-0'
				: 'translate-x-0'} w-full transition-all duration-200 relative"
		>
			<button
				aria-label="Close sidebar"
				class="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-slate-700/20 text-slate-400 hover:text-neonPink-500 cursor-pointer transition-all duration-200 absolute top-3 left-3 md:top-20 md:left-20 z-50 flex items-center"
				onclick={(e) => {
					e.stopPropagation();
					sidebarSearchOpen = !sidebarSearchOpen;
				}}
			>
				{#if sidebarSearchOpen}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="icon icon-tabler icon-tabler-x w-6 h-6"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						fill="none"
						stroke-linecap="round"
						stroke-linejoin="round"
						><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M18 6l-12 12" /><path
							d="M6 6l12 12"
						/></svg
					>
				{:else}
					<IconList class="w-6 h-6" />
				{/if}
			</button>
			{@render children?.()}
		</div>
	</section>
{/key}
