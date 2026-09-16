<!-- Carousel.svelte -->
<script lang="ts">
  import '$lib/css/carousel.css';

  let { tvDetail }: { tvDetail: TvSeriesDetail } = $props();

  let carouselEl: HTMLDivElement;
  let listEl: HTMLDivElement;
  let nextBtn: HTMLButtonElement;
  let prevBtn: HTMLButtonElement;
  let backBtn: HTMLButtonElement;

  let unacceptClick: any;

  let mode: 'next' | 'prev' | 'showDetail' | null = $state(null);

  const showSlider = (type: 'next' | 'prev') => {
    nextBtn.style.pointerEvents = 'none';
    prevBtn.style.pointerEvents = 'none';

    mode = null; // reset class
    queueMicrotask(() => {
      mode = type;
    });

    const items = listEl.querySelectorAll<HTMLElement>('.item');
    if (type === 'next') {
      listEl.appendChild(items[0]);
    } else {
      listEl.prepend(items[items.length - 1]);
    }

    clearTimeout(unacceptClick);
    unacceptClick = setTimeout(() => {
      nextBtn.style.pointerEvents = 'auto';
      prevBtn.style.pointerEvents = 'auto';
    }, 2000);
  };

  $effect(() => {
    // chỉ chạy 1 lần sau khi render
    const onNext = () => showSlider('next');
    const onPrev = () => showSlider('prev');
    const onBack = () => (mode = null);

    nextBtn.addEventListener('click', onNext);
    prevBtn.addEventListener('click', onPrev);
    backBtn.addEventListener('click', onBack);

    const seeMoreBtns = listEl.querySelectorAll<HTMLButtonElement>('.seeMore');
    const onSeeMore = () => (mode = 'showDetail');
    seeMoreBtns.forEach((b) => b.addEventListener('click', onSeeMore));

    return () => {
      nextBtn.removeEventListener('click', onNext);
      prevBtn.removeEventListener('click', onPrev);
      backBtn.removeEventListener('click', onBack);
      seeMoreBtns.forEach((b) => b.removeEventListener('click', onSeeMore));
    };
  });
</script>

<div
  bind:this={carouselEl}
  class="carousel"
  class:next={mode === 'next'}
  class:prev={mode === 'prev'}
  class:showDetail={mode === 'showDetail'}
>
  <div bind:this={listEl} class="list">
    {#each tvDetail.seasons as season}
      <div class="item">
        <div
          class="img-wrapper relative after:absolute after:inset-0 after:bg-[radial-gradient(ellipse_40%_60%_at_center,transparent_0%,#0a0a0a_120%)] after:pointer-events-none after:z-10"
        >
          <img
            src={season.poster_path
              ? `https://image.tmdb.org/t/p/original${season.poster_path}`
              : ''}
            alt={season.name}
          />
        </div>

        <div class="introduce">
          <div class="title text-neonPink-500">{season.name}</div>
          <div class="topic text-slate-200">{tvDetail.name}</div>
          <div class="des text-slate-200">
            {season.overview ?? ''}
          </div>
          <button class="seeMore text-slate-200 cursor-pointer hover:text-slate-900">
            Xem thêm &#8599;
          </button>
        </div>

        <div class="detail">
          <div class="title">{tvDetail.name}</div>
          <div class="des">
            {season.overview || tvDetail.overview}
          </div>

          <div class="specifications">
            <div>
              <p>Used Time</p>
              <p>6 hours</p>
            </div>
            <div>
              <p>Charging port</p>
              <p>Type-C</p>
            </div>
            <div>
              <p>Compatible</p>
              <p>Android</p>
            </div>
            <div>
              <p>Bluetooth</p>
              <p>5.3</p>
            </div>
            <div>
              <p>Controlled</p>
              <p>Touch</p>
            </div>
          </div>

          <div class="checkout">
            <button>ADD TO CART</button>
            <button>CHECKOUT</button>
          </div>
        </div>
      </div>
    {/each}
  </div>

  <div class="arrows">
    <button bind:this={prevBtn} class="text-white">prev</button>
    <button bind:this={nextBtn} class="text-white">next</button>
    <button bind:this={backBtn} class="text-white">See All &#8599;</button>
  </div>
</div>