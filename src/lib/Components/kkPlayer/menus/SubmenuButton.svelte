<script lang="ts">
  interface Props {
    label: string;
    icon?: import('svelte').Snippet;
  }

  let { label, icon }: Props = $props();
</script>

<media-menu-button
  class="ring-media-focus parent left-0 z-10 flex w-full cursor-pointer select-none items-center justify-start rounded-xs bg-black/60 p-2.5 outline-hidden ring-inset data-open:sticky data-open:-top-2.5 data-hocus:bg-white/10 data-focus:ring-[3px] aria-hidden:hidden aria-disabled:hidden"
>
  <media-icon
    class="parent-data-[open]:block -ml-0.5 mr-1.5 hidden h-[18px] w-[18px]"
    type="chevron-left"
></media-icon>
  <div class="contents parent-data-[open]:hidden">
    {@render icon?.()}
  </div>
  <span class="ml-1.5 parent-data-[open]:ml-0">{label}</span>
  <span class="ml-auto text-sm text-white/50" data-part="hint"></span>
  <media-icon
    class="parent-data-[open]:hidden ml-0.5 h-[18px] w-[18px] text-sm text-white/50"
    type="chevron-right"
></media-icon>
</media-menu-button>

<!-- <media-menu-button
class="parent left-0 z-10 flex w-full cursor-pointer select-none items-center justify-start rounded-xs bg-black/60 p-2.5 outline-hidden ring-inset ring-sky-400 aria-disabled:hidden data-open:sticky data-open:-top-2.5 data-hocus:bg-white/10 data-focus:ring-[3px]"
>
<media-icon
  type="chevron-left"
  class="parent-data-[open]:block -ml-0.5 mr-1.5 hidden h-[18px] w-[18px]"
></media-icon>
<media-icon type="odometer" class="parent-data-[open]:hidden h-5 w-5"></media-icon>
<span class="parent-data-[open]:ml-0 ml-1.5">Speed</span>
<span class="ml-auto text-sm text-white/50" data-part="hint"></span>
<media-icon
  type="chevron-right"
  class="parent-data-[open]:hidden ml-0.5 h-[18px] w-[18px] text-sm text-white/50"
></media-icon>
</media-menu-button> -->
