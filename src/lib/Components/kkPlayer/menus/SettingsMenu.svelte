<script lang="ts">
  import type { MenuPlacement, TooltipPlacement } from 'vidstack';

  import CaptionSubmenu from './CaptionSubmenu.svelte';
  import Menu from './Menu.svelte';
	import SpeedSubmenu from './SpeedSubmenu.svelte';

  interface Props {
    placement: MenuPlacement;
    tooltipPlacement: TooltipPlacement;
  }

  let { placement, tooltipPlacement }: Props = $props();
</script>

<Menu {placement} {tooltipPlacement}>
  <media-icon
    slot="button"
    class="h-8 w-8 transform transition-transform duration-200 ease-out group-data-open:rotate-90"
    type="settings"
  ></media-icon>
  <svelte:fragment slot="content">
    <CaptionSubmenu />
    <SpeedSubmenu />
  </svelte:fragment>
  <span slot="tooltip-content">Cài đặt</span>
</Menu>
