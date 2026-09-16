<script lang="ts">
  import type { TooltipPlacement } from 'vidstack';

  import Tooltip from '../Tooltip.svelte';
	import IconPause from '$lib/Components/Icon/IconPause.svelte';
	import IconPlayMedia from '$lib/Components/Icon/IconPlayMedia.svelte';

  interface Props {
    tooltipPlacement: TooltipPlacement;
  }

  let { tooltipPlacement }: Props = $props();
</script>

<div class="group">
<Tooltip placement={tooltipPlacement}>
  {#snippet trigger()}
  <media-play-button
  class="relative hidden sm:inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md outline-none ring-inset ring-neonPink-400 hover:bg-white/20 data-[focus]:ring-4 p-2.5"
> 
  <IconPlayMedia type="play" class="hidden text-neonPink-500 h-8 w-8 group-has-data-[paused]:block"></IconPlayMedia>
  <IconPause type="pause" class=" h-8 w-8 group-has-data-[paused]:hidden"></IconPause>
</media-play-button>
{/snippet}
{#snippet content()}
  <span class="group-has-data-[paused]:block hidden">Phát</span>
  <span class="group-has-data-[paused]:hidden">Dừng</span>
  {/snippet}
</Tooltip>
</div>
