<script lang="ts">
  import type { TooltipPlacement } from 'vidstack';

  import Tooltip from '../Tooltip.svelte';
	import IconMute from '$lib/Components/Icon/IconMute.svelte';
	import IconVolumeLow from '$lib/Components/Icon/IconVolumeLow.svelte';
	import IconVolumeHigh from '$lib/Components/Icon/IconVolumeHigh.svelte';

  interface Props {
    tooltipPlacement: TooltipPlacement;
  }

  let { tooltipPlacement }: Props = $props();
</script>
<div class="group">
<Tooltip placement={tooltipPlacement}>
  {#snippet trigger()}
    <media-mute-button
      class="relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md outline-none ring-inset ring-neonPink-400 hover:bg-white/20 data-[focus]:ring-4 p-2.5"
      
    >
      <IconMute class="hidden h-8 w-8 group-has-data-[state='muted']:block text-neonPink-500" type="mute"></IconMute>
      <IconVolumeLow class="hidden h-8 w-8 group-has-data-[state='low']:block" type="volume-low"></IconVolumeLow>
      <IconVolumeHigh class="hidden h-8 w-8 group-has-data-[state='high']:block" type="volume-high"></IconVolumeHigh>
    </media-mute-button>
  {/snippet}

  {#snippet content()}
  
      <span class="group-has-data-[state='muted']:hidden">Tắt tiếng</span>
      <span class="group-has-data-[state='muted']:block hidden">Mở tiếng</span>
    
  {/snippet}
</Tooltip>
</div>
