'use client';
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@utils/cn';
import { SEARCH_BAR_CONSTANTS, SEARCH_BAR_TYPES } from '../constants';
import {
  searchBarAnimatingStackVariants,
  searchBarAnimatingTextVariants,
  searchBarAnimatingWordVariants,
  searchBarPlaceholderVariants,
  searchBarStaticTextVariants,
} from '../SearchBar.variants';
import type { SearchBarDevice, SearchBarType } from '../types';

const { TEXT, WORDS, MOTION } = SEARCH_BAR_CONSTANTS;

export interface SearchBarPlaceholderProps {
  device: SearchBarDevice;
  /** The word the cycle starts from, and the pinned word when `animate` is false. */
  type: SearchBarType;
  /** Figma's `showAnimatedText`. False keeps the static half and drops the stack. */
  showAnimatedText: boolean;
  animate: boolean;
  intervalMs: number;
  classNames?: { placeholder?: string; staticText?: string; animatingText?: string };
}

function subscribeToVisibility(onChange: () => void): () => void {
  document.addEventListener('visibilitychange', onChange);
  return () => document.removeEventListener('visibilitychange', onChange);
}

/**
 * Figma's `_Search animating text`, private to SearchBar.
 *
 * Two children, never one string: the static "Search by" and a one-line window onto a
 * stack of four words. `type` and `showAnimatedText` reach only the stack — the static
 * half sits outside it and cannot move.
 *
 * **Cycling `type` is the whole animation.** Every word stays mounted and the stack is
 * offset by one line pitch per step, which is Figma's own mechanism, so the measured
 * offsets stay the single source of geometry. The travel is driven by framer-motion,
 * following the frontend repo's motion layer and its `AnimatedRotatingText` — but
 * animating Figma's pitch rather than that component's ±15px fade, which would lose the
 * clipped-window geometry the design depends on.
 *
 * Owns its own timer, as `AnimatedRotatingText` does, so the parent never re-renders on a
 * tick. It pauses when the tab is hidden — a hidden tab throttles timers to about once a
 * second and runs no transitions, so a cycle left running there animates nothing anyone
 * can see — and stops entirely under `prefers-reduced-motion`, read through
 * framer-motion's own `useReducedMotion`.
 */
export function SearchBarPlaceholder({
  device,
  type,
  showAnimatedText,
  animate,
  intervalMs,
  classNames,
}: SearchBarPlaceholderProps) {
  // State is how many steps the cycle has taken, not which word shows, so a new `type`
  // re-seeds it during render rather than through an effect that corrects itself after.
  const [step, setStep] = useState(0);
  const startIndex = Math.max(0, SEARCH_BAR_TYPES.indexOf(type));
  const index = (startIndex + step) % SEARCH_BAR_TYPES.length;

  const prefersReducedMotion = useReducedMotion();
  const [pageVisible, setPageVisible] = useState(true);

  useEffect(() => {
    const read = () => setPageVisible(document.visibilityState !== 'hidden');
    read();
    return subscribeToVisibility(read);
  }, []);

  const cycling = animate && showAnimatedText && !prefersReducedMotion;

  useEffect(() => {
    if (!cycling || !pageVisible) return;
    const timer = setInterval(
      () => setStep((current) => (current + 1) % SEARCH_BAR_TYPES.length),
      intervalMs,
    );
    return () => clearInterval(timer);
  }, [cycling, pageVisible, intervalMs]);

  // The step that wraps back to the first word resets instantly; sliding there would
  // scroll backwards through all four. A pinned word never animates at all.
  const wrapping = index === 0;
  const duration = cycling && !wrapping ? MOTION.DURATION_S : 0;

  return (
    <span
      className={cn(searchBarPlaceholderVariants({ device }), classNames?.placeholder)}
      aria-hidden
    >
      <span className={cn(searchBarStaticTextVariants(), classNames?.staticText)}>
        {TEXT.STATIC}
      </span>

      {showAnimatedText && (
        <span
          className={cn(searchBarAnimatingTextVariants({ device }), classNames?.animatingText)}
          // Which of Figma's four `type` values is in the window. A state attribute in the
          // Radix idiom the frontend repo already builds on: it lets a consumer style or
          // assert on the cycle, which an in-flight framer-motion transform cannot express.
          data-active-type={SEARCH_BAR_TYPES[index]}
        >
          <motion.span
            className={searchBarAnimatingStackVariants()}
            // `initial={false}` so the first paint is the resting position rather than an
            // entry animation Figma does not draw.
            initial={false}
            animate={{ y: -(index * MOTION.PITCH[device]) }}
            transition={{ duration, ease: 'easeInOut' }}
          >
            {WORDS.map(([key, word]) => (
              <span key={key} className={searchBarAnimatingWordVariants()}>
                {word}
              </span>
            ))}
          </motion.span>
        </span>
      )}
    </span>
  );
}

SearchBarPlaceholder.displayName = 'SearchBarPlaceholder';
