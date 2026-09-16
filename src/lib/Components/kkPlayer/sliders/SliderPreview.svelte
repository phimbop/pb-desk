<script lang="ts">
  interface Props {
    thumbnails?: string | undefined;
    noClamp?: boolean | undefined;
    children?: import('svelte').Snippet;
  }

  let { thumbnails = undefined, noClamp = undefined, children }: Props = $props();
</script>

<media-slider-preview
  class="flex flex-col items-center opacity-0 transition-opacity duration-200 data-visible:opacity-100 pointer-events-none"
  {noClamp}
>
  {#if thumbnails}
    <media-slider-thumbnail
      class="block h-[var(--thumbnail-height)] max-h-[160px] min-h-[80px] w-[var(--thumbnail-width)] min-w-[120px] max-w-[180px] overflow-hidden border border-white bg-black"
      src={thumbnails}
></media-slider-thumbnail>
  {/if}

  {@render children?.()}
</media-slider-preview>
