<script lang="ts">
  import type { TooltipPlacement } from 'vidstack';

import Tooltip from '../Tooltip.svelte';

  interface Props {
    tooltipPlacement: TooltipPlacement;
  }

  let { tooltipPlacement }: Props = $props();
</script>
<Tooltip placement={tooltipPlacement}>
{#snippet trigger()}
    <media-seek-button
  class="relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md outline-hidden ring-inset ring-neonPink-500 hover:bg-white/20 aria-hidden:hidden data-focus:ring-4"
  seconds={-10} 
  >
  <media-icon type="seek-backward-10" class="h-8 w-8 active:-rotate-45 active:bg-transparent transition-transform duration-200"></media-icon>
  </media-seek-button>
  {/snippet}
{#snippet content()}
  
      <span class="">-10s</span>

  {/snippet}
</Tooltip>
<div class="mx-1"></div>
<Tooltip placement={tooltipPlacement}>
{#snippet trigger()}
    <media-seek-button
  class="relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md outline-hidden ring-inset ring-neonPink-500 hover:bg-white/20 aria-hidden:hidden data-focus:ring-4"
  seconds={10} 
  >
  <media-icon type="seek-forward-10" class="h-8 w-8 active:rotate-45 active:bg-transparent transition-transform duration-200"></media-icon>
  </media-seek-button>
  {/snippet}
{#snippet content()}
  
      <span class="">+10s</span>

  {/snippet}
</Tooltip>