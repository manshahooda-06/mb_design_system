import { forwardRef, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cn } from '@utils/cn';
import { Divider } from '../Divider';
import {
  modalBodyVariants,
  modalCardVariants,
  modalCloseVariants,
  modalContentVariants,
  modalFooterVariants,
  modalHeaderIconVariants,
  modalHeaderRowVariants,
  modalHeaderVariants,
  modalHeadingVariants,
  modalIllustrationVariants,
  modalSubTextVariants,
  modalTextGroupVariants,
  modalTextVariants,
  modalTitleClusterVariants,
  modalTopSectionVariants,
  modalVariants,
} from './Modal.variants';
import { MODAL_DEVICES, MODAL_TYPES } from './constants';
import type { BaseComponentProps, SlotClassNames } from '@/types';

export type ModalDevice = (typeof MODAL_DEVICES)[number];

export type ModalType = (typeof MODAL_TYPES)[number];

export type ModalSlot =
  | 'root'
  | 'card'
  | 'header'
  | 'icon'
  | 'heading'
  | 'close'
  | 'illustration'
  | 'subText'
  | 'text'
  | 'content'
  | 'footer';

interface ModalOwnProps extends BaseComponentProps {
  /** Figma's `Device` axis, published on the modal and again on the card. */
  device?: ModalDevice;

  /**
   * Figma's `type` axis, published on the nested `_Modal card`.
   *
   * Three layouts rather than three skins — see `constants.ts`. The props below are
   * **parallel, not a union**: `type` decides which apply and the rest are ignored, the
   * same shape InputDropdown's `type` uses and for the same reason.
   */
  type?: ModalType;

  /**
   * Figma's `heading`.
   *
   * Centred under the illustration on `icon-text`; the header's title on the other two,
   * where it truncates to one line so the close button stays pinned. Figma's placeholder
   * copy is not a default, so none ships.
   */
  heading?: ReactNode;

  /** Figma's `showSubText`. **`type="icon-text"` only.** Gated with `subText`. */
  showSubText?: boolean;

  /** Figma's `subText` — the light secondary line under the heading. */
  subText?: ReactNode;

  /** Figma's `text` — the body paragraph. **`type="text-only"` only.** */
  text?: ReactNode;

  /** Figma's `showLeftIcon`. **`text-only` and `custom` only.** Gated with `icon`. */
  showLeftIcon?: boolean;

  /**
   * Figma's `icon` — the header's leading glyph, beside the heading.
   *
   * Caller-supplied. Figma's default is the generic stroked `circle` its icon library
   * uses for "an icon goes here", which is a placeholder rather than artwork.
   */
  icon?: ReactNode;

  /**
   * The illustration above an `icon-text` heading. **Engineering addition.**
   *
   * Figma draws one at 120 (desktop) and 80 (mobile) but binds **no published property**
   * to that layer, so the artwork there can only be changed by editing the file. This
   * library ships no artwork, so it arrives from the caller instead.
   */
  illustration?: ReactNode;

  /**
   * The body of a `custom` modal. **Composition, not a Figma property.**
   *
   * Figma's `_Content Block Placeholder` is marked "swap me with your custom content", so
   * it is a hole in the design rather than a part of it: nothing renders unless filled.
   */
  children?: ReactNode;

  /**
   * The footer's actions. **Composition, not a Figma property.**
   *
   * Figma's two `Button CTA`s are sample labels. The row supplies the layout — 16 apart,
   * sharing the width — and the actions are the caller's `Button`s, `lg` on desktop and
   * `md` on mobile.
   */
  footer?: ReactNode;

  /** The close control's glyph — Figma draws `cancel-01`. Caller-supplied. */
  closeIcon?: ReactNode;

  /**
   * Fires when the close button is pressed. **Engineering addition.**
   *
   * **It notifies; it does not dismiss.** This component holds no visibility state and
   * never unmounts itself — the parent renders it conditionally and decides what a close
   * means. Figma publishes no handler, so nothing else about dismissal is implied.
   */
  onClose?: () => void;

  /** The close button's accessible name. **Accessibility addition.** */
  closeLabel?: string;

  classNames?: SlotClassNames<ModalSlot>;
}

export type ModalProps = ModalOwnProps & Omit<ComponentPropsWithRef<'div'>, keyof ModalOwnProps>;

/**
 * A centred card over a dimmed screen.
 *
 * Figma `Modal` — node `4792:13831` — wrapping `_Modal card` (node `4792:13743`), whose
 * **6 variants** are `type`(3) × `Device`(2). All six are implemented.
 *
 * **One component, because Figma marks the card private.** `_Modal card` carries the
 * underscore Figma reserves for internal parts, the same one on `_Footer` and
 * `_Content Block Placeholder`. The modal is a scrim plus a centred card, so splitting
 * them would export a private part and duplicate the card's 3 × 2 table.
 *
 * **Presentational, and deliberately so.** Figma publishes no open state, no animation, no
 * backdrop dismissal, no focus treatment and no z-index, and this library has no overlay,
 * portal or dialog architecture to inherit one from. So there is no `open`, no portal, no
 * focus trap, no escape handling and no scroll locking here. **The parent owns
 * visibility** — it renders the modal when it wants it and stops when it does not:
 *
 * ```tsx
 * {isOpen && <Modal onClose={() => setIsOpen(false)} />}
 * ```
 *
 * `onClose` only reports that the close button was pressed. Nothing in this component
 * acts on it.
 *
 * That division is also why the root carries **no `dialog` role**: `aria-modal` promises
 * focus containment this component does not implement, and the scrim is decoration rather
 * than the thing being described. Native props spread last, so a caller building real
 * modal behaviour supplies those semantics along with the focus trap that makes them true.
 *
 * **Canonical parts are reused, not redrawn**: `Divider` under the header of `text-only`
 * and `custom`, and the caller's own `Button`s in the footer.
 *
 * Nothing here is stateful, so the module needs no `'use client'` and renders on the
 * server.
 *
 * @example
 * <Modal
 *   device="mobile"
 *   type="icon-text"
 *   illustration={<SuccessArt />}
 *   heading="Order placed"
 *   subText="You will get a confirmation shortly."
 *   closeIcon={<CloseIcon />}
 *   closeLabel="Close"
 *   onClose={() => setOpen(false)}
 *   footer={<Button size="md">Done</Button>}
 * />
 */
export const Modal = forwardRef<HTMLDivElement, ModalProps>(function Modal(
  {
    device = 'desktop',
    type = 'icon-text',
    heading,
    showSubText = true,
    subText,
    text,
    showLeftIcon = true,
    icon,
    illustration,
    children,
    footer,
    closeIcon,
    onClose,
    closeLabel,
    className,
    classNames,
    ...rest
  },
  ref,
) {
  const titled = type !== 'icon-text';

  const headingNode = heading != null && (
    <span className={cn(modalHeadingVariants({ device, type }), classNames?.heading)}>
      {heading}
    </span>
  );

  const subTextNode = showSubText && subText != null && (
    <span className={cn(modalSubTextVariants({ device }), classNames?.subText)}>{subText}</span>
  );

  return (
    <div ref={ref} className={cn(modalVariants(), className, classNames?.root)} {...rest}>
      <div className={cn(modalCardVariants({ device, type }), classNames?.card)}>
        <div className={modalTopSectionVariants({ device, type })}>
          <div className={cn(modalHeaderVariants({ device }), classNames?.header)}>
            <div className={modalHeaderRowVariants({ device, type })}>
              {/*
               * `icon-text` has no title at all — Figma gives that row the close alone,
               * pushed to the end.
               */}
              {titled && (
                <div className={modalTitleClusterVariants({ device })}>
                  {showLeftIcon && icon != null && (
                    <span
                      className={cn(modalHeaderIconVariants({ device }), classNames?.icon)}
                      aria-hidden
                    >
                      {icon}
                    </span>
                  )}
                  {headingNode}
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                aria-label={closeLabel}
                className={cn(modalCloseVariants({ device }), classNames?.close)}
              >
                {closeIcon}
              </button>
            </div>

            {/* Figma puts a divider under the titled headers only. */}
            {titled && <Divider />}
          </div>

          {type === 'icon-text' && (
            <div className={cn(modalContentVariants({ device, type }), classNames?.content)}>
              {illustration != null && (
                <span
                  className={cn(modalIllustrationVariants({ device }), classNames?.illustration)}
                  aria-hidden
                >
                  {illustration}
                </span>
              )}
              {/*
               * Mobile groups the two lines 8 apart; desktop lets the Content gap space
               * them. One extra element on one variant, because Figma draws one.
               */}
              {device === 'mobile' ? (
                (headingNode || subTextNode) && (
                  <div className={modalTextGroupVariants()}>
                    {headingNode}
                    {subTextNode}
                  </div>
                )
              ) : (
                <>
                  {headingNode}
                  {subTextNode}
                </>
              )}
            </div>
          )}

          {type === 'text-only' && text != null && (
            <div className={cn(modalContentVariants({ device, type }), classNames?.content)}>
              <span className={cn(modalTextVariants({ device }), classNames?.text)}>{text}</span>
            </div>
          )}

          {type === 'custom' && children != null && (
            <div className={cn(modalBodyVariants(), classNames?.content)}>{children}</div>
          )}
        </div>

        {footer != null && (
          <div className={cn(modalFooterVariants(), classNames?.footer)}>{footer}</div>
        )}
      </div>
    </div>
  );
});

Modal.displayName = 'Modal';
