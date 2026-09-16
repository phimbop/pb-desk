<script lang="ts">
  import SliderChapters from './SliderChapters.svelte';
  import SliderPreview from './SliderPreview.svelte';
  import SliderThumb from './SliderThumb.svelte';

  interface Props {
    thumbnails?: string | undefined;
  }

  let { thumbnails = undefined }: Props = $props();
</script>

<media-time-slider
  class="group relative mx-1 md:mx-[7.5px] inline-flex h-10 w-full cursor-pointer touch-none select-none items-center outline-hidden"
>
  <SliderChapters />
  <SliderThumb />
  <SliderPreview {thumbnails}>
    <div class="mt-2 text-sm" data-part="chapter-title"></div>
    <media-slider-value class="text-[13px]"></media-slider-value>
  </SliderPreview>
</media-time-slider>
