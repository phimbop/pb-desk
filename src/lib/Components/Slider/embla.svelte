<script lang="ts">
  import { onMount } from 'svelte';
  import EmblaCarouselLib, {
    type EmblaCarouselType,
    type EmblaOptionsType,
  } from 'embla-carousel';
  import Autoplay from 'embla-carousel-autoplay';
  // import '$lib/css/embla.css'

  interface Props {
    options?: EmblaOptionsType;
    plugins?: any[];
    slides: ()=> any;
  }

  let {
    options = { loop: true },
    plugins = [Autoplay({ delay: 3000 })],
    slides,
  }: Props = $props();

  /* ---------- REFS ---------- */
  let viewportEl: HTMLDivElement;
  let dotsEl: HTMLDivElement;

  /* ---------- STATE ---------- */
  let api = $state<EmblaCarouselType>();
  let scrollSnaps: number[] = $state([]);
  let selectedIndex = $state(0);
  let lastIndex = $state(0);
  let direction = $state<'next' | 'prev'>('next');

  /* ---------- INIT ---------- */
  onMount(() => {
    api = EmblaCarouselLib(viewportEl, options, plugins);

    scrollSnaps = api.scrollSnapList();

    api.on('select', () => {
      const curr = api!.selectedScrollSnap();
      direction = curr > lastIndex ? 'next' : 'prev';
      selectedIndex = curr;
      lastIndex = curr;
    });

    api.on('init', () => {
      selectedIndex = api!.selectedScrollSnap();
      lastIndex = selectedIndex;
    });

    return () => api?.destroy();
  });

  /* ---------- HELPERS ---------- */
  const scrollTo = (i: number) => api?.scrollTo(i);
</script>

<section class="embla">
  <div class="embla__viewport carousel" bind:this={viewportEl}>
    <div class="embla__container list">
      {@render slides()}
    </div>
  </div>

  <div class="embla__controls z-50">
    <div class="embla__dots" bind:this={dotsEl}>
     {#each scrollSnaps as _, i}
  <button
    class="embla__dot"
    class:embla__dot--selected={i === selectedIndex}
    class:embla__dot--next={i === selectedIndex && direction === 'next'}
    class:embla__dot--prev={i === selectedIndex && direction === 'prev'}
    onclick={() => scrollTo(i)}
    type="button"
  />
{/each}
    </div>
  </div>
</section>