<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import tooltip from '$lib/helper/tooltip';
	import { m } from '$lib/paraglide/messages';
	import { localizeHref, deLocalizeHref } from '$lib/paraglide/runtime';

	let items = [
		{
			label: m.breadcrumb_home(),
			value: 0,
			link: '/',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-home w-full h-full" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l-2 0l9 -9l9 9l-2 0" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" /><path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" /></svg>`
		},
		{
			label: m.reuse_movies(),
			value: 1,
			link: '/phim-le',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-file hover:scale-105 w-full h-full" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /></svg>`
		},
		{
			label: m.reuse_series(),
			value: 2,
			link: '/phim-bo',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-file-stack hover:scale-105 w-full h-full"viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4" /><path d="M5 21h14" /><path d="M5 18h14" /><path d="M5 15h14" /></svg>`
		},
		{
			label: '18+',
			value: 3,
			link: '/phim-18-cong',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-rating-18-plus hover:scale-105 w-full h-full" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M11.5 10.5m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0" /><path d="M11.5 13.5m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0" /><path d="M7 15v-6" /><path d="M15.5 12h3" /><path d="M17 10.5v3" /></svg>`
		}
	];
	let activeTab: number | undefined = $state();
	$effect(() => {
		const canonicalPath = deLocalizeHref(page.url.pathname);
		if (canonicalPath === '/') {
			activeTab = 0;
		} else if (canonicalPath.includes('/phim-le')) {
			activeTab = 1;
		} else if (canonicalPath.includes('/phim-bo')) {
			activeTab = 2;
		} else if (canonicalPath.includes('/phim-18')) {
			activeTab = 3;
		}
	});
	let transitionClass = $state('');
	let changingTab = $state(false);
	$effect(() => {
		if (changingTab) {
			transitionClass = 'opacity-0 -translate-x-40';
		} else {
			transitionClass = '';
		}
	});
</script>

<div
	class="w-full flex flex-col items-center justify-center sm:hidden fixed bottom-0 mx-0 z-50 bg-black/40 backdrop-blur-3xl py-2 gap-2"
>
	<div class="menu flex items-center gap-1 relative px-1">
		<div
			class="menu-bg w-40 h-16 absolute bottom-0 left-2 transform {activeTab == 0
				? 'translate-x-0'
				: activeTab == 1
				? 'translate-x-20'
				: activeTab == 2
				? 'translate-x-40'
				: 'translate-x-60'} transition-transform duration-200 ease-[cubic-bezier(0.6,0.6,0,1)] before:content-[''] before:bg-radial-gradient-to-b before:w-full before:h-full before:absolute before:bottom-0 before:left-0 before:opacity-100 before:transition-opacity before:duration-200 before:ease-[cubic-bezier(0.6,0.6,0,1)] after:content-[''] after:h-[1px] after:w-full after:absolute after:-top-[1px] after:left-0 after:opacity-40 after:bg-linear-to-r after:from-[rgba(5,5,30,0)] after:via-[#E2E8FF] after:to-[rgba(5,5,30,0)] after:transition-opacity after:duration-200 after:ease-[cubic-bezier(0.6,0.6,0,1)]"
		></div>
		{#each items as item, i}
			<button
				aria-label={item.label}
				class="menu-item-{i} {activeTab == i
					? 'w-40'
					: 'w-20'} h-16 relative cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.6,0.6,0,1)]"
				onclick={((e) => {
					e.preventDefault();
					(changingTab = true), (activeTab = item.value);
					goto(localizeHref(item.link));
				})}
				use:tooltip={{ text: item.label, position: 'top' }}
				ontransitionend={() => (changingTab = false)}
			>
				<div
					class="menu-item-content {activeTab == i
						? '-translate-x-1/2'
						: '-translate-x-[10px]'} flex items-center gap-2 absolute top-[calc(50%-10px)] left-1/2 transform transition-all duration-200 ease-[cubic-bezier(0.6,0.6,0,1)]"
				>
					<div
						class="flex items-center justify-center w-5 h-5 overflow-hidden transition duration-200 {activeTab ==
						i
							? 'text-slate-200'
							: 'text-slate-400'}"
					>
						{@html item.icon}
					</div>
					<span
						class="transform transition-all duration-200 ease-[cubic-bezier(0.6,0.6,0,1)] text-slate-200 truncate {activeTab ==
						i
							? 'opacity-100 translate-x-0'
							: '-translate-x-2 opacity-0'}">{item.label}</span
					>
				</div>
			</button>
		{/each}
	</div>
</div>
