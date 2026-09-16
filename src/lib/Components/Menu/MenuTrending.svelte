<script lang="ts">
	import TabNenXem from './TabNenXem.svelte';
	import TabPhimMoi from './TabPhimMoi.svelte';
	import TabMoiThem from './TabMoiThem.svelte';
	import tooltip from '$lib/helper/tooltip';
	import TabThongKe from './TabThongKe.svelte';
	import { m } from '$lib/paraglide/messages';

	let items = [
		{
			label: m.menutrending_label_newadd(),
			value: 0,
			component: TabMoiThem,
			icon: `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-refresh w-full h-full" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
   <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
   <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4"></path>
   <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4"></path>
</svg>`
		},
		{
			label: m.menutrending_label_new_movie(),
			value: 1,
			component: TabPhimMoi,
			icon: `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-chart-arrows-vertical w-full h-full" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
   <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
   <path d="M18 21v-14"></path>
   <path d="M9 15l3 -3l3 3"></path>
   <path d="M15 10l3 -3l3 3"></path>
   <path d="M3 21l18 0"></path>
   <path d="M12 21l0 -9"></path>
   <path d="M3 6l3 -3l3 3"></path>
   <path d="M6 21v-18"></path>
</svg>`
		},
		{
			label: m.menutrending_label_should_watch(),
			value: 2,
			component: TabNenXem,
			icon: `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-album w-full h-full" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
   <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
   <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"></path>
   <path d="M12 4v7l2 -2l2 2v-7"></path>
</svg>`
		}
	];
	let activeTab = $state(1);
	
	let transitionClass = $state('');
	let changingTab = $state(false);
	$effect(() => {
		if (changingTab) {
			transitionClass = 'opacity-0 -translate-x-40';
		} else {
			transitionClass = 'opacity-100 translate-x-0';
		}
	});
	// $: console.log('🚀 ~ file: MenuTrending.svelte:47 ~ changingTab:', changingTab);
</script>

<div class="w-full flex flex-col items-center justify-center delay">
	<div class="menu flex items-center gap-2 relative px-4">
		<div
			class="menu-bg w-80 h-16 absolute bottom-0 left-2 transform {activeTab == 0
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
				onclick={((e) => {
					e.preventDefault();
					(changingTab = !changingTab), (activeTab = item.value) ;
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
	<div
		ontransitionend={() => (changingTab = false)}
		class="w-full mt-2 transform transition-all duration-200 ease-[cubic-bezier(0.6,0.6,0,1)] {transitionClass}"
	>
		{#each items as item}
			{#if activeTab == item.value && changingTab == false}
				<item.component />
			{/if}
		{/each}
	</div>
</div>
