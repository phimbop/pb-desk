<script lang="ts">
	import { page } from '$app/state';
	import IconList from '$lib/Components/Icon/IconList.svelte';
	import { clickOutside } from '$lib/helper/clickOutSide';
	import tooltip from '$lib/helper/tooltip';
	import { m } from '$lib/paraglide/messages';
	import { localizeHref, deLocalizeHref } from '$lib/paraglide/runtime';
	import { unreadNotificationsCount } from '$lib/runes/notificationStore.svelte';
	import { authStore } from '$lib/runes/authStore.svelte';

	let { children } = $props();
	let sidebarSearchOpen = $state(true);

	let currentPath = $derived(deLocalizeHref(page.url.pathname));
	let user = $derived(authStore.user ?? page.data.user ?? null);
	let initial = $derived(user?.username?.charAt(0)?.toUpperCase() ?? '?');

	async function logout() {
		try {
			await authStore.logout();
			window.location.href = '/';
		} catch {
			// Silently fail
		}
	}
</script>

{#key page.url}
	{#if user}
		<section class="w-full h-full flex relative">
			<div
				use:clickOutside={() => {
					if (sidebarSearchOpen) {
						sidebarSearchOpen = !sidebarSearchOpen;
					}
				}}
				class="{sidebarSearchOpen
					? 'w-3/4 md:w-1/6 opacity-100 translate-x-0 mr-[5/6]'
					: 'opacity-0 -translate-x-full w-0 -ml-8'} transition-all duration-200 backdrop-blur-lg bg-slate-600/10 p-4 h-[calc(100dvh-4rem)] md:h-dvh sticky top-16 md:top-0 flex flex-col justify-between"
			>
				<div class="space-y-4">
					<div class="w-full h-6 mb-4 flex items-center space-x-2 justify-between">
						<h1 class="font-bold text-slate-200 px-2 md:px-0 transition-all duration-150 text-sm">
							<a href="/">{m.breadcrumb_home()}</a> / {m.profile_title()}
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

					<div class="flex items-center gap-3 p-3 bg-black/60 rounded-sm mb-4">
						{#if user.avatar_url || user.avatarUrl}
							<img
								src={user.avatar_url || user.avatarUrl}
								alt={user.username}
								class="w-10 h-10 rounded-full object-cover"
							/>
						{:else}
							<div class="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white text-base font-semibold">
								{initial}
							</div>
						{/if}
						<div class="min-w-0 flex-1">
							<p class="text-sm font-semibold text-white truncate">{user.username}</p>
							<p class="text-xs text-slate-400 truncate">{user.email}</p>
						</div>
					</div>

					<div class="grid grid-cols-1 gap-1">
						<a
							href={localizeHref('/profile')}
							class="relative flex items-center {currentPath === '/profile'
								? 'text-neonPink-500'
								: 'text-slate-400'} p-2 bg-black/60 rounded-sm hover:bg-black/30 hover:text-neonPink-500 focus:text-neonPink-600/80 cursor-pointer transition-all duration-200 list-none group"
						>
							<span
								class="absolute -translate-x-1 opacity-0 transform group-hover:translate-x-1 group-hover:opacity-100 {currentPath === '/profile'
									? 'opacity-100 translate-x-1'
									: ''} transition-all duration-200"
							>
								✔
							</span>
							<span
								class="transform translate-x-0 group-hover:translate-x-5 {currentPath === '/profile'
									? 'translate-x-5'
									: ''} transition-all duration-200"
							>
								{m.profile_title()}
							</span>
						</a>
						<a
							href={localizeHref('/profile/playlists')}
							class="relative flex items-center {currentPath === '/profile/playlists'
								? 'text-neonPink-500'
								: 'text-slate-400'} p-2 bg-black/60 rounded-sm hover:bg-black/30 hover:text-neonPink-500 focus:text-neonPink-600/80 cursor-pointer transition-all duration-200 list-none group"
						>
							<span
								class="absolute -translate-x-1 opacity-0 transform group-hover:translate-x-1 group-hover:opacity-100 {currentPath === '/profile/playlists'
									? 'opacity-100 translate-x-1'
									: ''} transition-all duration-200"
							>
								✔
							</span>
							<span
								class="transform translate-x-0 group-hover:translate-x-5 {currentPath === '/profile/playlists'
									? 'translate-x-5'
									: ''} transition-all duration-200"
							>
								{m.playlist_title()}
							</span>
						</a>
						<a
							href={localizeHref('/profile/notifications')}
							class="relative flex items-center {currentPath === '/profile/notifications'
								? 'text-neonPink-500'
								: 'text-slate-400'} p-2 bg-black/60 rounded-sm hover:bg-black/30 hover:text-neonPink-500 focus:text-neonPink-600/80 cursor-pointer transition-all duration-200 list-none group"
						>
							<span
								class="absolute -translate-x-1 opacity-0 transform group-hover:translate-x-1 group-hover:opacity-100 {currentPath === '/profile/notifications'
									? 'opacity-100 translate-x-1'
									: ''} transition-all duration-200"
							>
								✔
							</span>
							<span
								class="transform translate-x-0 group-hover:translate-x-5 {currentPath === '/profile/notifications'
									? 'translate-x-5'
									: ''} transition-all duration-200 flex items-center gap-2"
							>
								{m.profile_notifications()}
								{#if unreadNotificationsCount.value > 0}
									<span class="px-1.5 py-0.5 text-[9px] font-extrabold bg-neonPink-500 text-white rounded-full leading-none shadow-sm shadow-neonPink-500/20">
										{unreadNotificationsCount.value > 9 ? '9+' : unreadNotificationsCount.value}
									</span>
								{/if}
							</span>
						</a>
					</div>
				</div>

				<div class="grid grid-cols-1">
					<button
						onclick={logout}
						class="relative flex items-center text-slate-400 p-2 bg-black/60 rounded-sm hover:bg-black/30 hover:text-red-500 focus:text-red-600/80 cursor-pointer transition-all duration-200 mb-1 list-none group w-full text-left"
					>
						<span
							class="absolute -translate-x-1 opacity-0 transform group-hover:translate-x-1 group-hover:opacity-100 transition-all duration-200"
						>
							✔
						</span>
						<span
							class="transform translate-x-0 group-hover:translate-x-5 transition-all duration-200"
						>
							{m.auth_logout()}
						</span>
					</button>
				</div>
			</div>

			<div
				class="{sidebarSearchOpen
					? 'translate-x-3/4 w-full -ml-[75%] md:ml-0 md:w-5/6 md:translate-x-0'
					: 'translate-x-0'} w-full transition-all duration-200 relative"
			>
				<button
					aria-label="Toggle sidebar"
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
	{:else}
		{@render children?.()}
	{/if}
{/key}
