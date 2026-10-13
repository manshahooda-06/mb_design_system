import { forwardRef, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cn } from '@utils/cn';
import { Divider } from '../Divider';
import {
  bottomSheetBodyVariants,
  bottomSheetCardVariants,
  bottomSheetCloseVariants,
  bottomSheetContentVariants,
  bottomSheetDragHandleVariants,
  bottomSheetFooterVariants,
  bottomSheetHandleVariants,
  bottomSheetHeaderLeadVariants,
  bottomSheetHeaderRowVariants,
  bottomSheetHeaderVariants,
  bottomSheetLeftIconVariants,
  bottomSheetTitleVariants,
  bottomSheetTopSectionVariants,
  bottomSheetVariants,
} from './BottomSheet.variants';
import { BOTTOM_SHEET_TYPES } from './constants';
import type { BaseComponentProps, SlotClassNames } from '@/types';

export type BottomSheetType = (typeof BOTTOM_SHEET_TYPES)[number];

export type BottomSheetSlot =
  | 'root'
  | 'card'
  | 'dragHandle'
  | 'handle'
  | 'header'
  | 'leftIcon'
  | 'title'
  | 'close'
  | 'content'
  | 'footer';

interface BottomSheetOwnProps extends BaseComponentProps {
  /**
   * Figma's `header` — the sheet's title.
   *
   * Figma types "Placeholder content to be replaced" into the layer, which is placeholder
   * copy rather than a default, so none ships. Truncates to one line.
   */
  header?: ReactNode;

  /** Figma's `showLeftIcon`. Gated with `leftIcon`; see the note on the component. */
  showLeftIcon?: boolean;

  /**
   * Figma's `leftIcon` — the glyph before the title, 20 square.
   *
   * Caller-supplied. Figma's default is the generic stroked `circle` its icon library
   * uses for "an icon goes here", which is a placeholder rather than artwork, so nothing
   * ships — the convention Checkbox's tick and SearchBar's magnifier already set.
   */
  leftIcon?: ReactNode;

  /** Figma's `showFooter`. Gated with `footer`, for the same reason as the icon. */
  showFooter?: boolean;

  /**
   * Figma's `type`, published on the nested `_Footer` rather than on the sheet.
   *
   * Both published values are implemented — `2 buttons` and `1 button`, kebab-cased. They
   * describe how many actions the row holds, and Figma draws the row identically for
   * each: every footer button is `flex: 1 0 0`, so one action spans the full width and
   * two share it equally. Pass the matching number of `Button`s to `footer`.
   */
  type?: BottomSheetType;

  /**
   * The sheet's content — Figma's `_Content Block Placeholder` slot.
   *
   * That placeholder is explicitly marked "swap me with your custom content", so it is a
   * hole in the design rather than a part of it: nothing is drawn here unless the caller
   * fills it, and no placeholder copy ships.
   */
  children?: ReactNode;

  /**
   * The footer's actions. **Engineering composition, not a Figma property.**
   *
   * Figma draws two `Button CTA`s, which are sample labels rather than design. The row
   * supplies the layout Figma specifies — 16 a side, 4 above and below, 8 between, and
   * equal widths — and the actions themselves are the caller's `Button`s.
   *
   * ```tsx
   * footer={<><Button variant="secondary">Cancel</Button><Button>Confirm</Button></>}
   * ```
   */
  footer?: ReactNode;

  /**
   * The close control's glyph — Figma draws `cancel-01`. **Caller-supplied**, as every
   * recognisable glyph in this library is.
   */
  closeIcon?: ReactNode;

  /**
   * The close button's accessible name. **Accessibility addition.**
   *
   * An icon-only control has no text, so it needs a name — the same requirement
   * IconButton puts in its own type. No default, because the right wording depends on
   * what is being closed.
   */
  closeLabel?: string;

  classNames?: SlotClassNames<BottomSheetSlot>;
}

export type BottomSheetProps = BottomSheetOwnProps &
  Omit<ComponentPropsWithRef<'div'>, keyof BottomSheetOwnProps>;

/**
 * A panel that rises from the bottom of the screen over a dimmed background.
 *
 * Figma `Bottom Sheet` — node `4751:5485`. The sheet itself publishes no variant axis:
 * `header`, `leftIcon`, `showLeftIcon` and `showFooter` are content and visibility. The
 * one enum, `type`, sits on the nested `_Footer` and names how many actions it holds —
 * `2 buttons` or `1 button`.
 *
 * **This is the sheet as drawn, not a sheet system.** Figma specifies no open state, no
 * animation, no backdrop dismissal, no drag-to-dismiss, no scroll locking and no focus
 * treatment — and this library has no overlay, portal or dialog architecture to inherit
 * one from, `Modal` being referenced in two comments as something that does not exist
 * yet. So none of it is invented here, **including a close handler**: Figma draws the
 * close as a button and publishes no behaviour behind it, so the button is drawn and
 * nothing more. Mounting, positioning, focus and dismissal all belong to whatever shows
 * the sheet — the same division Tooltip uses for visibility and placement.
 *
 * That division is also why the root carries **no `dialog` role**. A `role="dialog"` with
 * `aria-modal` promises focus containment this component does not implement, and the
 * scrim is decoration rather than the thing being described. A caller building real modal
 * behaviour adds those semantics along with the focus trap that makes them true.
 *
 * **Reuses the canonical parts rather than redrawing them**: `Divider` under the header,
 * and the caller's own `Button`s in the footer, which the row sizes to Figma's equal
 * widths. Nothing about either is re-implemented.
 *
 * **The two visibility booleans are gated with their content.** `false` never renders its
 * part, and `true` renders it only once there is something to put there — no icon artwork
 * and no footer actions ship, so the alternative is a 20px hole beside the title or an
 * empty 28px-tall strip under the content. Same gate UploadModule's affordances and
 * Toast's parts use.
 *
 * Nothing here is stateful, so the module needs no `'use client'` and renders on the
 * server.
 *
 * @example
 * <BottomSheet header="Remove from cart" closeIcon={<CloseIcon />} closeLabel="Close">
 *   <p>This item will be removed from your cart.</p>
 * </BottomSheet>
 *
 * @example
 * // The sheet draws; the caller decides where it lives and when it goes.
 * {open && (
 *   <div className="fixed inset-0 z-50">
 *     <BottomSheet
 *       header="Upload a document"
 *       leftIcon={<UploadIcon />}
 *       closeLabel="Close"
 *       closeIcon={<CloseIcon />}
 *       footer={
 *         <>
 *           <Button variant="secondary" onClick={close}>Cancel</Button>
 *           <Button onClick={submit}>Upload</Button>
 *         </>
 *       }
 *     >
 *       <UploadModule label="Upload New Prescription" icon={<UploadIcon />} />
 *     </BottomSheet>
 *   </div>
 * )}
 */
export const BottomSheet = forwardRef<HTMLDivElement, BottomSheetProps>(function BottomSheet(
  {
    header,
    showLeftIcon = true,
    leftIcon,
    showFooter = true,
    type = 'two-buttons',
    children,
    footer,
    closeIcon,
    closeLabel,
    className,
    classNames,
    ...rest
  },
  ref,
) {
  return (
    <div ref={ref} className={cn(bottomSheetVariants(), className, classNames?.root)} {...rest}>
      <div className={cn(bottomSheetCardVariants(), classNames?.card)}>
        <div className={bottomSheetTopSectionVariants()}>
          <div className={cn(bottomSheetDragHandleVariants(), classNames?.dragHandle)}>
            {/* Drawn because Figma draws it; nothing here makes the sheet draggable. */}
            <span className={cn(bottomSheetHandleVariants(), classNames?.handle)} aria-hidden />
          </div>

          <div className={cn(bottomSheetContentVariants(), classNames?.content)}>
            <div className={cn(bottomSheetHeaderVariants(), classNames?.header)}>
              <div className={bottomSheetHeaderRowVariants()}>
                <div className={bottomSheetHeaderLeadVariants()}>
                  {showLeftIcon && leftIcon != null && (
                    <span
                      className={cn(bottomSheetLeftIconVariants(), classNames?.leftIcon)}
                      aria-hidden
                    >
                      {leftIcon}
                    </span>
                  )}
                  {header != null && (
                    <span className={cn(bottomSheetTitleVariants(), classNames?.title)}>
                      {header}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  aria-label={closeLabel}
                  className={cn(bottomSheetCloseVariants(), classNames?.close)}
                >
                  {closeIcon}
                </button>
              </div>

              <Divider />
            </div>

            {children != null && <div className={bottomSheetBodyVariants()}>{children}</div>}
          </div>
        </div>

        {showFooter && footer != null && (
          <div className={cn(bottomSheetFooterVariants({ type }), classNames?.footer)}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
});

BottomSheet.displayName = 'BottomSheet';
