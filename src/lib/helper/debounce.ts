// export const debounce = (callback: Function, wait = 300) => {
//     let timeout: ReturnType<typeof setTimeout>;

//     return (...args: any[]) => {
//         clearTimeout(timeout);
//         timeout = setTimeout(() => callback(...args), wait);
//     };
// };

export const debounce = <T extends (...args: any[]) => void>(
    callback: T,
    wait = 300
  ): ((...args: Parameters<T>) => void) & { cancel: () => void } => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
  
    const debounced = (...args: Parameters<T>) => {
      if (timeout !== undefined) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => {
        callback(...args);
        timeout = undefined; // Reset sau khi chạy
      }, wait);
    };
  
    debounced.cancel = () => {
      if (timeout !== undefined) {
        clearTimeout(timeout);
        timeout = undefined;
      }
    };
  
    return debounced as typeof debounced & { cancel: () => void };
  };