<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
	import LoginModal from './LoginModal.svelte';
	import { unreadNotificationsCount } from '$lib/runes/notificationStore.svelte';
	import { authStore } from '$lib/runes/authStore.svelte';

	let { user = null }: { user: any } = $props();

	let currentUser = $derived(authStore.user ?? user ?? null);
	let showModal = $state(false);
	let showMenu = $state(false);

	let initial = $derived(currentUser?.username?.charAt(0)?.toUpperCase() ?? '?');

	async function logout() {
		try {
			await authStore.logout();
			showMenu = false;
		} catch {
			// Silently fail, user can retry
		}
	}

	function toggleMenu() {
		showMenu = !showMenu;
	}

	function closeMenu(e: MouseEvent) {
		if (!(e.target as HTMLElement).closest('.user-menu-container')) {
			showMenu = false;
		}
	}
</script>

<svelte:window onclick={closeMenu} />

{#if currentUser}
	<div class="user-menu-container relative">
		<button
			onclick={toggleMenu}
			class="flex items-center gap-2 rounded-full transition-all hover:ring-2 hover:ring-indigo-500/50"
			aria-label={m.auth_user_menu()}
			aria-expanded={showMenu}
		>
			<div class="relative">
				{#if currentUser.avatar_url || currentUser.avatarUrl}
					<img
						src={currentUser.avatar_url || currentUser.avatarUrl}
						alt={currentUser.username}
						class="w-8 h-8 rounded-full object-cover"
					/>
				{:else}
					<div class="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium">
						{initial}
					</div>
				{/if}
				{#if unreadNotificationsCount.value > 0}
					<span class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-neonPink-500 text-[9px] font-extrabold text-white ring-1 ring-neutral-900 shadow-lg shadow-neonPink-500/20">
						{unreadNotificationsCount.value > 9 ? '9+' : unreadNotificationsCount.value}
					</span>
				{/if}
			</div>
		</button>

		{#if showMenu}
			<div class="absolute right-0 top-full mt-2 w-48 bg-neutral-900 border border-neutral-700 rounded-xl shadow-xl py-1 z-50">
				<div class="px-4 py-2 border-b border-neutral-700">
					<p class="text-sm font-medium text-white truncate">{currentUser.username}</p>
					<p class="text-xs text-neutral-400 truncate">{currentUser.email}</p>
				</div>
				<a
					href={localizeHref('/profile')}
					onclick={() => (showMenu = false)}
					class="block w-full text-left px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
				>
					{m.profile_title()}
				</a>
				<button
					onclick={logout}
					class="w-full text-left px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white border-t border-neutral-800 transition-colors"
				>
					{m.auth_logout()}
				</button>
			</div>
		{/if}
	</div>
{:else}
	<button
		onclick={() => (showModal = true)}
		class="inline-flex px-4 py-2 ease-in-out bg-white/20 backdrop-blur-sm hover:bg-slate-950/40 hover:text-slate-50 border-[0.5px] border-white/20 rounded-full cursor-pointer font-medium text-slate-200 focus:outline-hidden active:scale-95 transition-all duration-150"
	>
		{m.auth_login()}
	</button>
{/if}

<LoginModal bind:open={showModal} />
