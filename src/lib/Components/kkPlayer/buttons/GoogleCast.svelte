<script lang="ts">
	import type { TooltipPlacement } from 'vidstack';

	import Tooltip from '../Tooltip.svelte';
	import IconGoogleCast from '$lib/Components/Icon/IconGoogleCast.svelte';

	interface Props {
		tooltipPlacement: TooltipPlacement;
	}

	let { tooltipPlacement, ...props }: Props = $props();
</script>

<Tooltip placement={tooltipPlacement}>
	{#snippet trigger()}
	<media-google-cast-button
	class="group relative inline-flex sm:hidden h-10 w-10 cursor-pointer items-center justify-center rounded-md outline-none ring-inset ring-sky-400 hover:bg-white/20 data-[focus]:ring-1 p-2.5"
>
	<IconGoogleCast type="chromecast" class="h-8 w-8"></IconGoogleCast>
</media-google-cast-button>
	{/snippet}
	{#snippet content()}
	
			<span class="">Xem trên TV</span>
		
	{/snippet}
</Tooltip>
