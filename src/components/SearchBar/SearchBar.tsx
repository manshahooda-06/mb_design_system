'use client';
import { forwardRef, useState, type ChangeEvent } from 'react';
import { useReducedMotion } from 'framer-motion';
import { cn } from '@utils/cn';
import { SearchBarPlaceholder } from './components/SearchBarPlaceholder';
import { SEARCH_BAR_CONSTANTS, wordForType } from './constants';
import {
  searchBarClearVariants,
  searchBarContentVariants,
  searchBarFieldVariants,
  searchBarInputVariants,
  searchBarRootVariants,
  searchBarSearchIconVariants,
} from './SearchBar.variants';
import type { SearchBarProps } from './types';

const { ARIA_LABELS, TEXT, MOTION } = SEARCH_BAR_CONSTANTS;

/**
 * A search field with a two-part animated placeholder.
 *
 * Measured from Figma `Search Bar` (node 4353:2239) — six variants, `Device`(3) ×
 * `State`(2) — and its private `_Search animating text` set (node 4353:6249), twelve
 * variants of `Device`(3) × `type`(4) plus a `showAnimatedText` boolean.
 *
 * **`State` is derived, never a prop.** Figma publishes Default and Filled as an axis,
 * but Filled is fully determined by whether there is text: an empty value draws the
 * placeholder, a non-empty one draws the value and the clear button. A prop would let a
 * caller ask for Filled with nothing in the field.
 *
 * **The placeholder is two elements, never one string.** It lives in
 * `components/SearchBarPlaceholder`, which owns the cycling so a tick never re-renders
 * this component. See that file for the motion contract.
 *
 * `search-01` and `cancel-01` are supplied by the caller, as every other glyph in the
 * library is: the icon foundation is a deliberate stub and no component bundles a
 * library glyph.
 *
 * Only the two published states exist. There is no hover, pressed, disabled, error or
 * loading treatment, because Figma draws none. Focus is the library's shared indicator
 * on the container — Figma publishes no focus state, and the browser's own ring is a
 * differently-coloured rectangle in every engine that ignores the 12px radius.
 *
 * ```tsx
 * <SearchBar searchIcon={<SearchIcon />} clearIcon={<CancelIcon />} />
 * <SearchBar value={query} onValueChange={setQuery} intervalMs={3000} />
 * <SearchBar type="hospital" animate={false} />
 * <SearchBar showAnimatedText={false} device="desktop-1920" />
 * ```
 */
export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(function SearchBar(
  {
    device = 'mobile',
    type = 'doctor',
    showAnimatedText = true,
    animate = true,
    intervalMs = MOTION.INTERVAL_MS,
    value,
    filledText,
    onValueChange,
    onClear,
    searchIcon,
    clearIcon,
    clearLabel = ARIA_LABELS.CLEAR_SEARCH,
    className,
    classNames,
    onChange,
    'aria-label': ariaLabel,
    ...rest
  },
  ref,
) {
  // Uncontrolled unless `value` is supplied, seeded from Figma's own text property.
  const [uncontrolledValue, setUncontrolledValue] = useState(filledText ?? '');
  const currentValue = value ?? uncontrolledValue;

  // Figma's `State`, derived. Filled is exactly "there is text".
  const filled = currentValue.length > 0;

  const commit = (next: string) => {
    if (value === undefined) setUncontrolledValue(next);
    onValueChange?.(next);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    commit(event.target.value);
    onChange?.(event);
  };

  const handleClear = () => {
    commit('');
    onClear?.();
  };

  // The animated half is on screen only while the placeholder is — Filled replaces it.
  const wordVisible = !filled && showAnimatedText;

  // Read here as well as in the placeholder, because it decides the accessible name: a
  // word that cannot move is part of the name, and under reduced motion none of them move.
  const prefersReducedMotion = useReducedMotion();
  const wordIsStill = !animate || prefersReducedMotion === true;

  // The placeholder is decorative — it duplicates what the accessible name already says —
  // so it is hidden from assistive technology and the name is composed instead. A name
  // can only ever be one string; the *rendered* placeholder stays two elements.
  //
  // **The name only claims a word that is on screen and holding still.** A name that
  // changed every couple of seconds would churn for anyone focused on an empty field, and
  // the cycling words are illustrative rather than instructions — so while they move, and
  // once Filled has replaced them, only the static half names the field.
  const pinnedWord = wordVisible && wordIsStill ? wordForType(type) : undefined;
  const composedLabel = pinnedWord !== undefined ? `${TEXT.STATIC} ${pinnedWord}` : TEXT.STATIC;

  return (
    <div className={cn(searchBarRootVariants({ device }), classNames?.root, className)}>
      <div className={cn(searchBarContentVariants({ device }), classNames?.content)}>
        <span
          className={cn(searchBarSearchIconVariants({ device }), classNames?.searchIcon)}
          aria-hidden
        >
          {searchIcon}
        </span>

        <span className={cn(searchBarFieldVariants({ device }), classNames?.field)}>
          <input
            ref={ref}
            type="search"
            value={currentValue}
            aria-label={ariaLabel ?? composedLabel}
            className={cn(searchBarInputVariants({ device }), classNames?.input)}
            {...rest}
            onChange={handleChange}
          />

          {!filled && (
            <SearchBarPlaceholder
              device={device}
              type={type}
              showAnimatedText={showAnimatedText}
              animate={animate}
              intervalMs={intervalMs}
              classNames={classNames}
            />
          )}
        </span>
      </div>

      {filled && (
        <button
          type="button"
          aria-label={clearLabel}
          onClick={handleClear}
          className={cn(searchBarClearVariants({ device }), classNames?.clearIcon)}
        >
          <span aria-hidden>{clearIcon}</span>
        </button>
      )}
    </div>
  );
});

SearchBar.displayName = 'SearchBar';
