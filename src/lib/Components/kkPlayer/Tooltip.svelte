<script lang="ts">
  import type { TooltipPlacement } from 'vidstack';
  interface Props {
    placement: TooltipPlacement;
    trigger?: import('svelte').Snippet;
    content?: import('svelte').Snippet;
  }

  let { placement, trigger, content }: Props = $props();
</script>

<media-tooltip class="contents">
  <media-tooltip-trigger>
    {@render trigger?.()}
  </media-tooltip-trigger>
  <media-tooltip-content
    class="z-10 rounded-sm border border-gray-400/20 bg-black/90 px-2 py-0.5 text-sm font-medium text-white animate-out fade-out slide-out-to-bottom-2 data-[visible]:animate-in data-[visible]:fade-in data-[visible]:slide-in-from-bottom-4"
    {placement}
  >
    {@render content?.()}
  </media-tooltip-content>
</media-tooltip>
