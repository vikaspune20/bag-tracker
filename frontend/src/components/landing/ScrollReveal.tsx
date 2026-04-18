import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { useInView } from '../../hooks/useInView';

type Props = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
};

export function ScrollReveal({ children, className, delayMs = 0 }: Props) {
  const { ref, isInView } = useInView({ threshold: 0.08, rootMargin: '0px 0px -4% 0px' });

  return (
    <div
      ref={ref}
      style={{ transitionDelay: isInView ? `${delayMs}ms` : '0ms' }}
      className={cn(
        'transition-[opacity,transform] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none',
        isInView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
        className
      )}
    >
      {children}
    </div>
  );
}
