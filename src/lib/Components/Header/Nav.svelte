<script>
	import { page } from '$app/state';
	import { isPlaying } from '$lib/runes/movieStore.svelte';
	import { deLocalizeUrl, localizeHref } from '$lib/paraglide/runtime';
	import Search from '../Search/Search.svelte';
	import UserMenu from '../Auth/UserMenu.svelte';
	import { authStore } from '$lib/runes/authStore.svelte';

	const showNav = $derived(!isPlaying.value && !deLocalizeUrl(page.url).pathname.startsWith('/tim-kiem'));
	const user = $derived(authStore.user ?? page.data.user ?? null);
</script>

<!-- Mobile Header (Fixed & Full Width) -->
{#if showNav}
	<header
		class="md:hidden fixed top-0 left-0 right-0 z-40 w-full h-16 bg-neutral-950/85 backdrop-blur-lg border-b border-slate-800/60 flex items-center px-4 transition-all duration-200"
	>
		<div class="flex items-center justify-between w-full gap-4">
			<!-- Logo -->
			<div class="flex items-center flex-none">
				<a href="/" class="block font-bold text-xl transition-all duration-150 active:scale-95">
					<span class="text-slate-200">Phim</span><span class="text-neonPink-500">bop</span>
				</a>
			</div>

			<!-- Search Icon Button (Redirects to Search Page) -->
			<div class="flex-1 flex justify-end pr-2">
				<a
					href={localizeHref('/tim-kiem/phim')}
					aria-label="Search"
					class="p-2 text-slate-400 hover:text-white transition-colors duration-150 active:scale-95"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="icon icon-tabler icon-tabler-search w-6 h-6"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						fill="none"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path stroke="none" d="M0 0h24v24H0z" fill="none" />
						<path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
						<path d="M21 21l-6 -6" />
					</svg>
				</a>
			</div>

			<!-- User Menu / Login -->
			<div class="flex items-center flex-none">
				<UserMenu {user} />
			</div>
		</div>
	</header>
{/if}

<!-- Desktop/Tablet Header (Floating Pill Shape) -->
{#if showNav}
	<header
		class="hidden md:block fixed top-0 left-1/2 transform -translate-x-1/2 z-10 w-fit h-20 md:ml-20 transition-all duration-200"
	>
		<div class="grid pt-6 container mx-auto gap-4 transition-all duration-200 grid-cols-1 w-full md:w-[560px]">
			<div class="flex items-center justify-center gap-3 bg-slate-800/30 backdrop-blur-lg rounded-full px-2 md:px-0">
				<Search />
			</div>
		</div>
	</header>
{/if}
