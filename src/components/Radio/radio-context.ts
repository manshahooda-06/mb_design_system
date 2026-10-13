'use client';
import { createContext, useContext } from 'react';

/** Figma's `Size` axis. Circles are 16 and 20, both fully rounded. */
export type RadioSize = 'sm' | 'md';

/**
 * What a `RadioGroup` hands down to the radios inside it.
 *
 * `name` is the only part that is load-bearing rather than convenient: same-`name`
 * radios are what the browser treats as one group, and without it they behave as
 * independent toggles that still *look* like a radio group. Everything else here
 * exists so a group's shared settings are declared once.
 *
 * Lives apart from `RadioGroup.tsx` because a module exporting both a component and a
 * helper defeats React Fast Refresh — the same reason `composeRefs` is not inside
 * `Slot`.
 */
export interface RadioGroupContextValue {
  /** Groups the radios in the browser's eyes. Generated when the caller omits one. */
  name: string;
  /** The selected radio's `value`, or `undefined` when nothing is selected. */
  value: string | undefined;
  /** Called with the newly selected value. Never called with a deselection. */
  onSelect: (value: string) => void;
  size: RadioSize | undefined;
  disabled: boolean | undefined;
  required: boolean | undefined;
}

export const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

/**
 * The enclosing group, or `null` for a standalone radio.
 *
 * Returns `null` rather than throwing: Figma publishes single radios, and one in a
 * table row with its own `name` is legitimate.
 */
export function useRadioGroup(): RadioGroupContextValue | null {
  return useContext(RadioGroupContext);
}
