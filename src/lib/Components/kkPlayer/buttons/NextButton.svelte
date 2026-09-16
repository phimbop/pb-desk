<script lang="ts">
	import type { TooltipPlacement } from 'vidstack';

	import Tooltip from '../Tooltip.svelte';
	import IconNext from '$lib/Components/Icon/IconNext.svelte';

	interface Props {
		tooltipPlacement: TooltipPlacement;
		onclick: () => void;
	}

	let { tooltipPlacement, onclick }: Props = $props();
</script>

<Tooltip placement={tooltipPlacement}>
	{#snippet trigger()}
		<button
			aria-label="Next"
			class="ring-media-focus group relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md outline-hidden ring-inset hover:bg-white/20 data-focus:ring-4 px-2.5"
			
			onclick={onclick}
			ontouchstart={onclick}
		>
			<IconNext type="next" class="h-8 w-8 active:scale-90 transition-all duration-150"></IconNext>
		</button>
	{/snippet}
	{#snippet content()}
	
			<span class="">Tập kế tiếp</span>
		
	{/snippet}
</Tooltip>
