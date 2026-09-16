<script lang="ts">
	import { page } from '$app/state';
	import IconList from '$lib/Components/Icon/IconList.svelte';
	import { clickOutside } from '$lib/helper/clickOutSide';
	import tooltip from '$lib/helper/tooltip';
	import { m } from '$lib/paraglide/messages';
	let { children } = $props();
	let sidebarSearchOpen = $state(true);
</script>

{#key page.url}
	<section class="w-full h-full flex relative pt-16 md:pt-0 overflow-x-clip">
		<div use:clickOutside={(e: MouseEvent) => {
			if (sidebarSearchOpen) {
				const toggleBtn = document.getElementById('search-sidebar-toggle');
				if (toggleBtn && (toggleBtn === e?.target || toggleBtn.contains(e?.target as Node))) return;
				sidebarSearchOpen = false;
			}
		}}
			class="hidden md:block {sidebarSearchOpen
				? 'md:w-1/6 opacity-100 translate-x-0'
				: 'opacity-0 -translate-x-full w-0 -ml-8'} transition-all duration-200 backdrop-blur-lg bg-slate-600/10 p-4 h-dvh sticky top-0"
		>
			<div class="w-full h-6 mb-4 flex items-center space-x-2 justify-between">
				<nav aria-label="breadcrumb"
					class="font-bold text-slate-200 px-2 md:px-0 transition-all duration-150"><a href="/">{m.breadcrumb_home()}</a> / <a href="{page.url.pathname}">{page.url.pathname === '/tim-kiem/phim' ? m.breadcrumb_search_movie() : m.breadcrumb_search_actors()}</a></nav>
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
					href="/tim-kiem/phim"
					class="relative flex items-center {page.url.pathname === '/tim-kiem/phim'
						? 'text-neonPink-500'
						: 'text-slate-400'} p-2 bg-black/60 rounded-sm hover:bg-black/30 hover:text-neonPink-500 focus:text-neonPink-600/80 cursor-pointer transition-all duration-200 mb-1 list-none group"
				>
					<span
						class=" absolute -translate-x-1 opacity-0 transform group-hover:translate-x-1 group-hover:opacity-100 {page
							.url.pathname === '/tim-kiem/phim'
							? 'opacity-100 translate-x-1'
							: ''} transition-all duration-200">
						✔
							</span
					>
					<span
						class="transform translate-x-0 group-hover:translate-x-5 {page.url.pathname ===
						'/tim-kiem/phim'
							? 'translate-x-5'
							: ''} transition-all duration-200">{m.searchpage_sidebar_search_movies()}</span
					>
				</a>
				<a
					href="/tim-kiem/dien-vien"
					class="relative flex items-center {page.url.pathname === '/tim-kiem/dien-vien'
						? 'text-neonPink-500'
						: 'text-slate-400'} p-2 bg-black/60 rounded-sm hover:bg-black/30 hover:text-neonPink-500 focus:text-neonPink-600/80 cursor-pointer transition-all duration-200 mb-1 list-none group"
				>
					<span
						class=" absolute -translate-x-1 opacity-0 transform group-hover:translate-x-1 group-hover:opacity-100 {page
							.url.pathname === '/tim-kiem/dien-vien'
							? 'opacity-100 translate-x-1'
							: ''} transition-all duration-200">✔</span
					>
					<span
						class="transform translate-x-0 group-hover:translate-x-5 {page.url.pathname ===
						'/tim-kiem/dien-vien'
							? 'translate-x-5'
							: ''} transition-all duration-200">{m.searchpage_sidebar_search_actors()}</span
					>
				</a>
			</div>
		</div>
		<div
			class="w-full transition-all duration-200 relative {sidebarSearchOpen
				? 'md:w-5/6 md:ml-0'
				: 'md:w-full'}"
		>
			<button
				id="search-sidebar-toggle"
				aria-label="Close sidebar"
				class="hidden md:flex p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-slate-700/20 text-slate-400 hover:text-neonPink-500 cursor-pointer transition-all duration-200 absolute top-20 left-20 z-50 items-center"
				onclick={(e) => { e.stopPropagation(); sidebarSearchOpen = !sidebarSearchOpen; }}
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

			<!-- Mobile Tab Switcher -->
			<div class="md:hidden w-full flex justify-center py-4 bg-transparent mt-2 px-4">
				<div class="bg-slate-900/60 p-1 rounded-full flex items-center gap-1 border border-slate-800/80 w-full max-w-sm">
					<a
						href="/tim-kiem/phim"
						class="flex-1 text-center py-2 text-xs font-semibold rounded-full transition-all duration-200 {page.url.pathname === '/tim-kiem/phim' ? 'bg-neonPink-500 text-white shadow-lg shadow-neonPink-500/20' : 'text-slate-400 hover:text-slate-200'}"
					>
						{m.searchpage_sidebar_search_movies()}
					</a>
					<a
						href="/tim-kiem/dien-vien"
						class="flex-1 text-center py-2 text-xs font-semibold rounded-full transition-all duration-200 {page.url.pathname === '/tim-kiem/dien-vien' ? 'bg-neonPink-500 text-white shadow-lg shadow-neonPink-500/20' : 'text-slate-400 hover:text-slate-200'}"
					>
						{m.searchpage_sidebar_search_actors()}
					</a>
				</div>
			</div>

			{@render children?.()}
		</div>
	</section>
{/key}
