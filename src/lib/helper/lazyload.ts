export function lazyLoad(node: HTMLElement, callback: () => void) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callback();
          observer.disconnect();
        }
      },
      { rootMargin: '50px' } // Tải khi component cách viewport 50px
    );
    observer.observe(node);
    return {
      destroy() {
        observer.disconnect();
      }
    };
  }
  
  