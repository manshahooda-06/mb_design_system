import { forwardRef, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cn } from '@utils/cn';
import {
  toastContentVariants,
  toastIconVariants,
  toastPostTextVariants,
  toastPostVariants,
  toastPrimaryTextVariants,
  toastVariants,
} from './Toast.variants';
import { TOAST_STATES } from './constants';
import type { BaseComponentProps, SlotClassNames } from '@/types';

export type ToastState = (typeof TOAST_STATES)[number];

export type ToastSlot =
  'root' | 'content' | 'leftIcon' | 'primaryText' | 'post' | 'postText' | 'postIcon';

interface ToastOwnProps extends Omit<BaseComponentProps, 'children'> {
  /**
   * Figma's `State` axis, valued `Mobile | Desktop`.
   *
   * Named `State` in Figma but valued as devices, so the name is Figma's and the values
   * are lowercased like every other enum in this library.
   */
  state?: ToastState;

  /**
   * Figma's `Primary Text` — the message.
   *
   * Figma types "Placeholder Text" into the layer; that is placeholder copy, not a
   * default, so none ships here. Same call as UploadModule's label and the Beneficiary
   * badge's "Sponsored".
   */
  primaryText?: ReactNode;

  /** Figma's `Pre Icon Show`. Gated with `leftIcon`; see the note on the component. */
  preIconShow?: boolean;

  /**
   * Figma's `left icon` — one of its two instance swaps, defaulting to a `circle`.
   *
   * Caller-supplied, and that `circle` is not shipped: it is a plain stroked ring, the
   * placeholder Figma's icon library uses for "an icon goes here" rather than artwork
   * that means anything. Every recognisable glyph in this library is the caller's
   * already — Checkbox's tick, SearchBar's magnifier, UploadModule's three. Sized by the
   * slot and coloured by `currentColor`, so the glyph needs neither.
   */
  leftIcon?: ReactNode;

  /** Figma's `Post Text Show`. Gated with `postText`. */
  postTextShow?: boolean;

  /**
   * Figma's `Post Text` — the trailing action's label.
   *
   * Figma's default is "Undo", which is product copy rather than design, so it does not
   * ship. Stays on one line while the primary text reflows.
   */
  postText?: ReactNode;

  /** Figma's `Post Icon Show` — plural, as published. Gated with `postIcon`. */
  postIconShow?: boolean;

  /**
   * Figma's `post icon` — its second instance swap, also defaulting to `circle`.
   *
   * Caller-supplied, as `leftIcon` is. Unlike the leading glyph this slot is **not**
   * hidden from assistive technology, because it is where a dismiss or undo control
   * naturally goes: a caller passing a `<button>` here needs it to stay reachable, and
   * `aria-hidden` on the wrapper would bury it. A purely decorative glyph should carry
   * its own `aria-hidden`, which is what this library's own stories do.
   */
  postIcon?: ReactNode;

  classNames?: SlotClassNames<ToastSlot>;
}

export type ToastProps = ToastOwnProps &
  Omit<ComponentPropsWithRef<'div'>, keyof ToastOwnProps | 'children'>;

/**
 * A status bar that reports what just happened.
 *
 * Figma `Toast` — node `2181:829`, **2 variants** on a single `State` axis valued
 * `Mobile | Desktop`. Both are implemented.
 *
 * **This is the toast as drawn, not a toast system.** Figma publishes eight properties
 * and not one of them is behavioural: there is no open state, no duration, no placement,
 * no enter or exit treatment, no dismiss handler and no interaction of any kind across
 * either variant. So none of that is invented here. Positioning, queueing, timing and
 * dismissal belong to whatever shows the toast, and a caller who needs the trailing
 * action to do something passes a control as `postIcon` or wraps `postText` in one —
 * the same division Tooltip uses for visibility and placement.
 *
 * **The three visibility booleans are Figma's own and are gated with their content.**
 * `false` never renders its part, and `true` renders it only once there is something to
 * put there. The booleans stay authoritative — they can always hide a part that has
 * content — but they cannot conjure a part that has none, because this library ships no
 * icon artwork and no default copy, so the alternative is a 16px hole in the layout or an
 * empty text node holding open an 8px gap. Same gate UploadModule's affordances use.
 *
 * **Width is pinned; height is not.** Figma pins 328 and 480, and the layout needs a
 * definite width to mean anything: the leading content flexes and the trailing content
 * stays intrinsic. The heights fall out of the padding exactly — `8 + (2 + 20 + 2) + 8`
 * and `16 + 24 + 16` — so nothing declares them.
 *
 * Nothing here is stateful, so the module needs no `'use client'` and renders on the
 * server.
 *
 * @example
 * <Toast primaryText="Prescription uploaded" />
 *
 * @example
 * // The trailing action is the caller's control, because Figma publishes no handler.
 * <Toast
 *   state="desktop"
 *   leftIcon={<CheckCircleIcon />}
 *   primaryText="Prescription uploaded"
 *   postText={<button type="button" onClick={undo}>Undo</button>}
 *   postIcon={<button type="button" aria-label="Dismiss" onClick={close}><CloseIcon /></button>}
 * />
 */
export const Toast = forwardRef<HTMLDivElement, ToastProps>(function Toast(
  {
    state = 'mobile',
    primaryText,
    preIconShow = true,
    leftIcon,
    postTextShow = true,
    postText,
    postIconShow = true,
    postIcon,
    className,
    classNames,
    ...rest
  },
  ref,
) {
  return (
    <div
      ref={ref}
      /*
       * A toast that assistive technology never announces is not doing its job, and
       * `status` is the non-interactive role for exactly this — a polite live region for
       * advisory information. It is an accessibility addition rather than anything Figma
       * publishes, and `rest` spreads after it, so a caller who needs `role="alert"` for
       * something urgent can say so.
       */
      role="status"
      className={cn(toastVariants({ state }), className, classNames?.root)}
      {...rest}
    >
      <div className={cn(toastContentVariants({ state }), classNames?.content)}>
        {preIconShow && leftIcon != null && (
          <span className={cn(toastIconVariants({ state }), classNames?.leftIcon)} aria-hidden>
            {leftIcon}
          </span>
        )}
        {primaryText != null && (
          <span className={cn(toastPrimaryTextVariants({ state }), classNames?.primaryText)}>
            {primaryText}
          </span>
        )}
      </div>

      {((postTextShow && postText != null) || (postIconShow && postIcon != null)) && (
        <div className={cn(toastPostVariants({ state }), classNames?.post)}>
          {postTextShow && postText != null && (
            <span className={cn(toastPostTextVariants({ state }), classNames?.postText)}>
              {postText}
            </span>
          )}
          {postIconShow && postIcon != null && (
            <span className={cn(toastIconVariants({ state }), classNames?.postIcon)}>
              {postIcon}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

Toast.displayName = 'Toast';
