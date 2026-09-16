<script lang="ts">
	import IconHeartFill from '$lib/Components/Icon/IconHeartFill.svelte';
	import tooltip from '$lib/helper/tooltip';
	import { m } from '$lib/paraglide/messages';
	import MenuUserTabMyListMovies from './MenuUserTabMyListMovies.svelte';
	import MenuUserTabWatched from './MenuUserTabWatched.svelte';

	let items = [
		{
			label: m.menuUser_items_label_favorites(),
			value: 0,
			component: MenuUserTabMyListMovies,
			icon: `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-bookmarks-filled" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6a4 4 0 0 1 4 4v11a1 1 0 0 1 -1.514 .857l-4.486 -2.691l-4.486 2.691a1 1 0 0 1 -1.508 -.743l-.006 -.114v-11a4 4 0 0 1 4 -4h4z" stroke-width="0" fill="currentColor" /><path d="M16 2a4 4 0 0 1 4 4v11a1 1 0 0 1 -2 0v-11a2 2 0 0 0 -2 -2h-5a1 1 0 0 1 0 -2h5z" stroke-width="0" fill="currentColor" /></svg>`
		},
		{
			label: m.menuUser_items_label_history(),
			value: 1,
			component: MenuUserTabWatched,
			icon: `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-eye-filled" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 4c4.29 0 7.863 2.429 10.665 7.154l.22 .379l.045 .1l.03 .083l.014 .055l.014 .082l.011 .1v.11l-.014 .111a.992 .992 0 0 1 -.026 .11l-.039 .108l-.036 .075l-.016 .03c-2.764 4.836 -6.3 7.38 -10.555 7.499l-.313 .004c-4.396 0 -8.037 -2.549 -10.868 -7.504a1 1 0 0 1 0 -.992c2.831 -4.955 6.472 -7.504 10.868 -7.504zm0 5a3 3 0 1 0 0 6a3 3 0 0 0 0 -6z" stroke-width="0" fill="currentColor" /></svg>`
		}
	];
	let activeTab = $state(0);
	
	let transitionClass = $state('');
	let changingTab = $state(false);
	$effect(() => {
		if (changingTab) {
			transitionClass = 'opacity-0 -translate-x-40';
		} else {
			transitionClass = '';
		}
	});
	// $: console.log('🚀 ~ file: MenuTrending.svelte:47 ~ changingTab:', changingTab);
</script>

<div class="w-full flex flex-col items-center justify-center delay">
	<ul class="menu flex items-center gap-2 relative px-4">
		<div
			class="menu-bg pointer-events-none w-80 h-16 absolute bottom-0 left-2 transform {activeTab == 0
				? 'translate-x-0'
				: activeTab == 1
				? 'translate-x-40'
				: 'translate-x-80'} transition-transform duration-200 ease-[cubic-bezier(0.6,0.6,0,1)] before:content-[''] before:bg-radial-gradient-to-b before:w-full before:h-full before:absolute before:bottom-0 before:left-0 before:opacity-100 before:transition-opacity before:duration-200 before:ease-[cubic-bezier(0.6,0.6,0,1)] after:content-[''] after:h-[1px] after:w-full after:absolute after:-top-[1px] after:left-0 after:opacity-40 after:bg-linear-to-r after:from-[rgba(5,5,30,0)] after:via-[#E2E8FF] after:to-[rgba(5,5,30,0)] after:transition-opacity after:duration-200 after:ease-[cubic-bezier(0.6,0.6,0,1)]"
		></div>
		{#each items as item, i}
			<button
				aria-label={item.label}
				class="menu-item-{i} {activeTab == i
					? 'w-80'
					: 'w-40'} h-16 relative cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.6,0.6,0,1)]"
				onclick={(e) => {
					e.preventDefault();
					(changingTab = true), (activeTab = item.value);
				}}
				use:tooltip={{ text: item.label, position: 'top' }}
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
	</ul>
	<div
		ontransitionend={(e) => {
			if (e.target === e.currentTarget) {
				changingTab = false;
			}
		}}
		class="w-full mt-2 transform transition-all duration-200 ease-[cubic-bezier(0.6,0.6,0,1)] {transitionClass}"
	>
		{#each items as item}
			{#if activeTab == item.value && changingTab == false}
				<item.component />
			{/if}
		{/each}
	</div>
</div>
