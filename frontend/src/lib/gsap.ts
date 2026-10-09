import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger };

/**
 * Standard animation configuration presets following high-end agency standards
 */
export const GSAP_PRESETS = {
  ease: {
    out: 'power2.out',
    inOut: 'power2.inOut',
    smooth: 'power3.out',
    bounce: 'back.out(1.4)',
  },
  duration: {
    fast: 0.35,
    normal: 0.65,
    slow: 0.95,
  },
  stagger: {
    snappy: 0.08,
    standard: 0.12,
  },
};

/**
 * Helper to animate numbers rolling up on scroll
 */
export const animateCounter = (
  target: HTMLElement | string,
  endValue: number,
  options?: {
    prefix?: string;
    suffix?: string;
    decimals?: number;
    duration?: number;
    trigger?: HTMLElement | string;
  }
) => {
  const { prefix = '', suffix = '', decimals = 0, duration = 1.2, trigger } = options || {};
  const obj = { val: 0 };

  return gsap.to(obj, {
    val: endValue,
    duration,
    ease: 'power2.out',
    scrollTrigger: trigger
      ? {
          trigger,
          start: 'top 85%',
          once: true,
        }
      : undefined,
    onUpdate: () => {
      const el = typeof target === 'string' ? document.querySelector(target) : target;
      if (el) {
        el.textContent = `${prefix}${obj.val.toFixed(decimals)}${suffix}`;
      }
    },
  });
};
