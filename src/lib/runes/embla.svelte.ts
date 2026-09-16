import type { Action } from 'svelte/action';
import EmblaCarousel, { type EmblaCarouselType, type EmblaOptionsType } from 'embla-carousel';
import Autoplay from 'embla-carousel-autoplay';
  const addDotBtnsAndClickHandlers = (
    emblaApi: EmblaCarouselType,
    dotsNode: HTMLElement
  ): (() => void) => {
    let dotNodes: HTMLElement[] = []

    const addDotBtnsWithClickHandlers = (): void => {
      dotsNode.innerHTML = emblaApi
        .scrollSnapList()
        .map(() => '<button class="embla__dot" type="button"></button>')
        .join('')

      const scrollTo = (index: number): void => {
        emblaApi.scrollTo(index)
      }

      dotNodes = Array.from(dotsNode.querySelectorAll('.embla__dot'))
      dotNodes.forEach((dotNode, index) => {
        dotNode.addEventListener('click', () => scrollTo(index), false)
      })
    }

    const toggleDotBtnsActive = (): void => {
      const previous = emblaApi.previousScrollSnap()
      const selected = emblaApi.selectedScrollSnap()
      dotNodes[previous].classList.remove('embla__dot--selected')
      dotNodes[selected].classList.add('embla__dot--selected')
    }

    emblaApi
      .on('init', addDotBtnsWithClickHandlers)
      .on('reInit', addDotBtnsWithClickHandlers)
      .on('init', toggleDotBtnsActive)
      .on('reInit', toggleDotBtnsActive)
      .on('select', toggleDotBtnsActive)

    return (): void => {
      dotsNode.innerHTML = ''
    }
  }
export const emblaAction: Action<HTMLElement, { options?: EmblaOptionsType; plugins?: any }> = (node, parameter) => {
  // Destructure options and plugins from parameter, with defaults
  const { options = {}, plugins } = parameter || {};

  // const plugins = [Autoplay({ delay: 3000 })];
  // Use a reactive effect if needed, or just run the logic directly
  $effect(() => {
  const emblaNode = node as HTMLElement;
  const viewportNode = emblaNode.querySelector('.embla__viewport') as HTMLElement;
  const prevBtnNode = emblaNode.querySelector('.embla__button--prev') as HTMLElement;
  const nextBtnNode = emblaNode.querySelector('.embla__button--next') as HTMLElement;
  const dotsNode = emblaNode.querySelector('.embla__dots') as HTMLElement;

  // Use options and plugins from parameter
  const emblaApi = EmblaCarousel(viewportNode, options, plugins);
  const removeDotBtnsAndClickHandlers = addDotBtnsAndClickHandlers(
    emblaApi,
    dotsNode
  );

  emblaApi.on('destroy', removeDotBtnsAndClickHandlers);

  // Cleanup when component is destroyed
  return () => {
    emblaApi.destroy();
    removeDotBtnsAndClickHandlers();
  };
});
};
