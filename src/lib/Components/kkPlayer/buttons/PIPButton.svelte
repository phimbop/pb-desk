<script lang="ts">
  import type { TooltipPlacement } from 'vidstack';

  import Tooltip from '../Tooltip.svelte';
	import IconPipOn from '$lib/Components/Icon/IconPipOn.svelte';
	import IconPipExit from '$lib/Components/Icon/IconPipExit.svelte';

  interface Props {
    tooltipPlacement: TooltipPlacement;
  }

  let { tooltipPlacement }: Props = $props();
</script>
<div class="group">
<Tooltip placement={tooltipPlacement}>
{#snippet trigger()}
<media-pip-button
  class="relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md outline-none ring-inset ring-sky-400 hover:bg-white/20 aria-hidden:hidden data-[focus]:ring-4"
>
      <IconPipOn type="picture-in-picture" class="h-8 w-8 group-has-data-[active]:hidden"></IconPipOn>
      <IconPipExit type="picture-in-picture-exit"
      class="hidden h-8 w-8 group-has-data-[active]:block"></IconPipExit>
    </media-pip-button>
  {/snippet}

  {#snippet content()}
  
      <span class="group-has-data-[active]:hidden">Vào PIP</span>
      <span class="group-has-data-[active]:block hidden">Thoát PIP</span>
    
  {/snippet}
</Tooltip>
</div>