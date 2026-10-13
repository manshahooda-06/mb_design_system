import { forwardRef, type ComponentPropsWithRef, type ElementType, type ReactNode } from 'react';
import { cn } from '@utils/cn';
import {
  uploadModuleActionIconVariants,
  uploadModuleActionInteractiveVariants,
  uploadModuleActionVariants,
  uploadModuleIconVariants,
  uploadModuleInteractiveVariants,
  uploadModuleLabelVariants,
  uploadModulePreviewVariants,
  uploadModuleVariants,
} from './UploadModule.variants';
import { UPLOAD_MODULE_SIZES, UPLOAD_MODULE_STATES } from './constants';
import type { BaseComponentProps, SlotClassNames } from '@/types';

export type UploadModuleSize = (typeof UPLOAD_MODULE_SIZES)[number];

export type UploadModuleState = (typeof UPLOAD_MODULE_STATES)[number];

export type UploadModuleSlot = 'root' | 'icon' | 'label' | 'preview' | 'view' | 'delete';

interface UploadModuleOwnProps extends Omit<BaseComponentProps, 'children'> {
  /** Figma's `Size` axis. */
  size?: UploadModuleSize;

  /**
   * Figma's `State` axis.
   *
   * An explicit axis rather than something derived from whether a preview was given,
   * because Figma publishes it as one — and because a list showing "add another"
   * beside existing previews needs both states available at once.
   *
   * The two prop sets below are **parallel, not a union**: `state` decides which
   * applies, and the other is ignored. Same shape as InputDropdown's `type`, and for
   * the same reason — a discriminated union breaks prop spreading, Storybook args,
   * wrappers and HOCs.
   */
  state?: UploadModuleState;

  /* ---------------------------- state="add" ---------------------------- */

  /**
   * Figma's `buttonName` — the label under the glyph. **`state="add"` only.**
   *
   * Figma types "Upload New Prescription" into the component; that is product copy, so
   * no default ships here. Same call as the Beneficiary badge's "Sponsored".
   */
  label?: ReactNode;

  /**
   * Figma's `icon` — its one instance-swap property, defaulting to `upload-04`.
   * **`state="add"` only.**
   *
   * Caller-supplied, like every recognisable glyph in this library: Checkbox takes
   * `checkIcon` and SearchBar takes `searchIcon` even though Figma draws both. Sized and
   * coloured by the slot, so the glyph itself needs neither.
   */
  icon?: ReactNode;

  /**
   * Fires when the card is activated. **Implementation addition, not a Figma property.**
   *
   * Supplying it makes the root a `<button type="button">` with a focus ring; without it
   * the root is an inert `div` and Figma's drawing is reproduced exactly. Figma publishes
   * no interaction for this card, so the behaviour is opt-in — the same rule
   * TopNavigationBar's account block follows.
   *
   * No file input is provided: Figma publishes none, and a real upload needs a `<label>`
   * around a hidden `<input type="file">` that only the caller can wire up.
   */
  onUpload?: () => void;

  /* -------------------------- state="display" -------------------------- */

  /**
   * The preview that fills the card. **`state="display"` only.**
   *
   * **Implementation addition, not a Figma property** — Figma's image is a placeholder
   * photograph on the frame's fill, not a swappable instance. Taking a node keeps `alt`,
   * `loading` and `next/image` the caller's, and the slot supplies the cover crop and
   * the clip.
   *
   * ```tsx
   * <UploadModule state="display" preview={<img src={url} alt="Prescription" />} />
   * ```
   */
  preview?: ReactNode;

  /**
   * Figma's `showViewIcons` — its exact name, plural, against the singular
   * `showDeleteIcon` beside it. **`state="display"` only.**
   *
   * Gates the view affordance together with `viewIcon`: `false` never renders it, and
   * `true` renders it only once there is a glyph to put in it. The boolean alone cannot
   * draw an empty circle, because no artwork ships with this component.
   */
  showViewIcons?: boolean;

  /**
   * The glyph inside the view affordance — Figma draws `eye`. **Engineering-only.**
   *
   * Required rather than convenient: Figma's `eye` is an icon-library component with no
   * swap property, and this library ships no artwork, so the glyph has to arrive from
   * the caller. Its presence is half of the affordance's visibility gate — see
   * `showViewIcons`.
   */
  viewIcon?: ReactNode;

  /**
   * Fires when the view affordance is activated. **Implementation addition.**
   *
   * Supplying it makes that affordance a `<button>`; without it the circle is drawn as
   * Figma draws it and announced to no one.
   */
  onView?: () => void;

  /**
   * The view button's accessible name. **Accessibility addition.**
   *
   * An icon-only control has no text, so pass this whenever `onView` is given — the same
   * requirement IconButton puts in its own type. No default, because the right wording
   * depends on what is being viewed.
   */
  viewLabel?: string;

  /**
   * Figma's `showDeleteIcon`, defaulting to `true`. **`state="display"` only.**
   *
   * Gated with `deleteIcon`, exactly as `showViewIcons` is.
   */
  showDeleteIcon?: boolean;

  /** As `viewIcon`, for Figma's `delete-02`. **Engineering-only.** */
  deleteIcon?: ReactNode;

  /** Fires when the delete affordance is activated. **Implementation addition.** */
  onDelete?: () => void;

  /** The delete button's accessible name. **Accessibility addition.** See `viewLabel`. */
  deleteLabel?: string;

  classNames?: SlotClassNames<UploadModuleSlot>;
}

export type UploadModuleProps = UploadModuleOwnProps &
  Omit<ComponentPropsWithRef<'div'>, keyof UploadModuleOwnProps | 'children'>;

/** One of the two Display affordances. Private: both are Figma's, neither is composable. */
function UploadModuleAction({
  action,
  size,
  icon,
  onActivate,
  label,
  className,
}: {
  action: 'view' | 'delete';
  size: UploadModuleSize;
  icon: ReactNode;
  onActivate?: () => void;
  label?: string;
  className?: string;
}) {
  const interactive = onActivate != null;
  const Element = (interactive ? 'button' : 'span') as ElementType;

  return (
    <Element
      {...(interactive
        ? { type: 'button', onClick: onActivate, 'aria-label': label }
        : { 'aria-hidden': true })}
      className={cn(
        uploadModuleActionVariants({ size, action }),
        interactive && uploadModuleActionInteractiveVariants(),
        className,
      )}
    >
      <span className={uploadModuleActionIconVariants({ size })}>{icon}</span>
    </Element>
  );
}

/**
 * A square card for adding a file, or for showing the one already added.
 *
 * Figma `Upload Module` — node `2180:67664`, **6 variants**: `Size`(3) × `State`(2). All
 * 6 are implemented.
 *
 * **One component, because the box is genuinely shared.** Size, radius and stroke are
 * identical across both states and only the body differs, so splitting this in two would
 * duplicate a 3×3 table of box values. That is the opposite of BeneficiarySelectChip and
 * BeneficiarySelector, which share the *idea* of an avatar beside a name and share no
 * values, and so were kept apart.
 *
 * **Nothing is reused wholesale, and IconButton deliberately is not.** IconButton is
 * padding-sized with `rounded-sm/md/lg` and variant/tone surfaces; these affordances are
 * pinned circles at 24/32/48 with a bespoke shadow and no tone. Reaching for it would
 * mean overriding its padding, radius, background and shadow — re-styling it into
 * something it is not. What is borrowed from it is the idea, not the code: an icon-only
 * control needs an accessible name, so `viewLabel` and `deleteLabel` exist.
 *
 * **What is Figma's and what is not.** Six properties are published and all six are here
 * under Figma's own names, `buttonName` aside: `size`, `state`, `label`, `icon`,
 * `showViewIcons` and `showDeleteIcon`. The other eight are engineering-only and marked
 * as such on each prop — `preview`, `viewIcon` and `deleteIcon` because the library ships
 * no artwork and Figma's are placeholders and icon-library instances; `onUpload`, `onView`
 * and `onDelete` because Figma publishes no handler; `viewLabel` and `deleteLabel` because
 * an icon-only control needs a name. Nothing else is exposed.
 *
 * Figma publishes **no** hover, focus, pressed, disabled, loading, progress, error,
 * validation, drag-and-drop, file-input or multi-file behaviour, and none is invented
 * here. Nothing is stateful either, so the module needs no `'use client'` and renders on
 * the server.
 *
 * @example
 * <UploadModule label="Upload New Prescription" icon={<UploadIcon />} onUpload={pick} />
 *
 * @example
 * <UploadModule
 *   state="display"
 *   preview={<img src={file.url} alt={file.name} />}
 *   viewIcon={<EyeIcon />}
 *   onView={() => open(file)}
 *   viewLabel={`View ${file.name}`}
 *   deleteIcon={<TrashIcon />}
 *   onDelete={() => remove(file)}
 *   deleteLabel={`Delete ${file.name}`}
 * />
 */
export const UploadModule = forwardRef<HTMLElement, UploadModuleProps>(function UploadModule(
  {
    size = 'sm',
    state = 'add',
    label,
    icon,
    onUpload,
    preview,
    showViewIcons = true,
    viewIcon,
    onView,
    viewLabel,
    showDeleteIcon = true,
    deleteIcon,
    onDelete,
    deleteLabel,
    className,
    classNames,
    ...rest
  },
  ref,
) {
  const isAdd = state === 'add';
  // Figma draws a card, not a control. The root becomes one only when the caller gives
  // it something to do — and never in Display, where it would wrap two real buttons.
  const interactive = isAdd && onUpload != null;
  const Root = (interactive ? 'button' : 'div') as ElementType;

  return (
    <Root
      ref={ref}
      {...(interactive ? { type: 'button', onClick: onUpload } : {})}
      className={cn(
        uploadModuleVariants({ size, state }),
        interactive && uploadModuleInteractiveVariants(),
        className,
        classNames?.root,
      )}
      {...rest}
    >
      {isAdd ? (
        <>
          {icon != null && (
            <span className={cn(uploadModuleIconVariants({ size }), classNames?.icon)} aria-hidden>
              {icon}
            </span>
          )}
          {label != null && (
            <span className={cn(uploadModuleLabelVariants({ size }), classNames?.label)}>
              {label}
            </span>
          )}
        </>
      ) : (
        <>
          {preview != null && (
            <span className={cn(uploadModulePreviewVariants({ size }), classNames?.preview)}>
              {preview}
            </span>
          )}
          {/*
           * Figma's boolean and the glyph together. The boolean is Figma's own and stays
           * exactly as published; the glyph is what stops a `true` with nothing supplied
           * drawing an empty white circle, which Figma never draws.
           */}
          {showViewIcons && viewIcon != null && (
            <UploadModuleAction
              action="view"
              size={size}
              icon={viewIcon}
              onActivate={onView}
              label={viewLabel}
              className={classNames?.view}
            />
          )}
          {showDeleteIcon && deleteIcon != null && (
            <UploadModuleAction
              action="delete"
              size={size}
              icon={deleteIcon}
              onActivate={onDelete}
              label={deleteLabel}
              className={classNames?.delete}
            />
          )}
        </>
      )}
    </Root>
  );
});

UploadModule.displayName = 'UploadModule';
