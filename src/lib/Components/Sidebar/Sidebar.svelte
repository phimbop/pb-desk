<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages';
	import { localizeHref, deLocalizeHref } from '$lib/paraglide/runtime';
	import SidbarItem from './SidbarItem.svelte';
	import LoginModal from '../Auth/LoginModal.svelte';
	import { clickOutside } from '$lib/helper/clickOutSide';
	import tooltip from '$lib/helper/tooltip';
	import { isPlaying } from '$lib/runes/movieStore.svelte';
	import { unreadNotificationsCount } from '$lib/runes/notificationStore.svelte';

	interface Props {
		[key: string]: any
	}

	let { ...props }: Props = $props();

	let currentPath = $derived(deLocalizeHref(page.url.pathname));

	let showLoginModal = $state(false);

	let user = $derived(page.data.user ?? null);
	let initial = $derived(user?.username?.charAt(0)?.toUpperCase() ?? '?');
</script>

<aside
	class="hidden fixed left-0 md:flex-col md:justify-between h-screen truncate overflow-x-hidden border-r border-slate-800 backdrop-blur-3xl p-2 z-50 transition-all duration-200 {props.class}"
>
	<div class="space-y-2 relative">
		<div
			class="menu-bg pointer-events-none w-80 h-20 absolute top-0 -right-2 transform {currentPath === '/'
				? 'translate-y-0'
				: currentPath === '/phim-moi'
				? 'translate-y-20'
				: currentPath.includes('/tim-kiem')
				? 'translate-y-40'
				: currentPath.includes('/phim-bo')
				? 'translate-y-60'
				: currentPath.includes('/phim-le')
				? 'translate-y-80'
				: currentPath.includes('/phim-tinh-cam')
				? 'translate-y-[25rem]'
				: currentPath.includes('/phim-hoat-hinh')
				? 'translate-y-[30rem]'
				: currentPath.includes('/phim-18')
				? 'translate-y-[35rem]'
				: 'opacity-0'} transition-transform duration-200 ease-[cubic-bezier(0.6,0.6,0,1)] before:content-[''] before:bg-radial-gradient-sidebar before:w-full before:h-full before:absolute before:top-0 before:left-0 before:opacity-100 before:transition-opacity before:duration-200 before:ease-[cubic-bezier(0.6,0.6,0,1)] after:content-[''] after:h-full after:w-[1px] after:absolute after:right-0 after:top-0 after:opacity-40 after:bg-linear-to-t after:from-[rgba(5,5,30,0)] after:via-[#E2E8FF] after:to-[rgba(5,5,30,0)] after:transition-opacity after:duration-200 after:ease-[cubic-bezier(0.6,0.6,0,1)]"
		></div>
		<SidbarItem
			svgIcon='<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-device-tv hover:scale-105 w-6 h-6" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M3 7m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z"></path><path d="M16 3l-4 4l-4 -4"></path></svg>'
			title="BOP"
			href={localizeHref('/')}
			tooltipText="{m.sidebar_home()}"
			active={currentPath === '/'}
		/>
		<SidbarItem
			svgIcon='
    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-trending-up hover:scale-105 w-6 h-6"  viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
        <path d="M3 17l6 -6l4 4l8 -8"></path>
        <path d="M14 7l7 0l0 7"></path>
      </svg>'
			title="{m.sidebar_new_title()}"
			href={localizeHref('/phim-moi')}
			active={currentPath === '/phim-moi'}
			tooltipText="{m.sidebar_new_tp()}"
		/>
		<SidbarItem
			svgIcon='<svg data-tg-tour="Tìm phim từ server Âu Mỹ, lọc phim theo quốc gia, năm, thể thoại" data-tg-order="1" xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-search hover:scale-105 w-6 h-6" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>'
			title="{m.sidebar_search_title()}"
			href={localizeHref('/tim-kiem/phim')}
			active={currentPath === '/tim-kiem/phim'}
			tooltipText="{m.sidebar_search_tp()}"
		/>
		<SidbarItem
			svgIcon='
    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-file-stack hover:scale-105 w-6 h-6" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4" /><path d="M5 21h14" /><path d="M5 18h14" /><path d="M5 15h14" /></svg>'
			title="{m.sidebar_series_title()}"
			href={localizeHref('/phim-bo')}
			active={currentPath === '/phim-bo'}
			tooltipText="{m.sidebar_series_tp()}"
		/>
		<SidbarItem
			svgIcon='
    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-file hover:scale-105 w-6 h-6" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /></svg>'
			title="{m.sidebar_movie_title()}"
			href={localizeHref('/phim-le')}
			active={currentPath === '/phim-le'}
			tooltipText="{m.sidebar_movie_tp()}"
		/>
		<SidbarItem
			svgIcon='
    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-heart hover:scale-105 w-6 h-6" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" /></svg>'
			title="{m.sidebar_love_title()}"
			href={localizeHref('/phim-tinh-cam')}
			active={currentPath === '/phim-tinh-cam'}
			tooltipText="{m.sidebar_love_tp()}"
		/>
		<SidbarItem
			svgIcon='
    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-mickey hover:scale-105 w-6 h-6" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5.5 3a3.5 3.5 0 0 1 3.25 4.8a7.017 7.017 0 0 0 -2.424 2.1a3.5 3.5 0 1 1 -.826 -6.9z" /><path d="M18.5 3a3.5 3.5 0 1 1 -.826 6.902a7.013 7.013 0 0 0 -2.424 -2.103a3.5 3.5 0 0 1 3.25 -4.799z" /><path d="M12 14m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /></svg>'
			title="Anime"
			href={localizeHref('/phim-hoat-hinh')}
			active={currentPath === '/phim-hoat-hinh'}
			tooltipText="{m.sidebar_anime_tp()}"
		/>
		<SidbarItem
			svgIcon='
    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-rating-18-plus hover:scale-105 w-6 h-6" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M11.5 10.5m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0" /><path d="M11.5 13.5m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0" /><path d="M7 15v-6" /><path d="M15.5 12h3" /><path d="M17 10.5v3" /></svg>'
			title="18+"
			href={localizeHref('/phim-18-cong')}
			active={currentPath === '/phim-18-cong'}
			tooltipText="{m.sidebar_18plus_tp()}"
		/>
	</div>
	<div class="space-y-2 relative">
		<div
			class="menu-bg pointer-events-none w-80 h-20 absolute top-0 -right-2 transform {currentPath.includes('/bang-xep-hang')
				? 'translate-y-0'
				: currentPath.includes('/phim-yeu-thich')
				? 'translate-y-20'
				: currentPath === '/gioi-thieu'
				? 'translate-y-40'
				: currentPath.includes('/profile')
				? 'translate-y-60'
				: 'opacity-0'} transition-transform duration-200 ease-[cubic-bezier(0.6,0.6,0,1)] before:content-[''] before:bg-radial-gradient-sidebar before:w-full before:h-full before:absolute before:top-0 before:left-0 before:opacity-100 before:transition-opacity before:duration-200 before:ease-[cubic-bezier(0.6,0.6,0,1)] after:content-[''] after:h-full after:w-[1px] after:absolute after:right-0 after:top-0 after:opacity-40 after:bg-linear-to-t after:from-[rgba(5,5,30,0)] after:via-[#E2E8FF] after:to-[rgba(5,5,30,0)] after:transition-opacity after:duration-200 after:ease-[cubic-bezier(0.6,0.6,0,1)]"
		></div>
		<SidbarItem
			svgIcon='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler hover:scale-105 w-6 h-6"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"></path><path d="M12 2a4 4 0 0 0-4 4v5a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4Z"></path></svg>'
			title="{m.sidebar_leaderboard_title()}"
			href={localizeHref('/bang-xep-hang')}
			active={currentPath === '/bang-xep-hang'}
			tooltipText="{m.sidebar_leaderboard_tp()}"
		/>
		<SidbarItem
			svgIcon='<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-bookmark hover:scale-105 w-6 h-6"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M18 7v14l-6 -4l-6 4v-14a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4z" /></svg>'
			title="{m.sidebar_saved_title()}"
			href={localizeHref('/phim-yeu-thich')}
			active={currentPath === '/phim-yeu-thich'}
			tooltipText="{m.sidebar_saved_tp()}"
		/>
		<SidbarItem
			svgIcon='<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-info-square-rounded hover:scale-105 w-6 h-6"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 9h.01" /><path d="M11 12h1v4h1" /><path d="M12 3c7.2 0 9 1.8 9 9s-1.8 9 -9 9s-9 -1.8 -9 -9s1.8 -9 9 -9z" /></svg>'
			title={m.sidebar_more_tile()}
			href={localizeHref('/gioi-thieu')}
			active={currentPath === '/gioi-thieu'}
			tooltipText={m.sidebar_more_tp()}
		/>
		{#if user}
			<a
				href={localizeHref('/profile')}
				class="group relative flex flex-col items-center space-y-2 hover:cursor-pointer rounded-md p-2 transition-all duration-200 w-full text-slate-300 hover:text-white"
				use:tooltip={{ text: m.profile_title(), position: 'right' }}
			>
				<div class="relative">
					{#if user.avatar_url}
						<img
							src={user.avatar_url}
							alt={user.username}
							class="w-8 h-8 rounded-full object-cover group-hover:scale-105 transition-transform"
						/>
					{:else}
						<div class="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold group-hover:scale-105 transition-transform">
							{initial}
						</div>
					{/if}
					{#if unreadNotificationsCount.value > 0}
						<span class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-neonPink-500 text-[9px] font-extrabold text-white ring-1 ring-slate-950 shadow-lg shadow-neonPink-500/20">
							{unreadNotificationsCount.value > 9 ? '9+' : unreadNotificationsCount.value}
						</span>
					{/if}
				</div>
				<p class="text-xs truncate max-w-[48px]">{user.username}</p>
			</a>
		{:else}
			<button
				onclick={() => (showLoginModal = true)}
				class="group relative flex flex-col items-center space-y-2 hover:cursor-pointer rounded-md p-2 transition-all duration-200 w-full text-slate-300 hover:text-white"
				use:tooltip={{ text: m.auth_login(), position: 'right' }}
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
					class="lucide lucide-user hover:scale-105 w-6 h-6"
				>
					<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
					<circle cx="12" cy="7" r="4" />
				</svg>
				<p class="text-xs">{m.auth_login()}</p>
			</button>
		{/if}
	</div>
</aside>

<LoginModal bind:open={showLoginModal} />
