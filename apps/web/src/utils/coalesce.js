// Merges bursts of calls into one trailing call of `fn` at most every `wait` ms.
export const coalesce = (fn, wait) => {
  let timer = null;
  return () => {
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      fn();
    }, wait);
  };
};
