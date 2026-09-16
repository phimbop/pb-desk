<script lang="ts">
	import tooltip from '$lib/helper/tooltip';
	import TopMonth from './TopMonth.svelte';
	import TopWeek from './TopWeek.svelte';
	import Today from './Today.svelte';
	import Watching from './Watching.svelte';
	import { m } from '$lib/paraglide/messages';

	let items = [
		{
			label: m.menutopmovie_label_today(),
			value: 0,
			component: Today,
			icon: `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-eye-filled" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 4c4.29 0 7.863 2.429 10.665 7.154l.22 .379l.045 .1l.03 .083l.014 .055l.014 .082l.011 .1v.11l-.014 .111a.992 .992 0 0 1 -.026 .11l-.039 .108l-.036 .075l-.016 .03c-2.764 4.836 -6.3 7.38 -10.555 7.499l-.313 .004c-4.396 0 -8.037 -2.549 -10.868 -7.504a1 1 0 0 1 0 -.992c2.831 -4.955 6.472 -7.504 10.868 -7.504zm0 5a3 3 0 1 0 0 6a3 3 0 0 0 0 -6z" stroke-width="0" fill="currentColor" /></svg>`
		},
		{
			label: m.menutopmovie_label_week(),
			value: 1,
			component: TopWeek,
			icon: `<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-calendar-week"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z" /><path d="M16 3v4" /><path d="M8 3v4" /><path d="M4 11h16" /><path d="M8 14v4" /><path d="M12 14v4" /><path d="M16 14v4" /></svg>`
		},
		{
			label: m.menutopmovie_label_month(),
			value: 2,
			component: TopMonth,
			icon: `<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-calendar-month"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z" /><path d="M16 3v4" /><path d="M8 3v4" /><path d="M4 11h16" /><path d="M7 14h.013" /><path d="M10.01 14h.005" /><path d="M13.01 14h.005" /><path d="M16.015 14h.005" /><path d="M13.015 17h.005" /><path d="M7.01 17h.005" /><path d="M10.01 17h.005" /></svg>`
		},
		{
			label: m.menutopmovie_label_watching(),
			value: 3,
			component: Watching,
			icon: `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-broadcast" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M18.364 19.364a9 9 0 0 0 0 -12.728M15.536 16.536a5 5 0 0 0 0 -7.072M12 13a1 1 0 1 0 0 -2 1 1 0 0 0 0 2z" /><path d="M5.636 19.364a9 9 0 0 1 0 -12.728M8.464 16.536a5 5 0 0 1 0 -7.072" /></svg>`
		}
	];
	let activeTab = $state(0);
	
	let changingTab = $state(false);
	let transitionClass = $state('');
	$effect(() => {
		if (changingTab) {
			transitionClass = 'opacity-0 -translate-x-2';
		} else {
			transitionClass = 'opacity-100 translate-x-0 transition-all duration-300';
		}
	});
	const SvelteComponent = $derived(items[activeTab].component);
</script>

<div class="w-full flex flex-col items-center justify-center">
	<div class="menu w-full flex items-center relative border-b border-slate-50/10">
		<div
			class="menu-bg w-1/4 h-16 absolute bottom-0 left-0 transform {activeTab == 0
				? 'translate-x-0'
				: activeTab == 1
				? 'translate-x-full'
				: activeTab == 2
				? 'translate-x-[200%]'
				: 'translate-x-[300%]'} transition-transform duration-200 ease-[cubic-bezier(0.6,0.6,0,1)] before:content-[''] before:bg-radial-gradient-to-t before:w-full before:h-full before:absolute before:top-0 before:left-0 before:opacity-100 before:transition-opacity before:duration-200 before:ease-[cubic-bezier(0.6,0.6,0,1)] after:content-[''] after:h-[1px] after:w-full after:absolute after:-bottom-[1px] after:left-0 after:opacity-40 after:bg-linear-to-r after:from-[rgba(5,5,30,0)] after:via-[#E2E8FF] after:to-[rgba(5,5,30,0)] after:transition-opacity after:duration-200 after:ease-[cubic-bezier(0.6,0.6,0,1)]"
			ontransitionstart={() => (changingTab = true)}
			ontransitionend={() => (changingTab = false)}
		></div>
		{#each items as item, i}
			<button
				aria-label="Top Movie"
				class="flex-1 h-16 relative cursor-pointer"
				onclick={(e) => {
					e.preventDefault();
					changingTab = !changingTab;
					activeTab = item.value;
				}}
				use:tooltip={{ text: item.label, position: 'top' }}
			>
				<div
					class="flex items-center justify-center gap-2 h-full w-full px-2"
				>
					<div
						class="flex items-center justify-center w-5 h-5 overflow-hidden transition duration-300 {activeTab == i
							? 'text-slate-200'
							: 'text-slate-400'}"
					>
						{@html item.icon}
					</div>
					<span
						class="transition-all duration-300 ease-[cubic-bezier(0.6,0.6,0,1)] text-slate-200 truncate {activeTab == i
							? 'opacity-100 max-w-[80px]'
							: 'opacity-0 max-w-0'}"
					>
						{item.label}
					</span>
				</div>
			</button>
		{/each}
	</div>
	<div
		class="w-full h-[600px] overflow-y-auto relative p-2 border border-slate-50/10 rounded-sm shadow-[0_-28px_84px_-24px_#e2e8ff1f_inset]"
	>
		<div class="w-full mt-2">
			<SvelteComponent {transitionClass} />
		</div>
	</div>
</div>
