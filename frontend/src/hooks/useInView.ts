import { useEffect, useRef, useState } from 'react';

type UseInViewOptions = IntersectionObserverInit & {
  once?: boolean;
};

export function useInView<T extends HTMLElement = HTMLDivElement>(options?: UseInViewOptions) {
  const { once = true, threshold = 0.12, rootMargin = '0px 0px -6% 0px', root } = options ?? {};
  const ref = useRef<T>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (once) obs.unobserve(el);
        } else if (!once) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin, root }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [once, threshold, rootMargin, root]);

  return { ref, isInView };
}
