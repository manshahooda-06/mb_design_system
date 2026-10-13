/**
 * The shared variant architecture.
 *
 * Every component declares its styling as data — a base class string plus a map
 * of variant name to class string — rather than as branching inside the render
 * function. Styling is then inspectable, diffable and testable without rendering
 * anything, and the component's prop types are derived from the same declaration
 * that produces its classes, so the two cannot drift apart.
 *
 * Convention: one `<Name>.variants.ts` per component, exporting `<name>Variants`
 * (or one export per slot for multi-part components). The component file imports
 * it and does nothing but choose props.
 *
 * @example
 * // Button.variants.ts
 * export const buttonVariants = defineVariants(
 *   'inline-flex items-center justify-center',
 *   {
 *     variants: {
 *       variant: { primary: 'bg-semantic-button-primary-bg', … },
 *       size: { md: 'px-semantic-md py-semantic-xs', … },
 *     },
 *     defaultVariants: { variant: 'primary', size: 'md' },
 *   },
 * );
 *
 * // Button.tsx
 * type ButtonVariantProps = VariantProps<typeof buttonVariants>;
 * <button className={buttonVariants({ variant, size, className })} />
 */
import { cva } from 'class-variance-authority';
import { cn } from './cn';

export type { VariantProps } from 'class-variance-authority';

/**
 * Declares a component's variants. Use in place of `cva` directly.
 *
 * Identical to `cva` except that the result is passed through `cn`, so Tailwind
 * conflicts are resolved by specificity of intent rather than by stylesheet order.
 * That matters more than it sounds: `cx` (what `cva` uses internally) concatenates,
 * so a base of `rounded-semantic-md` and a compound variant of `rounded-full`
 * would both survive, and which one won would depend on the order Tailwind happened
 * to emit them in — not on which the component asked for. `twMerge` drops the
 * loser. Wrapping here rather than at each call site means a component cannot
 * forget.
 *
 * The `className` passed in the props object is appended last and therefore wins,
 * which is what makes consumer overrides work without `!important`.
 *
 * Typed as `typeof cva` so variant-prop inference and `VariantProps<>` behave
 * exactly as they would with `cva` itself.
 */
export const defineVariants: typeof cva = (base, config) => {
  const resolve = cva(base, config);
  return (props) => cn(resolve(props));
};
