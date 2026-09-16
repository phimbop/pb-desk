<script lang="ts">
  import type { TooltipPlacement } from 'vidstack';

  import Tooltip from '../Tooltip.svelte';
	import IconFullScreen from '$lib/Components/Icon/IconFullScreen.svelte';
	import IconExitFullScreen from '$lib/Components/Icon/IconExitFullScreen.svelte';

  interface Props {
    tooltipPlacement: TooltipPlacement;
  }

  let { tooltipPlacement }: Props = $props();
</script>
<div class="group">
<Tooltip placement={tooltipPlacement}>
  {#snippet trigger()}
<media-fullscreen-button
  class="relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md outline-none ring-inset ring-neonPink-400 hover:bg-white/20 aria-hidden:hidden data-[focus]:ring-4 p-2.5"
>
  <!-- <media-icon type="fullscreen" class="h-8 w-8 group-data-[active]:hidden"></media-icon> -->
  <IconFullScreen class="h-8 w-8 group-has-data-[active]:hidden" type="fullscreen"></IconFullScreen>
  <!-- <media-icon type="fullscreen-exit" class="hidden h-8 w-8 group-has-data-[active]:block"></media-icon> -->
  <IconExitFullScreen type="fullscreen-exit" class="hidden h-8 w-8 group-has-data-[active]:block"></IconExitFullScreen>
</media-fullscreen-button>
  {/snippet}

  {#snippet content()}
      <span class="group-has-data-[active]:hidden">Toàn màn hình</span>
      <span class="group-has-data-[active]:block hidden">Thoát màn hình</span>
  {/snippet}
</Tooltip>
</div>
