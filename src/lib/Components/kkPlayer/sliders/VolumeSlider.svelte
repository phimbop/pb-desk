<script lang="ts">
  import SliderPreview from './SliderPreview.svelte';
  import SliderThumb from './SliderThumb.svelte';
</script>

<media-volume-slider
  class="group relative mx-[7.5px] inline-flex h-10 w-full max-w-[80px] cursor-pointer touch-none select-none items-center outline-hidden aria-hidden:hidden"
>
  <!-- Track -->
  <div
    class="relative z-0 h-[5px] w-full rounded-xs bg-white/30 ring-neonPink-500 group-data-focus:ring-[3px]"
  >
    <!-- Track Fill -->
    <div
      class="absolute h-full w-[var(--slider-fill)] rounded-xs bg-white will-change-[width]"
    ></div>
  </div>
  <!-- Thumb -->
  <div
    class="absolute left-[var(--slider-fill)] top-1/2 z-20 h-[15px] w-[15px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#cacaca] bg-white opacity-0 ring-white/40 transition-opacity will-change-[left] group-data-active:opacity-100 group-data-dragging:ring-4"
  ></div>
  <SliderThumb />
  <SliderPreview noClamp>
    <media-slider-value class="rounded-xs bg-black px-2 py-px text-[13px] font-medium"></media-slider-value>
  </SliderPreview>
</media-volume-slider>