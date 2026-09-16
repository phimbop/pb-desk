<script lang="ts">
	import tooltip from '$lib/helper/tooltip';
	import CardMovieFilter from '../Card/CardMovieFilter.svelte';

	interface Props {
		List?: any[];
	}

	let { List = [] }: Props = $props();
	let slider: any = $state();
	let btnRight: any = $state();
	let scrollLeftValue = $state(0);
	
	let scrollableWidth = $state(0);
	$effect(() => {
		scrollableWidth = List.length > 10 ? 1 : 0;
	});
	// $:console.log("🚀 ~ file: SliderActorMovie.svelte:9 ~ scrollableWidth:", scrollableWidth)
	function on_key_down(event: KeyboardEvent) {
		const { key, ctrlKey, repeat } = event;
		if (repeat) return;
		switch (key) {
			case 'ArrowLeft':
				event.preventDefault();
				slider.scrollLeft -= 800;
				break;
			case 'ArrowRight':
				event.preventDefault();
				// slider.scrollLeft += 800;
				btnRight.click();
				break;
		}
	}
</script>

<svelte:window onkeydown={on_key_down} />
<div
	class="flex items-center col-span-8 relative before:absolute before:left-0 before:top-0 before:z-20 before:h-full before:w-[50px] before:bg-[linear-gradient(to_right,black_0%,rgba(255,255,255,0)_100%)] before:content-[''] after:absolute after:right-0 after:top-0 after:z-20 after:h-full after:w-[50px] after:-scale-x-100 after:bg-[linear-gradient(to_right,black_0%,rgba(255,255,255,0)_100%)] after:content-['']"
>
	<button
		aria-label="Previous"
		class="absolute top-1/2 -left-10 flex items-center -translate-y-1/2 transition-all duration-200 opacity-100 bg-transparent {scrollLeftValue >
		0
			? ''
			: 'invisible opacity-0!'}"
		onclick={(e) => {
			e.preventDefault();
			slider.scrollLeft -= 800;
		}}
		use:tooltip={{ text: 'Phím 🠔', position: 'top' }}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="icon icon-tabler icon-tabler-chevron-left h-7 w-7 text-slate-300 bg-neutral-700 hover:text-neonPink-500 hover:bg-neutral-600 active:text-slate-300 active:bg-slate-800 rounded-full p-1 cursor-pointer transition-all duration-200"
			viewBox="0 0 24 24"
			stroke-width="2"
			stroke="currentColor"
			fill="none"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path stroke="none" d="M0 0h24v24H0z" fill="none" />
			<path d="M15 6l-6 6l6 6" />
		</svg>
	</button>
	<button
		aria-label="Next"
		class="flex items-center justify-center absolute top-1/2 -right-10 -translate-y-1/2 opacity-100 transition-all duration-200 {scrollableWidth >
		scrollLeftValue
			? ''
			: 'invisible opacity-0!'}"
		onclick={(e) => {
			e.preventDefault();
			slider.scrollLeft += 800;
		}}
		use:tooltip={{ text: 'Phím 🠖', position: 'top' }}
		bind:this={btnRight}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="icon icon-tabler icon-tabler-chevron-right h-7 w-7 bg-neutral-700 text-slate-300 hover:text-neonPink-500 hover:bg-neutral-600 active:text-slate-300 focus:text-slate-300 focus:bg-slate-800 active:bg-slate-800 rounded-full p-1 cursor-pointer transition duration-200"
			viewBox="0 0 24 24"
			stroke-width="2"
			stroke="currentColor"
			fill="none"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path stroke="none" d="M0 0h24v24H0z" fill="none" />
			<path d="M9 6l6 6l-6 6" />
		</svg>
	</button>
	<ul
		class="relative w-full grid grid-flow-col gap-2 overflow-x-auto scrollbar scroll-smooth"
		bind:this={slider}
		onscroll={() => {
			scrollableWidth = slider.scrollWidth - slider.clientWidth;
			scrollLeftValue = Math.ceil(slider.scrollLeft);
		}}
	>
		{#each List as logo, index}
			<li class="w-full min-w-[160px]">
				<CardMovieFilter showDate={false} class="" movie={logo} />
			</li>
		{/each}
	</ul>
</div>
