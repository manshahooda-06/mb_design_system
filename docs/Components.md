# Components

Reference documentation for each component in Mozaic.

**Twenty-one components: [Button](#button), [IconButton](#iconbutton), [Input](#input), [Textarea](#textarea), [OtpInput](#otpinput), [InputDropdown](#inputdropdown), [SearchBar](#searchbar), [Tag](#tag), [Toggle](#toggle), [Checkbox](#checkbox), [Radio](#radio), [Avatar](#avatar), [Tooltip](#tooltip), [TopNavigationBar](#topnavigationbar), [BeneficiarySelectChip](#beneficiaryselectchip) [BeneficiarySelector](#beneficiaryselector) [UploadModule](#uploadmodule), [Toast](#toast), [Divider](#divider), [BottomSheet](#bottomsheet) and [Modal](#modal).** The shared architecture it is built on — folder layout, variant system, slots, accessibility helpers, the enforced token rule and the generator — is documented in [Component-Architecture.md](Component-Architecture.md).

Scaffold a component with `pnpm generate:component <Name>`; see [Contributing → How to add a new component](Contributing.md#how-to-add-a-new-component) for the process and definition of done.

## Documentation template

Each component is documented with:

- **Overview** — what it is for, and when to reach for something else
- **Anatomy** — the parts it is composed of
- **Props** — the full public API with types and defaults
- **Variants and states** — every supported combination
- **Accessibility** — roles, keyboard interaction, and focus behavior
- **Usage** — examples, including what not to do

---

## Button

### Overview

The action control. Use it for anything that _does_ something; use an `<a>` (via `asChild`) for anything that _goes_ somewhere, so it is announced as a link and supports middle-click and right-click.

Icon-only buttons are **not** supported — see [Deliberate omissions](#deliberate-omissions).

### Anatomy

```
┌──────────────────────────────────────────┐
│  [ startSlot ]  children  [ endSlot ]    │
└──────────────────────────────────────────┘
     ↑                          ↑
     replaced by the            aria-hidden;
     spinner while loading      the label carries the meaning
```

### Props

| Prop                    | Type                                     | Default     | Notes                                                                 |
| ----------------------- | ---------------------------------------- | ----------- | --------------------------------------------------------------------- |
| `variant`               | `'primary' \| 'secondary' \| 'tertiary'` | `'primary'` | Emphasis: filled, outlined, ghost                                     |
| `tone`                  | `'default' \| 'color' \| 'error'`        | `'default'` | Intent. `'color'` is **not valid** on `primary`                       |
| `size`                  | `'sm' \| 'md' \| 'lg'`                   | `'md'`      |                                                                       |
| `fullWidth`             | `boolean`                                | `false`     |                                                                       |
| `loading`               | `boolean`                                | `false`     | Spinner replaces `startSlot`; blocks activation, stays focusable      |
| `loadingLabel`          | `string`                                 | `'Loading'` | Announced off-screen while loading                                    |
| `disabled`              | `boolean`                                | `false`     | Native attribute on a real `<button>`                                 |
| `startSlot` / `endSlot` | `ReactNode`                              | —           | Shared [content slots](Component-Architecture.md#6-slot-architecture) |
| `asChild`               | `boolean`                                | `false`     | Render the caller's element instead                                   |
| `className`             | `string`                                 | —           | Merged last; wins conflicts                                           |

Plus every native `<button>` prop.

### Variants and states

Two orthogonal axes, mirroring the Figma token structure. **Eight valid pairs, not nine:**

|                          | `default` | `color`        | `error` |
| ------------------------ | --------- | -------------- | ------- |
| **primary** (filled)     | ✅        | **type error** | ✅      |
| **secondary** (outlined) | ✅        | ✅             | ✅      |
| **tertiary** (ghost)     | ✅        | ✅             | ✅      |

`primary` + `color` is unrepresentable in the type system rather than merely undocumented, because `button-primary-bg` already resolves to `brand-600` — a brand-toned primary would be the same button.

A destructive action is `tone="error"` at whichever emphasis fits, which is why filled and outlined destructive buttons need no special cases.

**States:** default, hover, focus-visible, disabled, loading. Loading and disabled render alike apart from the spinner, matching the MB spec, which sets `disabled` on its loading example.

### Sizes

Built from tokens only. **No height is set** — it derives from padding + line-height + border, so the button tracks the type ramp instead of a pixel value no token backs.

| Size | Padding                                       | Label              | Radius            | Resulting height |
| ---- | --------------------------------------------- | ------------------ | ----------------- | ---------------- |
| `sm` | `px-semantic-lg` 12px / `py-semantic-md` 8px  | `caption-md` 14/20 | `rounded-sm` 6px  | 38px             |
| `md` | `px-semantic-xl` 16px / `py-semantic-md` 8px  | `body-sm` 16/24    | `rounded-md` 8px  | 42px             |
| `lg` | `px-semantic-2xl` 20px / `py-semantic-md` 8px | `body-md` 20/28    | `rounded-lg` 10px | 46px             |

Every variant reserves a 1px border, transparent where none is drawn, so an outlined button is exactly as tall as a filled one.

#### Difference from the MB Button specification

The MB spec documents five sizes at 36 / 40 / 44 / 48 / 60px. **None of those heights is reachable from the current token scales**, and three of its horizontal paddings (14, 18, 28px) are not spacing tokens either. Measured heights are therefore 38 / 42 / 46px, and `xl` and `2xl` are not implemented.

Exact parity needs one of:

- **A sizing foundation** (`sizing` — foundation #4, currently an empty placeholder) publishing button height tokens. This is the right fix.
- Spacing steps at **7px and 9px** vertical padding, which is what the current line-heights would require. These fall off the existing scale and should not be added for this.

Deviating was the deliberate choice: token fidelity over pixel fidelity.

> **Touch targets.** MB requires ≥44px for medical UI. Only `lg` (46px) clears it. Use `lg` for primary mobile actions.

### Accessibility

- Renders a native `<button>`, so Enter and Space activate it with no extra handlers. `type` defaults to `"button"` so it never submits a surrounding form by accident.
- **Focus** is `focus-visible` only. The ring colour follows `tone`, so a destructive action keeps its error colour when focused.
- **Disabled** sets the native attribute _and_ `aria-disabled`, leaving the tab order. Under `asChild` the element may be an anchor, which has no `disabled`, so only `aria-disabled` is set and activation is blocked in JS.
- **Loading** sets `aria-busy` and `aria-disabled` but **not** the native `disabled` — a loading button stays focusable, so focus is not thrown back to the document mid-interaction. An off-screen `loadingLabel` announces the state change while the visible label is unchanged.
- **Slots** are `aria-hidden`, so a decorative icon never doubles the accessible name.

### Usage

```tsx
<Button onClick={confirm}>Confirm booking</Button>
<Button variant="secondary" tone="error">Cancel booking</Button>
<Button variant="tertiary" size="sm">Skip</Button>
<Button loading loadingLabel="Submitting payment">Pay now</Button>
<Button fullWidth size="lg" endSlot={<ArrowRightIcon />}>Continue</Button>
<Button asChild><a href="/settings">Settings</a></Button>
```

**Don't:**

```tsx
// Two icons on one button — MB guidance forbids it.
<Button startSlot={<A />} endSlot={<B />}>Continue</Button>

// Navigation as a click handler: not a link to the browser or a screen reader.
<Button onClick={() => router.push('/settings')}>Settings</Button>

// Icon-only: no accessible name, and no tokens back it.
<Button startSlot={<CloseIcon />} />
```

#### Typing `variant` and `tone` together

The valid tones are a conditional on the variant, not a union of two prop shapes. Both forbid the invalid literal pair; the conditional additionally allows a **widened** variant, which is what wrappers, Storybook `args` and dynamic props produce:

```tsx
// All fine — `variant` is widened, so every tone is allowed.
function SubmitButton(props: ButtonProps) {
  return <Button {...props} type="submit" />;
}
function Tracked({ variant, tone, ...rest }: ButtonProps) {
  return <Button variant={variant} tone={tone} {...rest} />;
}

// Still a compile error — the pair Figma does not define.
<Button variant="primary" tone="color" />;
```

One case remains an error, correctly: naming `variant="primary"` **and** spreading a widened `tone`. As far as the type system can tell that is the invalid pair. Since `primary` is the default, drop the redundant prop:

```tsx
<Button {...args} />                    // ✅
<Button {...args} variant="primary" />  // ❌ spread's tone may be 'color'
```

At runtime, a widened caller that does reach `primary` + `color` is collapsed to `primary` + `default`. That is not a fudge: the pair is absent from Figma _because_ the two render identically.

### Deliberate omissions

| Not implemented          | Why                                                               |
| ------------------------ | ----------------------------------------------------------------- |
| Icon-only                | Use [IconButton](#iconbutton), which requires an accessible name  |
| Button group             | A composite of buttons with its own tokens — a separate component |
| Split / dropdown buttons | Absent from the Figma tokens and from the MB spec                 |
| `xl`, `2xl` sizes        | No tokens reach their heights — see above                         |

---

## IconButton

### Overview

A square action control whose content is an icon. Same `variant` and `tone` axes as Button, drawing on the same tokens, so the two line up in a toolbar and a destructive icon button matches a destructive button.

Use Button when there is a visible label. Use IconButton only where the meaning is unambiguous from the glyph and context — a close ×, a delete bin, an overflow menu.

### Why it is not a Button variant

MB's spec lists a fifth `utility` button for icon-only actions. Comparing it against the token export shows it is not a variant at all:

| MB `utility`     | Figma token                                      |
| ---------------- | ------------------------------------------------ |
| bg `#ffffff`     | `button-secondary-bg` — exact                    |
| icon `#47566a`   | `button-secondary-fg` — exact                    |
| border `#bfc8d2` | `button-secondary-border` `#a4b0c0` — one step   |
| hover `#f5f7f8`  | `button-secondary-bg-hover` `#ebeef1` — one step |

MB's utility button **is** `secondary` / `default` in a square box, which is why Figma publishes no `button-utility-*` family for it. So IconButton reuses the full matrix and defaults to `secondary` — MB's guidance is never to put an icon-only control in a primary pill.

The colour, focus and disabled rules live in `src/components/action-surface.ts`, shared by both components. Extracted when the second consumer arrived, not in anticipation of one.

### Props

Identical to Button except: no `startSlot` / `endSlot` / `fullWidth`, `children` is the icon, `variant` defaults to `'secondary'`, and:

| Prop         | Type     | Notes                               |
| ------------ | -------- | ----------------------------------- |
| `aria-label` | `string` | **Required by the type.** See below |

### Accessibility

**`aria-label` is required at the type level**, not merely documented. An icon-only control has no text, so without a name it is announced as "button" and nothing else — and that is the single most common icon-button defect. A lint rule or a doc note gets skipped; a type error does not.

The icon is wrapped in `aria-hidden` so it never competes with that label. Loading, disabled, focus and `asChild` behave exactly as on Button.

> **Touch targets.** Only `lg` (46px) clears MB's 44px medical-UI minimum. `sm` is 34px and `md` is 42px.

### Sizes

Square, derived from padding + icon + border with no fixed dimension:

| Size | Padding              | Icon | Radius | Measured | Same height as Button? |
| ---- | -------------------- | ---- | ------ | -------- | ---------------------- |
| `sm` | `p-semantic-md` 8px  | 16px | 6px    | 34px     | ✗ 4px shorter          |
| `md` | `p-semantic-lg` 12px | 16px | 8px    | 42px     | ✅                     |
| `lg` | `p-semantic-lg` 12px | 20px | 10px   | 46px     | ✅                     |

`md` and `lg` align with a Button of the same size. `sm` cannot: matching Button's 38px would need 10px of padding, and the spacing scale steps 8 → 12. The same Sizing foundation that would fix Button's heights fixes this too.

### Usage

```tsx
<IconButton aria-label="Close"><CloseIcon /></IconButton>
<IconButton aria-label="Delete booking" tone="error"><TrashIcon /></IconButton>
<IconButton aria-label="Settings" asChild><a href="/settings"><CogIcon /></a></IconButton>
```

**Don't:**

```tsx
// No accessible name — a compile error, and the reason this component exists.
<IconButton><CloseIcon /></IconButton>

// An icon-only primary pill: MB guidance forbids it.
<IconButton aria-label="Save" variant="primary"><SaveIcon /></IconButton>
```

---

## Input

### Overview

A single-line text field. Figma models nine `Type` values; this implements the four that need no unbuilt component — **Default**, **Icon leading**, **Leading text** and **Trailing button** — at both sizes, all four states and both destructive values: **56 of 126 variants**.

The `Type` axis is **derived from the slots supplied**, not an enum. Pass `leadingIcon`, `leadingText` or `trailingSlot` and the matching Figma type applies, so a caller never states the type _and_ the content that defines it.

### Anatomy

```
root                 flex-col · gap-semantic-xs 4
├─ field group       flex-col · gap-semantic-sm 6
│  ├─ label row      flex · gap-semantic-xxs 2   [label]
│  │  ├─ label
│  │  └─ *                                        [required]
│  └─ control        FIXED HEIGHT · items-center · inset ring · elevation-1
│     ├─ content     flex-1 · min-w-px · gap-semantic-md 8
│     │  ├─ leading icon 20px                     [leadingIcon]
│     │  ├─ leading text                          [leadingText]
│     │  └─ <input>
│     ├─ help icon 16px                           [helpIcon]
│     └─ trailing slot                            [trailingSlot]
└─ hint                                           [hint]
```

### Props

| Prop           | Type                             | Default | Notes                                               |
| -------------- | -------------------------------- | ------- | --------------------------------------------------- |
| `size`         | `'sm' \| 'md'`                   | `'md'`  | Figma publishes these two only                      |
| `invalid`      | `boolean`                        | `false` | Figma's `Destructive` axis                          |
| `disabled`     | `boolean`                        | `false` |                                                     |
| `label`        | `ReactNode`                      | —       | Real `<label htmlFor>`                              |
| `required`     | `boolean`                        | `false` | Renders `*`, sets `aria-required`                   |
| `hint`         | `ReactNode`                      | —       | Wired via `aria-describedby`                        |
| `helpIcon`     | `ReactNode`                      | —       | Trailing 16px affordance                            |
| `leadingIcon`  | `ReactNode`                      | —       | Leading 20px icon                                   |
| `leadingText`  | `ReactNode`                      | —       | Static prefix, e.g. `http://`                       |
| `trailingSlot` | `ReactNode`                      | —       | Control butted to the field edge                    |
| `classNames`   | `{ root, label, control, hint }` | —       | Per-slot overrides; `className` targets the control |

Plus every native `<input>` prop.

### Geometry — measured from Figma

|                | sm             | md                                |
| -------------- | -------------- | --------------------------------- |
| Control height | **44px**       | **56px**                          |
| Padding        | **14 / 10px**  | `spacing-lg` 12 / `spacing-xl` 16 |
| Radius         | `radius-md` 8  | `radius-xl` 12                    |
| Control gap    | `spacing-md` 8 | `spacing-lg` 12                   |
| Leading icon   | 20px           | 20px — **does not scale**         |
| Help icon      | 16px           | 16px                              |

Heights are **fixed, not derived**: Figma pins a fixed-height auto-layout frame and the padding provably does not sum to it (10+20+10=40, 16+20+16=52).

### Typography — five slots, all measured separately

| Slot            | sm                | md                |
| --------------- | ----------------- | ----------------- |
| Label           | 14/20/**500**     | 14/20/**500**     |
| Required `*`    | 14/20/500         | same              |
| **Placeholder** | **12**/20/**300** | **14**/20/**300** |
| **Value**       | **14**/20/**400** | **16**/24/**400** |
| Hint            | 12/20/400         | 14/20/400         |

**The placeholder is not merely a different colour** — it is one step smaller and lighter than the value at both sizes. A single `<input>` carries one font, so the placeholder half is applied through `::placeholder`, which accepts font properties.

### States

| State       | Stroke                     | Surface              | Value             |
| ----------- | -------------------------- | -------------------- | ----------------- |
| Placeholder | 1px `border-primary`       | `bg-primary`         | placeholder style |
| Filled      | 1px `border-primary`       | `bg-primary`         | value style       |
| **Focused** | **2px `border-brand-alt`** | `bg-primary`         | value style       |
| Disabled    | 1px `border-primary`       | `bg-disabled-subtle` | `text-tertiary`   |
| Destructive | **`error-600`**            | `bg-primary`         | per state         |

**Focus is the border itself** — Figma defines no focus ring for Input, unlike Button. There is also **no hover state**.

### Stroke and shadow

The 1px stroke is an **`inset-ring`, not a `border`**: Figma strokes are inside-aligned, so the frame stays 44/56 whether the stroke is 1px or the focused 2px, while a CSS border would add to the box.

The shadow is **`elevation-1` in every state** — the lowest level the Elevation foundation publishes. The 2px border is the whole focus treatment.

### Accessibility

- Real `<label htmlFor>`; clicking it focuses the field. Id generated with `useId` when absent.
- `hint` announced through `aria-describedby`; `required` sets `aria-required` and renders `*` as `aria-hidden` so it never leaks into the accessible name.
- `invalid` sets `aria-invalid`; the error is carried by the hint text, not colour alone.
- Icons are `aria-hidden` — they duplicate the label.

### Temporary exception

The error stroke uses the **`error-600` primitive**. No `border-*` semantic token resolves to `#d80008`, and `fg-error-primary` was deliberately _not_ substituted despite matching the value — that would claim a meaning the design system has not agreed. Recorded in `DOCUMENTED_EXCEPTIONS` alongside the four raw geometry values, with an assertion that the list cannot grow without a written reason.

### Deferred — 70 variants

| Type                                    | Blocked on                                       |
| --------------------------------------- | ------------------------------------------------ |
| `Leading dropdown`, `Trailing dropdown` | Select                                           |
| `Tags`                                  | Avatar (Tag now exists), plus an `x-close` glyph |
| `Payment input`                         | Card-brand assets                                |
| `Date Input`                            | Calendar icon asset; no new tokens               |

---

## Textarea

### Overview

A multiline text field. Figma models two types, `Default` and `Tags`; this implements **`Default`** at both sizes across all four states and both destructive values — **14 of 28 variants**. `Tags` is unbuilt but no longer blocked — see [Deferred](#deferred--14-variants).

Despite the family resemblance it shares little styling with [Input](#input) — see [Differences from Input](#differences-from-input).

### Anatomy

```
root                 flex-col · gap-semantic-sm 6 · isolate
├─ field group       flex-col · gap-semantic-sm 6 · z-2
│  ├─ label row      flex · items-center · gap-semantic-xxs 2   [label]
│  │  ├─ label
│  │  └─ *                                                       [required]
│  └─ control        FIXED HEIGHT · items-start · overflow-clip
│                    inset ring · box-shadow
│     └─ <textarea>  h-full · flex-1 · resize-none
└─ hint row          flex · items-center · gap-semantic-xs 4 · z-1   [hint]
   ├─ hint icon      16px sm / 20px md                               [hintIcon]
   └─ hint text
```

The root's `isolate` with `z-2` / `z-1` reproduces Figma's own stacking, so a focused 2px border is never overlapped by the hint row beneath it.

### Props

| Prop         | Type                             | Default | Notes                                         |
| ------------ | -------------------------------- | ------- | --------------------------------------------- |
| `size`       | `'sm' \| 'md'`                   | `'md'`  | Figma publishes these two only                |
| `invalid`    | `boolean`                        | `false` | Figma's `Destructive` axis                    |
| `disabled`   | `boolean`                        | `false` |                                               |
| `label`      | `ReactNode`                      | —       | Real `<label htmlFor>`                        |
| `required`   | `boolean`                        | `false` | Renders `*`, sets `aria-required`             |
| `hint`       | `ReactNode`                      | —       | Wired via `aria-describedby`                  |
| `hintIcon`   | `ReactNode`                      | —       | Leads the hint row; only rendered with `hint` |
| `classNames` | `{ root, label, control, hint }` | —       | `className` targets the control               |

Plus every native `<textarea>` prop.

### Geometry — measured from Figma

|                    | sm                                     | md                |
| ------------------ | -------------------------------------- | ----------------- |
| **Control height** | **120px**                              | **132px**         |
| Padding            | **`px-[14px]`** / `py` `spacing-lg` 12 | same              |
| Radius             | `radius-md` 8                          | **`radius-md` 8** |
| Control gap        | `spacing-md` 8                         | `spacing-md` 8    |
| Hint icon          | **16px**                               | **20px**          |
| Root / field gap   | `spacing-sm` 6                         | `spacing-sm` 6    |
| Hint row gap       | `spacing-xs` 4                         | `spacing-xs` 4    |

Height is **fixed, not min-height, hug or content-driven**: Figma pins the frame, sets the text child to `h-full`, and clips. The textarea fills it and scrolls internally.

### Typography

| Slot            | sm                | md                    |
| --------------- | ----------------- | --------------------- |
| Label           | 14/20/**500**     | 14/20/**500**         |
| Required `*`    | 14/20/500         | same                  |
| **Placeholder** | **12**/20/**300** | **14**/20/**300**     |
| **Value**       | **14**/20/**400** | **16**/**24**/**400** |
| Hint            | 12/20/400         | 14/20/400             |

The placeholder differs from entered text in size, weight and colour — and at `md` in line height too (20 vs 24). Applied through `::placeholder`.

### States

| State            | Stroke                     | Surface              | Value             |
| ---------------- | -------------------------- | -------------------- | ----------------- |
| Placeholder      | 1px `border-primary`       | `bg-primary`         | placeholder style |
| Default (filled) | 1px `border-primary`       | `bg-primary`         | value style       |
| **Focused**      | **2px `border-brand-alt`** | `bg-primary`         | value style       |
| Disabled         | 1px `border-primary`       | `bg-disabled-subtle` | `text-tertiary`   |
| Destructive      | **`error-600`**            | `bg-primary`         | per state         |

Figma names the filled state `Default`, where Input calls it `Filled`. **No hover state**, and focus is the border — there is no ring.

### Differences from Input

|                   | Input                          | Textarea                        |
| ----------------- | ------------------------------ | ------------------------------- |
| `md` radius       | `radius-xl` 12                 | **`radius-md` 8**               |
| Alignment         | `items-center`                 | **`items-start`**               |
| Root gap          | `spacing-xs` 4                 | **`spacing-sm` 6**              |
| Label row         | `items-start`                  | **`items-center`**              |
| Help icon         | inside the control, 16px fixed | **leads the hint row, 16/20px** |
| Height            | 44 / 56                        | **120 / 132**                   |
| Filled state name | `Filled`                       | **`Default`**                   |

Only the token _vocabulary_ is shared. `Textarea.variants.ts` stands alone rather than importing Input's definitions.

### Behaviour

`resize-none`, because Figma shows no resize handle. The control clips (matching the Figma frame) while the textarea inside scrolls — that is what makes a fixed height usable. Newlines, wrapping and top alignment all follow Figma.

### Accessibility

Identical contract to Input: real `<label htmlFor>` with a `useId` fallback, `aria-describedby` → hint, `aria-required` with an `aria-hidden` `*`, `aria-invalid` when destructive, and an `aria-hidden` hint icon.

### Deferred — 14 variants

`Type=Tags`, still unbuilt but **no longer blocked**: **Tag** now exists, and unlike Input's Tags, Textarea's Tag embeds **no Avatar**. It needs only a close glyph, which Tag takes as a `closeIcon` prop. Note the Figma desync recorded under Tag — Textarea's Tags still instances the older `_Tag close X`, so it will not match its current Figma rendering until the design file is re-synced.

---

## OtpInput

### Overview

A one-time-code field. Figma publishes **15 variants** — `Digits` 4/5/6 × `State` Placeholder/Filled/Focused/Disabled/Error — and **all 15 are implemented**. Nothing is deferred.

### The finding that shapes everything

Three of Figma's five States are **not field-level styles**. They are _compositions of per-cell state_:

| Figma `State` | What the cells actually are                                      |
| ------------- | ---------------------------------------------------------------- |
| Placeholder   | every cell empty                                                 |
| Filled        | every cell filled                                                |
| **Focused**   | cells `0…n-3` filled · cell **`n-2`** focused · cell `n-1` empty |
| Disabled      | field-level                                                      |
| Error         | field-level                                                      |

Verified at all three lengths. So `Placeholder`, `Filled` and `Focused` are **runtime states, never props**, and a cell derives its appearance in this order:

```
disabled → invalid → focused → filled → placeholder
```

Only Disabled and Error reach the whole field, as `disabled` and `invalid`.

### Anatomy

```
root              hug · flex-col · gap-semantic-xs 4          inline-flex
├─ field group    w-full · flex-col · gap-semantic-md 8
│  ├─ label                                                   [label]
│  └─ cell row    role=group · gap-semantic-md 8 · items-start
│     └─ <input> × n     48×48 · the cell IS the input
└─ hint row       gap-semantic-xs 4 · items-center             [hint]
   ├─ hint icon   16px
   └─ hint text
```

The cell **is** the `<input>`, not a wrapper around one. Figma's cell is a 48×48 frame holding one centred text node, which an input renders in a single element. Collapsing them is what makes `:focus` _be_ the state rather than something derived — no caret to fake, no active index to track.

### Props

| Prop                     | Type                                 | Default | Notes                                             |
| ------------------------ | ------------------------------------ | ------- | ------------------------------------------------- |
| `length`                 | `4 \| 5 \| 6`                        | `4`     | Figma's `Digits`; 4 is the file's default variant |
| `value` / `defaultValue` | `string`                             | —       | Controlled and uncontrolled                       |
| `onValueChange`          | `(value: string) => void`            | —       |                                                   |
| `onComplete`             | `(value: string) => void`            | —       | Fires when every cell is filled                   |
| `invalid`                | `boolean`                            | `false` | Figma's `State=Error`                             |
| `disabled`               | `boolean`                            | `false` |                                                   |
| `label`                  | `ReactNode`                          | —       | `<label>` pointing at the first cell              |
| `hint`                   | `ReactNode`                          | —       | Wired to the group via `aria-describedby`         |
| `hintIcon`               | `ReactNode`                          | —       | 16px, only rendered with `hint`                   |
| `name`                   | `string`                             | —       | Cells submit as `name-0 … name-n`                 |
| `autoFocus`              | `boolean`                            | `false` | Focuses the first cell on mount                   |
| `classNames`             | `{ root, label, cells, cell, hint }` | —       | `className` targets the cell row                  |

**No `size`** and **no `required`**: Figma publishes neither.

### Geometry — measured from Figma

|               | Value            | Token                                |
| ------------- | ---------------- | ------------------------------------ |
| Cell          | **48 × 48**      | `size-semantic-6xl`                  |
| Cell padding  | 2px / 8px        | `py-semantic-xxs` / `px-semantic-md` |
| Cell radius   | 8                | `rounded-md`                         |
| Cell gap      | 8                | `gap-semantic-md`                    |
| Label → cells | 8                | `gap-semantic-md`                    |
| Root gap      | 4                | `gap-semantic-xs`                    |
| Hint row gap  | 4                | `gap-semantic-xs`                    |
| Hint icon     | 16               | `size-semantic-xl`                   |
| Field width   | `n×48 + (n−1)×8` | 216 / 272 / 328                      |

48px is **exactly `--spacing-semantic-6xl`**, so unlike Input's and Textarea's heights it needs no arbitrary value. The root **hugs** (`inline-flex`), where Input and Textarea fill the width.

### Typography

| Slot            | Figma style                 | Value                                                    |
| --------------- | --------------------------- | -------------------------------------------------------- |
| Label           | `Mobile/Body-md-Medium`     | 14 / 20 / 500 · `text-primary`                           |
| **Digit**       | `Mobile/Heading-md-Regular` | **20 / 32 / 400** · centred · `text-primary`             |
| Digit, disabled | same                        | **`text-quaternary`**                                    |
| Hint            | `Mobile/Body-sm-Regular`    | 12 / 20 / 400 · `text-quaternary` → `text-error-primary` |

`--text-mobile-heading-md` is exactly 20/32, so the digit ramp needed no new token. Note the disabled digit is **`text-quaternary`**, not the `text-tertiary` Input and Textarea use — their Figma binds a different token.

There is **no placeholder character**: Figma's cell _can_ render a grey digit, and no OTP variant does. Empty means empty.

### States

| Cell state  | Surface              | Stroke                                | Digit             |
| ----------- | -------------------- | ------------------------------------- | ----------------- |
| Placeholder | `bg-primary`         | 1px `border-primary`                  | —                 |
| Filled      | `bg-primary`         | 1px `border-brand-alt`                | `text-primary`    |
| **Focused** | `bg-primary`         | **2px** `border-brand-alt` **+ ring** | `text-primary`    |
| Disabled    | `bg-disabled-subtle` | 1px `border-primary`                  | `text-quaternary` |
| Error       | `bg-primary`         | 1px **`error-600`**                   | `text-primary`    |

The brand stroke means **has a value**, not _is focused_ — Figma's `Filled` variant has no focused cell, which is what proves it survives blur. Disabled restates the resting stroke so it wins over both `filled` and `invalid`, matching Figma's Disabled cell, which shows digits _and_ a grey stroke. No hover state and no success state.

### Border and shadow

The stroke is an **`inset-ring`**, not a `border`: Figma strokes are inside-aligned, so the cell stays 48×48 at 1px _and_ the focused 2px, while a CSS border would grow the box and break the 8px rhythm.

The resting shadow is **`elevation-1`**. The focused one has to be written out, but it reads the same token — `var(--shadow-elevation-1)` expands to both layers in front of the two rings — for two measured reasons:

1. Tailwind's box-shadow slot order is `inset-shadow, inset-ring, ring-offset, ring, shadow`, which puts the elevation layers **behind** both rings where Figma paints them **in front**. The white offset ring is opaque, so that order hides them entirely.
2. A `shadow-<color>` utility cannot sit beside an arbitrary list: it sets `--tw-shadow-color`, which Tailwind substitutes into _every_ layer, collapsing the rings into one colour.

Every value in that list reads a token. The entry is in `DOCUMENTED_EXCEPTIONS` because Tailwind cannot express the layer order, not because a token is missing.

### Behaviour — none of it drawn in Figma

Auto-advance, Backspace to the previous cell, `Delete`, arrow keys, `Home`/`End`, paste distribution from the cell pasted into, `inputMode="numeric"` and `autoComplete="one-time-code"`. Typing, pasting and SMS autofill all run through one `distribute` path, so a code arriving in a single cell spreads across the field.

Cells after what was written keep their values, so typing into the middle of a code replaces one digit rather than truncating the rest. The field never grows past `length`: focus clamps at the last cell and its contents are selected, so a further keystroke overwrites it.

### Accessibility

- The cell row is a `role="group"` named by the label and described by the hint, so AT announces one field rather than _n_ unrelated boxes.
- The `<label>` points at the first cell; clicking it starts entry there.
- Each cell carries `aria-label="Digit N of M"` — positional context a shared label cannot give.
- `invalid` sets `aria-invalid` on every cell; the reason is carried by the hint text, not colour alone.
- Focus order is DOM order, and arrow keys move within the group without leaving it.
- `autoFocus` is applied in an effect rather than through the JSX attribute, so it can be ignored while disabled.

### Differences from Input and Textarea

|                 | Input / Textarea         | OtpInput                                  |
| --------------- | ------------------------ | ----------------------------------------- |
| Width           | `w-full`                 | **hugs** (`inline-flex`)                  |
| Control         | wrapper around the field | **the input _is_ the cell**               |
| State axis      | field-level              | **per-cell, derived**                     |
| Focus           | border only, no ring     | **border + a Figma-specified ring**       |
| Focus scope     | `focus-within`           | **`focus`** — the cell takes focus itself |
| Disabled digit  | `text-tertiary`          | **`text-quaternary`**                     |
| Size axis       | `sm` / `md`              | **none**                                  |
| Required marker | yes                      | **none in Figma**                         |

Only the token vocabulary and `ariaAttr` are shared. `OtpInput.variants.ts` stands alone.

---

## InputDropdown

### Overview

A select field with a dropdown menu. Figma publishes **20 variants** — `device` (desktop, mobile) × `type` (Default, multi select) × `state` (Placeholder, Default, Focused, Disabled, Open). This implements **`type=Default`: 10 of 20**.

`type=multi select` is deferred — see [Deferred](#deferred--10-variants).

### `device` is not a size scale

Desktop and mobile are two independent sets of measurements, not two steps on one ramp. They share the radius, the shadow and the label ramp, and disagree on everything else:

|                                    | desktop             | mobile              |
| ---------------------------------- | ------------------- | ------------------- |
| Field padding                      | `spacing-xl` **16** | `spacing-lg` **12** |
| Field height                       | **56** (hug)        | **44** (hug)        |
| Content gap                        | `spacing-md` **8**  | `spacing-xs` **4**  |
| Root gap, closed → open            | **8 → 12**          | **4 → 8**           |
| Value                              | 16/24/500           | 14/20/500           |
| Placeholder                        | 16/24/400           | 14/20/400           |
| Hint                               | 14/20/400           | 12/20/400           |
| Menu gap · max-height              | 6 · **320**         | 8 · **256**         |
| Item padding · height              | 16 · 56             | 12 · 44             |
| Item radius, resting → highlighted | **6 → 12**          | **8 → 8**           |
| Item label on hover                | **Medium 500**      | **Regular 400**     |
| Item supporting                    | 14/20               | **12/18**           |
| Tick                               | **20**              | **16**              |

### Anatomy

```
root                flex-col · gap by device+open · w-full
├─ field group      flex-col · gap-semantic-sm 6 · w-full
│  ├─ label row     items-center · gap-semantic-xxs 2        [label]
│  │  ├─ label
│  │  └─ *                                                    [required]
│  └─ field         role=combobox · items-center · hug height
│     ├─ content    flex-1 · min-w-px
│     │  ├─ value / placeholder
│     │  └─ supporting text                                   [selected only]
│     └─ chevron    16px at both devices
├─ hint                                                       [hint, closed only]
└─ menu             role=listbox · sibling, not a portal      [open only]
   └─ menu item × n role=option
      ├─ content    flex-1
      │  └─ text row
      │     ├─ label
      │     └─ supporting text
      └─ tick                                                 [selected only]
```

### The field height is hug, not fixed

Verified independently rather than carried over from Input or Textarea: **no Figma variant pins a height**, and every measured height is padding + content exactly — 16+24+16=56 at desktop, 12+20+12=44 at mobile. Both are content-driven.

### Props

| Prop                     | Type                                                           | Default         | Notes                                          |
| ------------------------ | -------------------------------------------------------------- | --------------- | ---------------------------------------------- |
| `device`                 | `'desktop' \| 'mobile'`                                        | `'desktop'`     | Figma's own axis                               |
| `options`                | `InputDropdownOption[]`                                        | —               | `{ value, label, supportingText?, disabled? }` |
| `value` / `defaultValue` | `string \| null`                                               | `null`          | Controlled and uncontrolled                    |
| `onValueChange`          | `(value: string) => void`                                      | —               |                                                |
| `open` / `defaultOpen`   | `boolean`                                                      | `false`         | Figma's `State=Open`                           |
| `onOpenChange`           | `(open: boolean) => void`                                      | —               |                                                |
| `placeholder`            | `string`                                                       | `'Select Here'` | Figma's `inputLabelText`                       |
| `label`                  | `ReactNode`                                                    | —               | Figma's `heading` / `headingText`              |
| `required`               | `boolean`                                                      | `false`         | Renders `*`, sets `aria-required`              |
| `hint`                   | `ReactNode`                                                    | —               | Figma's `hintText`. Hidden while open          |
| `disabled`               | `boolean`                                                      | `false`         | Figma's `State=Disabled`                       |
| `chevron` / `tick`       | `ReactNode`                                                    | —               | Figma uses `arrow-down-01` / `tick-02`         |
| `classNames`             | `{ root, label, field, value, hint, menu, menuItem, chevron }` | —               | `className` targets the field                  |

**No `size`, no `error`, no `invalid`.** Figma publishes none of them — this is the only field component in the set **without an error state**.

### States

| State       | Stroke                     | Surface              | Field text                                         |
| ----------- | -------------------------- | -------------------- | -------------------------------------------------- |
| Placeholder | 1px `border-primary`       | `bg-primary`         | placeholder, `text-quaternary`                     |
| Default     | 1px `border-primary`       | `bg-primary`         | value `text-primary` + supporting `text-secondary` |
| **Focused** | **2px `border-brand-alt`** | `bg-primary`         | value                                              |
| Disabled    | 1px `border-primary`       | `bg-disabled-subtle` | placeholder, `text-quaternary`                     |
| **Open**    | **2px `border-brand-alt`** | `bg-primary`         | **placeholder, not the value**                     |

**Focused and Open are measurably identical in the field** — same 2px `brand/600`, and `elevation-1` byte-identical across all five states. Figma defines **no ring, no offset and no inset ring beyond the stroke**; the border is the entire focus treatment.

Two Figma behaviours reproduced rather than improved on: opening **replaces the value with the placeholder**, and opening **hides the hint**.

**No hover state on the field.**

### Menu

A **sibling in the layout**, as Figma draws it — not a portal — so opening grows the component instead of floating over the page.

`max-height` is a maximum, not a fixed height. Desktop content lands at exactly 320 (`8 + 5×56 + 4×6 + 8`), which is why Figma left desktop `overflow-clip` and gave only mobile `overflow-y-auto`. **Both scroll here**: a menu that silently clips its sixth option is a defect, not a measurement.

Four item treatments, all measured:

| Item state      | Surface              | Radius (desktop) | Weight (desktop / mobile) |
| --------------- | -------------------- | ---------------- | ------------------------- |
| Default         | none                 | 6                | 400 / 400                 |
| **Highlighted** | `bg-active`          | **12**           | **500 / 400**             |
| **Selected**    | **`brand-25`**       | 12               | 500 / 500                 |
| Disabled        | `bg-disabled-subtle` | 12               | 500 / 500                 |

`active` covers pointer hover _and_ keyboard highlight. Figma publishes `state=hover` but never places it in a menu and defines no keyboard-active treatment, so one visual state serves both — which is also the only way a single row can be highlighted at a time.

### Border and shadow

The stroke is an **`inset-ring`** on both the field and the menu. Verified for this component: the field's stroke goes 1px → 2px between Default and Focused while Content stays at `x=16` and the frame stays 56 tall, and the menu's items measure 304 inside a 320 menu with `p-8`, leaving no room for a border box.

The menu carries `shadow/elevation-4`, two layers whose colours are **raw hex bound to no variable** — so unlike the OTP shadows, not even the colour can be tokenised. It is in `DOCUMENTED_EXCEPTIONS`, with no `shadow-<color>` utility beside it (that would set `--tw-shadow-color` and repaint both layers).

### Behaviour — none of it drawn in Figma

Open/close, click-outside dismissal, `ArrowDown`/`ArrowUp` (open and move), `Home`/`End`, `Enter`/`Space` (select), `Escape` (close and return focus), `Tab` (close and move on), and a typeahead over option labels with a 500ms buffer. Disabled options are skipped by every keyboard path and cannot be hovered.

### Accessibility

`role="combobox"` with `aria-expanded`, `aria-haspopup`, `aria-controls` and `aria-activedescendant`; the menu is a `role="listbox"` of `role="option"` rows with `aria-selected`. Focus **stays on the trigger** while the menu is open and the active row is reported through `aria-activedescendant`, so the reading order never jumps. Label via `aria-labelledby`, hint via `aria-describedby`, `*` is `aria-hidden`, and both glyphs are `aria-hidden` since they duplicate `aria-expanded` and `aria-selected`.

### Differences from Input, Textarea and OtpInput

|                 | Input / Textarea / OtpInput          | InputDropdown                            |
| --------------- | ------------------------------------ | ---------------------------------------- |
| Error state     | yes                                  | **none published**                       |
| Height          | pinned (44/56/120/132/48)            | **hug**                                  |
| Hint colour     | `text-quaternary`                    | **`text-secondary`**                     |
| Required colour | `error-secondary` (from `error/600`) | `error-secondary` (from **`error/700`**) |
| Size axis       | `sm`/`md` or none                    | **`device`**                             |
| Focus           | border (Input) / border+ring (OTP)   | **border only**                          |

Only the label wrapper, the label, the required indicator, the `inset-ring` technique, `elevation-1`, `spacing-xxs` and `spacing-sm` are shared. `InputDropdown.variants.ts` stands alone.

### `type="multiSelect"` — the other 10 variants

Implemented. `device`(2) × `state`(5) again, with the value text replaced by a **Tag** per selection and the trailing tick replaced by a leading **Checkbox** on each menu row. Both are consumed exactly as built — no wrappers.

|                            | desktop                            | mobile                             |
| -------------------------- | ---------------------------------- | ---------------------------------- |
| Tag                        | **`lg`** (28 tall)                 | **`md`** (24 tall)                 |
| Tag row gap                | 12                                 | 8                                  |
| Checkbox                   | **`md`** (20)                      | **`sm`** (16)                      |
| Row content gap            | 12                                 | 8                                  |
| Field padding, with Tags   | `px-semantic-xl` / **`py-[14px]`** | `px-semantic-lg` / **`py-[10px]`** |
| Field padding, placeholder | `px`/`py-semantic-xl`              | `px`/`py-semantic-lg`              |

**The field padding tracks what the field holds, not the device alone.** Figma hand-tunes `py` so the field lands on 56 / 44 whichever it shows — a 24/20-tall text line takes 16/12, a 28/24-tall Tag row takes 14/10. `py-[14px]` is the one new class, folded into the existing _"Figma hardcodes … padding"_ cause; the exception list was 9 causes / 29 classes at that point.

#### Parallel props, never a union

`type` decides which pair applies. A discriminated union on `value` cannot be spread into, and `{...props}` is how wrappers, Storybook args and HOCs pass things through — the same reason Tag's `count`/`onRemove` union was reverted.

| `type="default"`                           | `type="multiSelect"`                          |
| ------------------------------------------ | --------------------------------------------- |
| `value` / `defaultValue` / `onValueChange` | `values` / `defaultValues` / `onValuesChange` |

Internally both normalise to one **`selectedValues: string[]`** — nought or one for the Default type, n for multi-select. Tag rendering, Checkbox state, row highlighting and Tag removal all read it, so the two public shapes cannot disagree about what is selected.

#### The trigger is a `<div>` in multi-select

Figma authors the field as an interactive trigger _and_ puts a Tag close button inside it, which would render as:

```html
<button>
  <!-- the trigger -->
  <button>×</button><!-- the Tag close -->
</button>
```

Nested buttons are invalid HTML; browsers recover by breaking the nesting, so the close silently stops working. So `multiSelect` renders `<div role="combobox" tabIndex={0}>` — the ARIA pattern for this control anyway — while `default` keeps its `<button>`. Keyboard behaviour is unchanged because it already ran through the shared `onKeyDown`. **This is a correction to an invalid published structure, not a visual deviation.**

A related consequence: a Tag close click would bubble to the trigger and toggle the menu. The guard sits on the trigger, which is already interactive, rather than on the Tag row — a click handler on a plain `<span>` is what `jsx-a11y` forbids. Clicking the Tag _body_ still opens the menu.

#### Behaviour that is ours

Picking a row **toggles and leaves the menu open**. Figma draws no close-on-pick, and a multi-select that shut after every choice could not be used for its purpose.

#### Figma inconsistencies

1. **Tags disappear in `Disabled` and `Open`** — both fall back to the placeholder. We keep them: the selected values are the field's primary content. This also makes the field height uniform at 56 / 44 across all five states, which the published file is not.
2. **The mobile `Open` field is 40 tall instead of 44** — Figma applied the _tags_ padding (10) to _text_ content (20). The Default type's mobile Open is a consistent 44, so it is multi-select-specific. Keeping the Tags resolves it: 10 + 24 + 10 = 44.
3. **Row highlight and Checkbox state are published independently** — `selected=true` highlights the row without ticking the box, while the `Open` instances tick the box with `selected=false`. We drive both from one `selected`.
4. **Hover and selected render the same colour through different bindings** — `gray/50` primitive for hover, `bg-active` semantic for selected, both `#ebeef1`.
5. **The trigger is authored as a button containing buttons** — see above.

#### Verification

**51 browser assertions, zero mismatches**, transitions disabled: field heights 56 / 44 with and without Tags, all four padding values, Tag heights 28 / 24, Tag row gap 12 / 8 measured between Tags, Checkbox 20 at radius 4 centred 2px on the row, row content gap 12, menu max-height 320, item gap 6, field→menu gap 12, `elevation-4`, and selection painting brand only on the ticked row. Negative-controlled: a wrong padding, a wrong menu height and a wrong row gap are each detected.

Mobile menu geometry is covered by the Default type's existing browser harness (the container is shared) plus jsdom assertions for the multi-select-specific Checkbox size and row gap.

**Foundation audit:** 18 semantic tokens, 1 elevation token, 2 radius and 3 typography primitives, and 4 arbitrary values — `gap-[3px]`, `pl-[10px]`, `size-[10px]` inherited from Tag, plus our `py-[14px]`. All four are documented; none is new beyond `py-[14px]`.

---

## Tag

### Overview

A compact label, optionally removable, countable or selectable. Figma publishes **72 variants** — `Size`(3) × `Icon`(4) × `Action`(3) × `Checkbox`(2) — and **all 72 are implemented**.

### Tag has no state axis

Figma publishes **no** hover, focus, pressed, disabled, selected or error state, and **no** filled or tonal type. Every one of the 72 is white with a 1px grey stroke. `disabled` and `selected` reach only the nested checkbox and the close button — never the tag surface.

The only interactive states in the family belong to `_Tag checkbox`, which has 24 of its own.

### Anatomy

```
root                 hug × hug · bg-primary · 1px inset ring · radius-sm 6
                     gap 3 ← only when a close button is present
├─ Content           gap 4 / 5 / 6 by size
│  ├─ checkbox       14 / 16 / 18 · radius-xs 4          [selectable]
│  ├─ icon           dot 8 (6px fill) | flag 16 | avatar 16 round   [iconVariant]
│  ├─ label
│  └─ count          bg-tertiary · radius 3px            [count]
└─ close button      p-2 → 14×14 · 10px glyph            [onRemove]
```

**The count sits inside Content; the close does not.** The close is a root sibling, and it is the only reason the root has a gap.

### The size scale is not monotonic

Heights are **26 / 24 / 28** — `md` is the _shortest_ tag. Reproduced as measured.

|                           | sm          | md            | lg          |
| ------------------------- | ----------- | ------------- | ----------- |
| Height                    | **26**      | **24**        | **28**      |
| `py`                      | 3           | 2             | 4           |
| Content gap               | 4           | **5**         | 6           |
| Checkbox                  | 14          | 16            | 18          |
| Tick                      | 10          | 12            | 14          |
| Label                     | 12/20/500   | 14/20/500     | 14/20/500   |
| Count `px` · ramp         | 4 · 12/18   | **5** · 12/18 | 6 · 14/20   |
| Dot · media · close glyph | 8 · 16 · 10 | 8 · 16 · 10   | 8 · 16 · 10 |

**No icon scales with size.** Figma holds 8 and 16 across all three.

### Padding decomposes into two rules

Figma's 72 variants carry 23 distinct `pl`/`pr` pairs, which look bespoke until decomposed. They are not:

| `pl` — size × **leading element** | sm  | md  | lg  |
| --------------------------------- | --- | --- | --- |
| nothing                           | 8   | 9   | 10  |
| dot                               | 6   | 7   | 9   |
| 16px media                        | 4   | 5   | 7   |
| checkbox                          | 5   | 4   | 5   |

| `pr` — size × **action** | sm  | md    | lg  |
| ------------------------ | --- | ----- | --- |
| Text only                | 8   | 9     | 10  |
| X close                  | 4   | 4     | 4   |
| Count                    | 4   | **3** | 4   |

`pl` shrinks as the leading element grows, keeping the optical inset even; it never depends on the action. `pr` never depends on the icon. That is **21 measured values, not 72 pairs** — cross-checked against 17 direct Dev Mode measurements. Seven land on no step of any scale and are in `DOCUMENTED_EXCEPTIONS`.

### Props

| Prop                                           | Type                                                     | Default           | Notes                                            |
| ---------------------------------------------- | -------------------------------------------------------- | ----------------- | ------------------------------------------------ |
| `size`                                         | `'sm' \| 'md' \| 'lg'`                                   | `'sm'`            | Figma's `Size`                                   |
| `label`                                        | `ReactNode`                                              | —                 | Required                                         |
| `iconVariant`                                  | `'dot' \| 'flag' \| 'avatar'`                            | —                 | Figma's `Icon`, minus `False`                    |
| `icon`                                         | `ReactNode`                                              | —                 | Ignored for `dot` — Figma's dot has no swap slot |
| `count`                                        | `ReactNode`                                              | —                 | Figma's `Action=Count`                           |
| `onRemove`                                     | `() => void`                                             | —                 | Figma's `Action=X close`. **Wins over `count`**  |
| `closeIcon` · `removeLabel`                    | `ReactNode` · `string`                                   | — · `'Remove'`    |                                                  |
| `selectable` · `selected` · `onSelectedChange` |                                                          | `false` · `false` | Figma's `Checkbox`                               |
| `disabled`                                     | `boolean`                                                | `false`           | Reaches the checkbox and close only              |
| `tickIcon`                                     | `ReactNode`                                              | —                 |                                                  |
| `classNames`                                   | `{ root, content, label, icon, count, close, checkbox }` | —                 |                                                  |

`count` and `onRemove` are one Figma axis, so only one renders. That is a documented precedence rather than a type-level union: a union on those two makes the component impossible to spread props into, and `{...props}` is how wrappers and Storybook pass args.

**`Country` and `Avatar` collapse into two shapes, not two sizes** — they are geometrically identical at every size (all 24 root widths match) and differ only in radius.

### Border and shadow

The stroke is an **`inset-ring`**, and here that is load-bearing rather than stylistic: the box is content-sized, so a CSS border would add 2px to a hug height Figma measures at exactly 26/24/28.

**No shadow.** No effect is bound to any of the 72, so Tag consumes no elevation.

### The checkbox

`TagCheckbox` is a separate file and **not exported** — private to Tag. Measured from `_Tag checkbox` (24 variants):

| State    | Unchecked                      | Checked                            |
| -------- | ------------------------------ | ---------------------------------- |
| Default  | `bg-primary`, `border-primary` | `bg-brand-solid`, tick `fg-white`  |
| Hover    | **identical to Default**       | `bg-brand-solid-hover` (brand-700) |
| Focused  | + the shared focus ring        | + the shared focus ring            |
| Disabled | `bg-disabled-subtle`           | same, tick `fg-disabled-subtle`    |

Unchecked hover is byte-identical to unchecked Default in all six Figma variants, so **there is no hover rule for it**. Figma's focus ring is `0 0 0 2px bg-primary, 0 0 0 4px focus-ring` — exactly what the library's `focusRing` emits, so it is reused rather than restated.

**Every `Checkbox=True` Tag variant draws an unchecked, default box.** Checked, hover, focused and disabled are reachable through this API and through no Figma Tag variant.

### What Figma draws and what we add

**Drawn:** the × glyph, the count pill, the checkbox box (unchecked only), the three leading shapes.

**Not drawn — ours, and stated as such:** the close is a real `<button>` with the shared focus ring (Figma's is a plain frame), the checkbox is a `role="checkbox"` button, and the checkbox's own states are wired up. Figma's close hit area is **14×14**, well under any touch-target guidance; reproduced as drawn, so give it room in dense layouts.

**Deliberately not reproduced** — authoring artifacts, consistent with how Input's `w-[300px]` and Textarea's `w-[172px]` were handled:

- The count's sm/md text pins (`w-8`/`w-9`, and `h-16` against an 18px line height, which clips its own text). Reproducing them would break any two-digit count; `lg` has no pin.
- `_Tag close X` — a published 6-variant close with a 14/16/20 ramp, a 3px radius and a `gray-50` hover. **The Tag set does not use it.**

### Consumers — verified by instance node id

| Consumer                     | Variant                  |
| ---------------------------- | ------------------------ |
| Input `Type=Tags`            | `md` / avatar / X close  |
| Textarea `Type=Tags`         | `md` / no icon / X close |
| InputDropdown `multi select` | `lg` / no icon / X close |

**3 of 72 variants are instanced today.** `Checkbox=True` (36), `Action=Count` (24), `Icon=Dot`/`Country` (36) and all of `sm` have no consumer — implemented anyway, because the matrix is the contract.

**Known Figma desync:** Input `Tags` and Textarea `Tags` still render the older `_Tag close X` (a 12px `_x-close`, a 16px wrapper, a 4px root gap and a 3px radius). InputDropdown's multi-select renders the current close. Our Tag follows the published Tag set, so those two will not match their current Figma rendering until the design file is re-synced.

### Reuse

Nothing beyond the framework and `focusRing`. `action-surface` does not apply — Tag has no variant, tone, hover, focus, disabled or shadow. The field components' surface does not apply either: Tag's stroke technique matches but nothing else does, and Tag has no focus state to preserve the box for.

## Toggle

### Overview

A switch — an immediate on/off control. Figma publishes **64 variants** — `Type`(2) × `Pressed`(2) × `Size`(2) × `Text`(2) × `State`(4) — the full cross product with no gaps, and **all 64 are implemented**.

Figma's names are normalised: `Type` is `variant`, `Pressed` is `checked`. A switch is checked, not held down, and `aria-checked` is the attribute that carries it.

### The `State` axis is not part of the API

Hover and focus belong to CSS, and `Disabled` arrives as `disabled`. So **8 prop combinations × 4 CSS states** reproduce the published 64. There is no `hover` or `focus` prop, in keeping with every other component.

### Two measured behaviours that look like bugs

**Hover does nothing when off.** Figma's `State=Hover` is byte-identical to `State=Default` for all 16 `Pressed=False` variants — the only difference in the file is a cursor hint. Only the on state darkens, brand/600 → brand/700. There is deliberately no hover rule for the off state.

**`disabled` ignores `checked` for colour.** Every `Pressed=True, State=Disabled` variant is byte-identical to its `Pressed=False` counterpart, in both types. A disabled toggle paints the off colours whichever way it is set; only the thumb's _position_ still follows `checked`.

### Anatomy

```
root                 flex row · w-full · items-start ← TOP, not centre
                     gap 8 / 12 by size                        [label]
├─ track (button)    box-content · rounded-full · overflow-clip
│                    role="switch" · aria-checked
│  └─ thumb          rounded-full · elevation-1 · translate-x-full when on
└─ text              flex-1 · min-w-none · gap 0 / 2 by size    [label]
   ├─ label          14/20 w500 · text-primary
   └─ supportingText 16/24 w400 · text-secondary       [supportingText]
```

Figma's `_Toggle base` is **flattened**. It re-declares the parent's whole axis set minus `Text`, so every state is authored twice in the file; it is an authoring artifact and becomes the track and thumb slots here, not a private component.

### The geometry is two rules, not eight boxes

1. **Thumb travel always equals the thumb's own diameter** — 16 at `sm`, 20 at `md`, in both variants. So the offset is `translate-x-full` and never a length.
2. **The track's content box is always two thumbs wide and one thumb tall.** The variant axis is then padding alone.

| variant   | size | content | padding | total       | Figma     |
| --------- | ---- | ------- | ------- | ----------- | --------- |
| `default` | `sm` | 32 × 16 | 2       | **36 × 20** | 36 × 20 ✓ |
| `default` | `md` | 40 × 20 | 2       | **44 × 24** | 44 × 24 ✓ |
| `slim`    | `sm` | 32 × 16 | 0       | **32 × 16** | 32 × 16 ✓ |
| `slim`    | `md` | 40 × 20 | 0       | **40 × 20** | 40 × 20 ✓ |

`box-content` is what makes this work: padding is added outside the content box. 36 and 44 appear on no spacing scale, so pinning the width directly would have cost two documented exceptions. **This costs none — Toggle adds zero documented exceptions.**

### `slim` is a different anatomy, not a smaller `default`

|               | `default` | `slim`                                 |
| ------------- | --------- | -------------------------------------- |
| Track padding | 2         | **0** — thumb is flush and full-height |
| Track stroke  | none      | **1px**, off only                      |
| Thumb stroke  | none      | **1px**, colour tracks state           |

The strokes are `inset-ring`, not `border`. Under `box-content` a CSS border is laid out outside the content box just as padding is, so 1px of border would make `slim` 34×18 instead of 32×16. Here the technique is _required_, not conventional.

### Colour

| Appearance        | Track                  | Thumb                       | Slim track ring    | Slim thumb ring              |
| ----------------- | ---------------------- | --------------------------- | ------------------ | ---------------------------- |
| off               | `bg-tertiary`          | `bg-primary`                | `border-secondary` | `toggle-border`              |
| off + hover       | _unchanged_            | _unchanged_                 | _unchanged_        | _unchanged_                  |
| on                | `bg-brand-solid`       | `bg-primary`                | _transparent_      | `toggle-slim-border-pressed` |
| on + hover        | `bg-brand-solid-hover` | `bg-primary`                | _transparent_      | `…-pressed-hover`            |
| disabled (either) | `bg-disabled`          | `toggle-button-fg-disabled` | `border-secondary` | `toggle-border`              |

Figma publishes a `Components/Toggles ✅` group of exactly **four** semantic tokens, and all four are consumed here — `toggle-border`, `toggle-button-fg-disabled`, `toggle-slim-border-pressed`, `toggle-slim-border-pressed-hover`. They are the strongest evidence in the file that `slim`'s stroke behaviour is intentional.

**Off and disabled read different tokens although both resolve to gray/100 today.** Value coincidence is not meaning; if Figma separates them this is already right. Same reasoning as the hover tokens in `action-surface.ts`.

### Border and shadow

`elevation-1` on the thumb in every state, and no shadow on the track.

Figma still binds the **deprecated `uui-shadows` scale** here — `shadow-sm` under `default`, `shadow-xs` under `slim`. Elevation is the only shadow foundation, so that is a Figma inconsistency, not something this component reproduces. The consequence, recorded rather than smoothed over: Figma draws the two types with shadows **3.8× apart** in composited alpha, and `elevation-1` renders them identically. Over white, `slim`'s thumb is within 3 levels of Figma; `default`'s is ~30 levels lighter.

The focus ring is the shared `focusRing` — measured at 2px of `bg-primary` then 2px of visible `focus-ring`, exactly Figma's treatment. It sits on the **track** while the elevation shadow sits on the **thumb**, so unlike OtpInput there is no composite to hand-write and no shadow-slot exception.

### Props

| Prop              | Type                         | Figma                  |
| ----------------- | ---------------------------- | ---------------------- |
| `variant`         | `'default' \| 'slim'`        | `Type`                 |
| `size`            | `'sm' \| 'md'`               | `Size`                 |
| `checked`         | `boolean`                    | `Pressed` (controlled) |
| `defaultChecked`  | `boolean`                    | — (uncontrolled)       |
| `onCheckedChange` | `(checked: boolean) => void` | —                      |
| `disabled`        | `boolean`                    | `State=Disabled`       |
| `label`           | `ReactNode`                  | `Text=True`            |
| `supportingText`  | `ReactNode`                  | nested boolean         |
| `classNames`      | 6 slots                      | —                      |

Width is `w-full`, not Figma's authored 344px — that is the instance width on the canvas, and the text block inside it is `flex-1`. Same call as InputDropdown's root.

### Accessibility

A `role="switch"` **button**, not an `<input type="checkbox">`. Nothing in Figma implies form submission — no `name`/`value` semantics in any of the 64 variants, no form context, and no consumer — so the simpler element wins. `TagCheckbox` made the same call for the same reason. Consumers needing form participation should render a hidden input and drive it from `onCheckedChange`.

- `label` becomes the accessible name via `aria-labelledby`; `supportingText` the description via `aria-describedby`. Neither is duplicated into the control.
- The thumb is an unlabelled `<span>` with no role — the state is already on the button.
- `Space` and `Enter` both toggle. `disabled` removes it from the tab sequence.
- **The label is not dimmed when disabled.** Figma leaves both text colours untouched, verified by sampling rendered pixels, so a disabled Toggle reads as enabled text beside a disabled control. Reproduced as drawn and flagged rather than silently corrected.
- The control is **not** wrapped in a `<label>`, so clicking the text does not toggle. Figma expresses no interaction on the text block, and inventing one would pull the supporting text into the accessible name.

### Figma inconsistencies

- Binds the deprecated `uui-shadows` and `uui-focus-rings` effect styles.
- `State=Hover` is a no-op for all 16 `Pressed=False` variants; `Disabled` collapses `Pressed` for a further 8 pairs.
- The `Size` axis **crosses type scales** — `md` binds the Desktop ramp (16/24), `sm` the Mobile ramp (14/20).
- Label→supporting gap is 0 at `sm` but 2 at `md`.
- `slim`'s thumb radius is a raw `9999px` while its track radius is bound to `radius-full`.
- Disabled dims neither text colour.
- No semantic token for the track fill (off or on) or the `slim` track stroke — Figma binds primitives there, so `bg-tertiary`, `bg-brand-solid` and `border-secondary` are chosen by meaning.
- `_Toggle base` duplicates the parent's axes, authoring every state twice.

### Reuse

`focusRing` verbatim — Figma's ring and the shared one are byte-identical. The `inset-ring` technique, `defineVariants`, `cn` and the slot pattern. **`action-surface` does not apply**: it is keyed on `variant` × `tone`, and Toggle has no tone. `TagCheckbox` is the closest relative and still not reusable — a square 14/16/18 box with a tick and no travel.

### Consumers

**Undetermined.** No consumer exists in this repo, and Toggle instances elsewhere in the Figma file could not be enumerated with the available tooling — the design-system search returns only published library assets, and there is no find-all-instances capability. The four purpose-named `toggle-*` semantic tokens are indirect evidence that `slim` is genuinely consumed.

## Checkbox

### Overview

Figma's `Checkbox` set (node 1097:63652) publishes **72 variants** across six axes — `Checked` × `Indeterminate` × `Size` × `Type` × `Text` × `State`. That is **18 cells × 4 states**, every cell carrying all four.

**The 40 `Type=Checkbox` variants are implemented.** The other 32 are `Type=Radio` — see below.

| Type     | Text  | Cells                                       | Variants             |
| -------- | ----- | ------------------------------------------- | -------------------- |
| Checkbox | False | unchecked, checked, indeterminate × 2 sizes | 24                   |
| Checkbox | True  | unchecked, checked × 2 sizes                | 16                   |
| Radio    | False | unchecked, checked × 2 sizes                | 16 — not implemented |
| Radio    | True  | unchecked, checked × 2 sizes                | 16 — not implemented |

`Indeterminate=True` exists **only** with `Checked=True`, `Type=Checkbox`, `Text=False` — 8 variants. Never with Radio, never with a label. Our API allows `indeterminate` alongside a label; Figma publishes no such variant.

### A Radio lives in a set named Checkbox

32 of the 72 are radios, differing from the checkboxes in exactly two things: `rounded-full` instead of `rounded-xxs`/`rounded-xs`, and a 6/8px dot instead of a 12/14px glyph. Everything else — box sizes, border, fills, disabled treatment, focus ring, text layout, gaps, typography — is identical.

**It is still not a variant of this component.** A radio is single-select within a named group, needs `role="radio"` inside a `radiogroup`, and moves selection with the arrow keys rather than toggling. Routing it through `Checkbox` would give it checkbox semantics, which is a correctness problem, not a styling one. A separate `Radio`/`RadioGroup` component can reuse this one's box geometry when it is built.

### Anatomy

```
root                      flex row · w-full · items-start · gap 8 / 12    [label]
├─ control (label)        pt-2 ← centres the box on the FIRST line        [label]
│  ├─ input               native, sr-only, `peer`
│  └─ box                 16 / 20 · border 1px · radius 2 / 4 · aria-hidden
│     └─ glyph            tick-02 or remove-01 · 12 / 14
└─ text                   flex-1 · gap 0 / 2                             [label]
   ├─ label (label for=)  14/20 w500 · text-primary
   └─ supportingText      14/20 w400 · text-secondary        [supportingText]
```

`Text=False` is the bare box — **no wrapper offset**. Figma's `_Checkbox base` is **flattened**: it re-declares the parent's axes minus `Text`, so it is an authoring artifact with no state of its own.

### The 2px offset centres the box on the first line

Figma's `Input` frame is 16×18 at `sm` and 20×22 at `md`, with the box at y=2. That 2 is `(line-height − box) / 2` in **both** sizes: (20−16)/2 and (24−20)/2. So the control tracks the first line, not the block — with two lines those differ by 13px at `md`. Verified: the offset is identical with one line and with two.

### Geometry

|                      | sm                      | md                       |
| -------------------- | ----------------------- | ------------------------ |
| Box                  | 16 (`size-semantic-xl`) | 20 (`size-semantic-2xl`) |
| **Radius**           | **2** (`rounded-xxs`)   | **4** (`rounded-xs`)     |
| Glyph                | 12 (`size-semantic-lg`) | 14 (`size-[14px]`)       |
| Row gap              | 8                       | 12                       |
| Label→supporting gap | **0**                   | **2**                    |
| Type                 | 14/20 Mobile            | 16/24 Desktop            |

**Radius is not proportional** — 2 against a 16px box, then 4 against a 20px box. The glyph is flex-centred, which lands it on Figma's 12.5% and 15% insets (2px and 3px) exactly.

### State model

| Checked               | State                         | Fill                 | Border               | Glyph                |
| --------------------- | ----------------------------- | -------------------- | -------------------- | -------------------- |
| False                 | Default / **Hover** / Focused | `bg-primary`         | 1px `border-primary` | —                    |
| False                 | Disabled                      | `bg-disabled-subtle` | 1px `border-primary` | —                    |
| True or indeterminate | Default / **Hover** / Focused | `bg-brand-solid`     | **0**                | `fg-white`           |
| True or indeterminate | Disabled                      | `bg-disabled-subtle` | 1px `border-primary` | `fg-disabled-subtle` |

**`State=Hover` is a complete no-op** — pixel-identical to `State=Default` in every one of the 18 cells, checked and unchecked. So no hover rule exists anywhere in the component. **Disabled keeps the glyph**, greyed, rather than hiding it — unlike Toggle, which drops its indicator's state entirely.

Border **width** follows Figma rather than staying 1px and going transparent: filled states get `border-0`. Both spellings render identically — the glyph is flex-centred either way, verified in the browser — but only `border-0` also measures the way Figma declares it.

### Elevation

**None.** Figma binds no shadow to any of the 72 variants, so no elevation token is consumed and there is no deprecated UUI shadow to inherit. The only effect in the set is the focus ring, measured at 2px `bg-primary` + 4px `focus-ring` — byte-identical to `focusRing`, restated with `peer-focus-visible:` because focus lands on the input while the ring paints on the box.

### Props

| Prop                              | Type                         | Figma                   |
| --------------------------------- | ---------------------------- | ----------------------- |
| `size`                            | `'sm' \| 'md'`               | `Size`                  |
| `checked`                         | `boolean`                    | `Checked` (controlled)  |
| `defaultChecked`                  | `boolean`                    | — (uncontrolled)        |
| `onCheckedChange`                 | `(checked: boolean) => void` | —                       |
| `indeterminate`                   | `boolean`                    | `Indeterminate`         |
| `disabled`                        | `boolean`                    | `State=Disabled`        |
| `label`                           | `ReactNode`                  | `Text=True`             |
| `supportingText`                  | `ReactNode`                  | nested                  |
| `checkIcon` / `indeterminateIcon` | `ReactNode`                  | `tick-02` / `remove-01` |
| `classNames`                      | 8 slots                      | —                       |

Plus every native `<input>` prop — `name`, `value`, `required`, `form`.

### Accessibility

**A native `<input type="checkbox">`**, not a `<button role="checkbox">`. The evidence:

- Figma's own wrapper frame is literally named **`Input`**.
- `indeterminate` is a native DOM property with a matching `:indeterminate` pseudo-class, and Figma publishes it as a first-class axis.
- The one measured consumer, InputDropdown's multi-select menu item, is a form control.

So it carries `name`/`value`/`required`, form association and native keyboard behaviour. This is the **opposite call from Toggle**, for the opposite reason: nothing in Toggle's 64 variants implied form participation.

- The input is `sr-only` — still in the accessibility tree, still focusable. The painted box is `aria-hidden`; the input already carries the state.
- `label` becomes the accessible name via `htmlFor`, so **clicking the text toggles** natively. `supportingText` is linked with `aria-describedby` and left outside the `<label>` so it does not join the name.
- `indeterminate` reports `aria-checked="mixed"`. When not indeterminate, `aria-checked` is omitted rather than duplicating what the native input reports.
- **The label is not dimmed when disabled** — Figma leaves both text colours untouched, verified by sampling rendered pixels. Reproduced as drawn and flagged.

### Token audit

Every measured value maps to a token. **Zero new documented exceptions** — the only arbitrary value is `size-[14px]`, already listed for Tag's glyph ramp.

| Value               | Classification                                                                                                                                                                |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| all 10 colours      | **semantic token** (`bg-primary`, `border-primary`, `bg-brand-solid`, `fg-white`, `bg-disabled-subtle`, `fg-disabled-subtle`, `text-primary`, `text-secondary`, `focus-ring`) |
| radius 2 / 4        | **primitive token** — radius has no semantic collection, so primitives are allowlisted                                                                                        |
| 0, 2, 8, 12, 16, 20 | **semantic token**                                                                                                                                                            |
| 14px glyph          | **documented exception, pre-existing**                                                                                                                                        |
| 1px border          | **missing foundation** — border-width is an empty stub, so a bare `border`                                                                                                    |
| shadow              | none required                                                                                                                                                                 |

### Figma inconsistencies

1. **The unchecked box has no fill at Default/Hover but `base/white` at Focused**, and `gray/50` at Disabled. Identical over a white canvas, divergent over any other surface. We apply `bg-primary` in all enabled states — what the same cell declares at Focused, and the only reading under which the box does not change fill on focus.
2. **`State=Hover` is a no-op across all 18 cells** — 18 variants encode a state that renders identically to Default.
3. **A Radio is published inside a set named "Checkbox"**, differing only by radius and indicator.
4. **`Indeterminate` is a separate axis but valid only with `Checked=True`**, so three of its four combinations are unpublished dead space.
5. **The `Size` axis crosses type scales** — `sm` binds Mobile 14/20, `md` binds Desktop 16/24.
6. **Radius varies by size** (2 → 4) while the box only grows 16 → 20.
7. **Disabled dims neither text colour.**
8. `_Checkbox base` re-declares the parent's axes minus `Text`, authoring every state twice.

### TagCheckbox stays independent

`TagCheckbox` was assessed for replacement and **kept**. Six measured structural differences, each of which would be a visual regression:

|                    | TagCheckbox                            | Checkbox             |
| ------------------ | -------------------------------------- | -------------------- |
| Sizes              | 14 / 16 / 18                           | 16 / 20              |
| Radius             | 4 constant                             | 2 at `sm`, 4 at `md` |
| Checked stroke     | brand/600 inset ring                   | **none**             |
| Hover when checked | **→ brand/700** fill + stroke          | **no change**        |
| Stroke technique   | `inset-ring` (Tag's root is hug-sized) | CSS `border`         |
| Indeterminate      | absent                                 | 8 published variants |

Tag's padding tables are calibrated to 14/16/18, so substituting 16/20 would move every `sm` and `lg` tag. The divergence is pinned by tests in `Checkbox.test.tsx` so it cannot be merged away on the strength of the two looking alike.

### Consumers

**InputDropdown multi-select `_dropdown menu item`** (nodes `5265:8961`–`5265:8965`) instances `Size=md, Type=Checkbox, Text=False, Checked=True`. The menu item supplies its own label and reproduces the same 2px optical offset with `items-center` on a 24px row. This is the component multi-select was blocked on.

Beyond that, instances are **not enumerable** with the available tooling.

## Radio

### Overview

Measured from Figma `Checkbox` (node 1097:63652), **`Type=Radio` only** — **32 published variants**: `Checked`(2) × `Size`(2) × `Text`(2) × `State`(4), which is 8 cells with all four states each. **All 32 are implemented.**

`Indeterminate` is a live axis on every Radio variant and is always `False`. A radio has no mixed state; the axis is inherited from sharing a component set with Checkbox.

### Anatomy

```
root                      flex row · items-start · gap 8 / 12            [label]
├─ control (label)        pt-2 ← centres the circle on the FIRST line    [label]
│  ├─ input               native radio, sr-only, `peer`
│  └─ circle              16 / 20 · rounded-full · border 1px · aria-hidden
│     └─ dot              6 / 8 · rounded-full · bg-current
└─ text                   flex-1 · gap 0 / 2                             [label]
   ├─ label (label for=)  14/20 w500 · text-primary
   └─ supportingText      14/20 w400 · text-secondary
```

`Text=False` is the bare circle — no wrapper, no offset. Figma's nested `_Checkbox base` is **flattened**; it re-declares the parent's axes minus `Text` and has no state of its own.

### Geometry

|                      | sm                         | md                         |
| -------------------- | -------------------------- | -------------------------- |
| Circle               | 16 (`size-semantic-xl`)    | 20 (`size-semantic-2xl`)   |
| Radius               | `rounded-full`             | `rounded-full`             |
| **Dot**              | **6** (`size-semantic-sm`) | **8** (`size-semantic-md`) |
| Border               | 1px                        | 1px                        |
| Row gap              | 8                          | 12                         |
| Label→supporting gap | **0**                      | **2**                      |
| Type                 | 14/20 Mobile               | 16/24 Desktop              |

**The dot is not a constant proportion.** Figma insets it 31.25% at `sm` and 30% at `md`, so it is sized absolutely — which is also what puts both values on the semantic spacing scale.

**The 2px offset centres the circle on the first line.** It is `(line-height − circle) / 2` in both sizes: (20−16)/2 and (24−20)/2. Verified identical with one line and with two — with two lines, centring on the _block_ would differ by 13px at `md`.

### State model

| Selected | State                         | Fill                 | Border               | Dot                  |
| -------- | ----------------------------- | -------------------- | -------------------- | -------------------- |
| No       | Default / **Hover** / Focused | `bg-primary`         | 1px `border-primary` | —                    |
| No       | Disabled                      | `bg-disabled-subtle` | 1px `border-primary` | —                    |
| Yes      | Default / **Hover** / Focused | `bg-brand-solid`     | **0**                | `fg-white`           |
| Yes      | Disabled                      | `bg-disabled-subtle` | 1px `border-primary` | `fg-disabled-subtle` |

**`State=Hover` is a complete no-op** — pixel-identical to `State=Default` in all 8 cells, selected and unselected. There is no hover rule anywhere in the component. **Disabled keeps the dot**, greyed, and brings back the 1px stroke that the selected state drops.

The dot takes its colour from the circle through **`bg-current`**, so one mechanism produces both measured dot colours and the disabled dot is automatic.

### Elevation

**None.** Figma binds no shadow to any of the 32, so no elevation token is consumed and there is no deprecated UUI shadow to inherit. The only effect is the focus ring — 2px `bg-primary` then 4px `focus-ring`, restated with `peer-focus-visible:` because the ring paints on the circle while focus lands on the input.

### Props

| Prop                         | Type                      | Figma                                          |
| ---------------------------- | ------------------------- | ---------------------------------------------- |
| `size`                       | `'sm' \| 'md'`            | `Size` (defaults to the group's, then `sm`)    |
| `value`                      | `string`                  | identity in the group, and the submitted value |
| `checked` / `defaultChecked` | `boolean`                 | `Checked`                                      |
| `onCheckedChange`            | `(checked: true) => void` | never called with `false`                      |
| `label` / `supportingText`   | `ReactNode`               | `Text=True`                                    |
| `classNames`                 | 8 slots                   | —                                              |

Plus every native `<input>` prop — `name`, `required`, `form`.

### RadioGroup

Figma publishes **no group at all**: no container, label, spacing or orientation. So `RadioGroup` is a **semantic container only and imposes no layout** — its rendered `className` is empty, verified in the browser. Consumers own the stack.

What it does provide:

|                                             |                                                                                                                |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Shared `name`**                           | generated when omitted, which is what stops two groups on a page interfering                                   |
| **`role="radiogroup"`**                     | plus an accessible name from `label` (applied as `aria-label`, **not rendered**) or your own `aria-labelledby` |
| **Shared value**                            | controlled or uncontrolled                                                                                     |
| **Shared `size` / `disabled` / `required`** | each overridable per radio                                                                                     |

`required` is passed through with **no visual treatment**: Figma publishes no required or error state, so any indicator would be invented.

### Keyboard is entirely native

Nothing in this component implements group navigation. Radios sharing a `name` get it from the browser, and it was verified in a real browser rather than only in jsdom:

- **One tab stop per group**, entering at the selected radio, or the first when none is selected.
- **Arrow keys move focus _and_ selection**, wrapping at both ends.
- A fully disabled group is skipped.

This is the main reason for the element choice. A `<button role="radio">` would mean hand-rolling a roving `tabIndex`, four arrow handlers and wrap logic.

### One subtlety worth knowing

An **uncontrolled standalone** radio deliberately leaves the input _uncontrolled_ (`defaultChecked`, not `checked`). React restores every same-`name` radio's DOM checkedness from its props after a change, so a controlled input would undo the browser's own mutual exclusion — the second radio in a pair would never select. Grouping is handed back to the browser, and a capture-phase `change` listener keeps React informed just enough to paint the dot. Inside a `RadioGroup`, or with an explicit `checked`, the input is controlled as usual.

### Accessibility

- A native `<input type="radio">`, `sr-only` — still in the accessibility tree, still focusable, still form-associated. The circle is `aria-hidden`.
- **No `aria-checked`.** A native radio reports its own selection; the attribute could only disagree with it.
- `label` becomes the accessible name via `htmlFor`, so **clicking the text selects** natively. `supportingText` is linked with `aria-describedby` and left outside the `<label>`.
- **A selected radio cannot be unselected** by clicking it — native `change` does not fire, and nothing here inverts state.
- **The label is not dimmed when disabled.** Figma leaves both text colours untouched, verified by sampling rendered pixels. Reproduced as drawn and flagged.

### Token audit

**Zero documented exceptions — the first component to need nothing from `DOCUMENTED_EXCEPTIONS`.** Every value is a semantic token or an allowlisted radius primitive; the 6/8 dot sizes are both on the semantic spacing scale where Checkbox's 14px glyph was not. The 1px border is a bare `border`, since border-width is still an empty foundation stub.

### Figma inconsistencies

1. **The nested component is named `_Checkbox base` even for radios.**
2. **`Indeterminate` is a live axis on all 32 Radio variants, always `False`.**
3. **A Radio is published inside a component set named `Checkbox`.**
4. **The unselected circle declares no fill at Default and Hover, but `base/white` at Focused**, and `gray/50` at Disabled. We apply `bg-primary` in every enabled state — what the same cell declares at Focused, and the only reading under which the circle does not change fill on focus.
5. **`State=Hover` is a no-op in all 8 cells** — 8 of the 32 variants render identically to Default.
6. **The `Size` axis crosses type scales** — `sm` binds Mobile 14/20, `md` binds Desktop 16/24.
7. **The dot is not a constant proportion** — 31.25% at `sm`, 30% at `md`.
8. **Disabled dims neither text colour.**
9. **No RadioGroup is published**, so nothing in the file expresses grouping, orientation or spacing — the very thing that makes a radio a radio.
10. **The 2px offset is authored as a fixed frame height** (16×18, 20×22) rather than as alignment, so it silently depends on the line height staying 20/24.

### Relationship to Checkbox

Several measured values agree — circle sizes, fills, border colour, the focus ring, and the entire label row. **The variants are deliberately duplicated rather than shared.** The library extracts only on proven structural reuse across components, not because values match today, and these two already diverge on radius (`rounded-full` against 2-then-4), indicator (own dot against a caller glyph), indeterminate (absent against 8 variants) and exception count (0 against 1). Five tests in `Radio.test.tsx` pin the divergence, including one asserting neither file imports the other.

### Consumers

**None.** No Radio exists elsewhere in the repository, and Figma instances are not enumerable with the available tooling. InputDropdown's single-select menu row was checked specifically and uses a bare `tick-02` glyph, not a Radio.

## Avatar

### Overview

A person's avatar. Measured from Figma `Avatar_user` (node `1816:9346`) — **70 variants**, `Relationship`(14) × `Size`(5).

**The thirteen relationship illustrations ship with the component.** Figma publishes them inside `Avatar_user` itself, which makes them design-system content rather than something each consumer supplies, so `relationship` is the primary API. `illustration` remains for artwork the thirteen do not cover. `Initials (Name)` is filed as a fourteenth relationship but is a **content mode**, derived here from `name`.

There is **no `src`**. `Avatar_user` publishes no photo variant; photo avatars are a separate Figma set (`doc image`, node `1044:8576`) with its own size scale and a `Shape` axis, and folding them together would have invented a component neither set draws.

### Anatomy

```
span                       root — the box, deliberately unclipped
└── span                   content — the fills, the clipping, the circle
    └── span               initials — aria-hidden, uppercased in CSS
└── span                   status — Figma's `icon` frame, flush bottom-right
    ├── span               ring — `_Icon Status`, the white disc  ┐ online
    │   └── span           dot — the coloured indicator           ┘ offline
    └── span               seal — the Verified badge, no ring       verified
```

**No private components.** `_Background` is two fills and a radius with no children; `_Icon Status` is a positioned circle with a fill per state. Wrapping either would be more indirection than the thing it wraps. Avatar stays at the standard five files plus `get-initials.ts`; the illustrations live outside it, in `src/assets/avatar/`.

### Two ramps, and neither is a ratio

| size | box | badge | `_Icon Status`   | dot   | initials |
| ---- | --- | ----- | ---------------- | ----- | -------- |
| xs   | 24  | 8     | 8 (**no inset**) | 6.4   | 12/20    |
| sm   | 32  | 10    | 8                | 6.4   | 14/20    |
| md   | 36  | 12    | 9.6              | 7.68  | 16/24    |
| lg   | 40  | 14    | 11.2             | 8.96  | 16/24    |
| xl   | 48  | 16    | 12.8             | 10.24 | 20/28    |

The box steps 24/32/36/40/48 and the badge steps 8/10/12/14/16 — **a linear +2 that only looks like box ÷ 3.** That ratio holds at xs, md and xl by arithmetic accident and breaks at sm (0.3125) and lg (0.35). Implementing `size-1/3` from two measurements would have shipped 0.67px and 1.33px wrong; both ramps are per-size tables for that reason.

Position is always `avatar − badge`, which is exactly flush, so `bottom-0 right-0` replaces a per-size offset table.

### The insets are fractions, not padding

Figma nests two 10%-per-side insets: the `icon` frame holds `_Icon Status` at 80% (node `1816:9584` — a 10 holding an 8), and inside it the dot is 80% of the disc (node `1816:10706` — two concentric ellipses, 10×10 with an 8×8 at 1,1).

Both are expressed by **sizing each circle at `size-4/5` of its parent**, never by padding it. A percentage padding resolves against the containing block's width rather than the element's own, so it cannot express a self-relative inset at all; and because the badge is absolutely positioned, a percentage padding on it would resolve against the avatar root. A percentage _size_ does resolve against the parent, so the two nested insets compose exactly at every size.

Sizing also keeps the token layer clean: `size-4/5` needs no documented exception where an arbitrary percentage padding would.

### Colour

Bound by meaning, not by matching value: online `bg-success-solid`, offline `fg-disabled-subtle`, verified `bg-brand-solid` (as a `text-` colour, since the seal paints with `currentColor`), ring `bg-primary`, grey background `bg-secondary`.

`grey` is deliberately **not** `bg-disabled-subtle`, which carries the same value at gray/50. An avatar with a grey backdrop is not disabled, and the token layer is where that distinction lives.

### Verified is a different shape, not a different fill

Online and Offline are two concentric discs — a white outer ring with a coloured inner disc — and differ only in that inner fill (node `1816:10706`). **Verified is neither.** It is a scalloped seal with a tick cut into it and **no white ring at all** (node `1816:10700`), so it replaces the ring rather than sitting inside one, and there is no 80% dot within it.

**`status` is the badge's entire public API.** All three states are drawn by the component: a coloured disc inside a white ring for `online` and `offline`, and for `verified` the seal together with its own white tick, which Figma draws itself (node `1816:10702`). The badge takes no artwork from the caller — it is design language rather than consumer content, so there is nothing to pass and therefore no way to disagree with Figma.

The seal is exported as the **composed symbol** rather than its two vectors. Figma builds it from a rosette rotated 22.5°, which the design context expresses as a `hypot()` container query — exporting the composed node bakes the rotation into the path and removes any need to reproduce that maths. The artwork paints with `currentColor` so it themes with the rest of the status set; the tick stays literal white, because Figma binds base/white, a primitive that does not flip with mode.

Placement is unchanged: the seal fills the `_Icon Status` box, which is 80% of the `icon` frame at every size except `xs` at full size — measured 8/8, 8/10, 9.59/12, 11.2/14, 12.8/16.

### Typography

Figma authors all five sizes from the **Marketing** ramp, which the typography foundation does not publish. Mapped under the project's standing substitution rule — exact match first, else closest by size → weight → line height → family, never a Banner token:

| size | Figma | token                          |                                                                  |
| ---- | ----- | ------------------------------ | ---------------------------------------------------------------- |
| xs   | 12/18 | `text-mobile-body-sm` (12/20)  | **substitution** — the only exact 12/18 is a Banner token        |
| sm   | 14/20 | `text-mobile-body-md`          | exact                                                            |
| md   | 16/24 | `text-desktop-body-sm`         | exact                                                            |
| lg   | 16/24 | `text-desktop-body-sm`         | exact                                                            |
| xl   | 18/28 | `text-desktop-body-md` (20/28) | **substitution** — no 18px token exists; the scale jumps 16 → 20 |

Both substitutions are **temporary until the Marketing ramp is added to the typography foundation**. Neither costs a documented exception, which is the point of the rule.

`md` and `lg` genuinely share 16/24, so nothing derives typography from the box size. Initials are centred rather than placed at Figma's authored box: `xl` centres exactly (28×28 at 10,10 in a 48) while `md` is off by 1px horizontally (25×24 at 5,6 in a 36), so the offset is authoring drift and centring is the intent.

### The built-in relationship illustrations

Thirteen illustrations, exported from each `Size=xl` variant's `avatar` layer at 48 and drawn into a `0 0 48 48` viewBox — the highest fidelity the file offers, and resolution-independent, so one export serves all five sizes.

They live in **`src/assets/avatar/`, not in the component**, because artwork is not implementation. One file per drawing, each exported individually as a component, with `index.ts` collecting them into the lookup map Avatar reads:

```
src/assets/avatar/
  self-spouse-male.tsx     AvatarSelfSpouseMale
  father.tsx               AvatarFather
  …                        (thirteen in total)
  index.ts                 AVATAR_RELATIONSHIPS, AvatarRelationship, avatarIllustrations
```

Names are prefixed `Avatar…` rather than bare `Father` or `Sister`: these are exported from the package root, where a bare `Son` would be both collision-prone and meaningless. A consumer who wants one drawing on its own imports it directly and passes it as custom artwork:

```tsx
import { Avatar, AvatarFather } from '@medibuddy/mozaic-ui';

<Avatar relationship="father" />              // the normal way
<Avatar illustration={<AvatarFather />} />    // the same drawing, reached directly
```

Figma's layer ids and clip paths are stripped. The ids are layer names carrying no meaning, and keeping them would put repeated `id` attributes in the document the moment two avatars render together; the clip is redundant because the content slot already clips to the circle. The colours stay literal fills rather than tokens — they are illustration artwork, not themeable surfaces, and they do not respond to colour mode in Figma either.

**The root `<svg>` must declare `fill="none"`.** Several illustration paths are stroke-only and rely on the inherited SVG fill to remain unfilled — 69 shapes across the set. Figma declares it on its own root, where it cascades to every path that sets no fill of its own. Remove it and the fill falls back to SVG's default of black, so every stroke-only shape renders filled. Two tests hold this invariant: one on the attribute, one on the rendered effect.

Father and Mother are taken from the vector asset Figma itself references rather than from a node export. Both sources are geometrically equivalent — the node export writes each closing segment explicitly where the asset relies on `Z`, and both close over the same region — but the asset is the shorter path to what the file declares. They are placed with a `translate` so no coordinate is rewritten: Figma's own placement inside the 48-square frame, confirmed from the frame's inset percentages and by differencing every path origin.

Each file exports a component, so nothing is constructed until one is rendered, and a file exporting only components cannot break React Fast Refresh — the same constraint that put `getInitials` in its own module.

**Bundling cost: 391.6 KB, or 59.4 KB gzipped, against 312.6 KB before the illustrations landed.** One file per illustration does **not** make them tree-shakeable: `avatarIllustrations` names all thirteen, so importing Avatar reaches every drawing and a bundler cannot drop the unused ones. What the split buys is organisation and direct imports, not size. Making it tree-shakeable would mean dropping the static map for lazy imports, which would trade away synchronous rendering.

#### The names are not the obvious guesses

They follow Figma's own variants, normalised to kebab-case, which is not the set a reader might assume:

| you might expect                       | what exists                              | why                                                                                                                                                                          |
| -------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `self`, `spouse-male`, `spouse-female` | `self-spouse-male`, `self-spouse-female` | Figma draws **one** illustration for both self and spouse, so there are two variants, not four. A bare `self` has no artwork to resolve to — it would have to pick a gender. |
| `other`                                | `other-male`, `other-female`             | Two separate drawings, not one neutral fallback. `no-gender` is the neutral one.                                                                                             |
| `grandfather`, `grandmother`           | _(absent)_                               | **No such variants exist anywhere in the set.** Adding them would mean inventing artwork the design system has not drawn.                                                    |
| _(nothing)_                            | `son-in-law`, `daughter-in-law`          | Published, easy to overlook, and included.                                                                                                                                   |

If grandparents are wanted they are a Figma change first; the component picks them up as soon as `AVATAR_RELATIONSHIPS` grows.

### Props

| prop | type | default |
| -------------- | -------------------------------------- | ------## SearchBar

### Overview

A search field with a two-part animated placeholder. Measured from Figma `Search Bar` (node `4353:2239`) — **6 variants**, `Device`(3) × `State`(2), a full cross with no gaps — and its private `_Search animating text` set (node `4353:6249`), **12 variants** of `Device`(3) × `type`(4) plus a `showAnimatedText` boolean.

The two Figma nodes are **one component plus its private subcomponent**, not two components and not two variants of one. `_Search animating text` is underscore-prefixed, is instanced only inside Search Bar, and has no independent use, so it is not exported; its two properties reach the component as `type` and `showAnimatedText`.

**The placeholder is two elements, never one string.** Figma draws a static `Search by` alongside a separately positioned stack of four quoted words, and the two are driven independently. Composing them into a single placeholder string would lose that, which is why the placeholder is an overlay above the input rather than a `::placeholder` value — one string cannot carry two independently styled, independently controlled halves.

**`State` is derived, never a prop.** Figma publishes Default and Filled as an axis, but Filled is fully determined by whether there is text. A prop would let a caller ask for Filled with an empty field, which Figma cannot draw.

Not built on [Input](#input), which is structurally different: an `inset-ring` focus treatment Figma defines, `shadow-elevation-1`, heights 44/56, a `size` axis of sm/md, and `label` / `leadingText` / `trailingSlot` concepts Search Bar does not publish. SearchBar is the first consumer of `shadow-elevation-2`.

### Anatomy

```
div                          root — padding, gap, radius, fill, stroke, shadow, focus ring
├── div                      Content — flex-1, min-w-px, per-device gap
│   ├── span                 search-01 box — per-device size, brand/600
│   └── span                 Field — relative, height = one line
│       ├── input            type="search", Filled typography
│       └── span             Placeholder — overlay, aria-hidden       (empty only)
│           ├── span         Static text — "Search by"
│           └── span         Animating text — one-line clipped window (showAnimatedText)
│               └── span     the stack, offset by type
│                   └── span ×4   ‘Doctor’ ‘Hospital’ ‘Symptom’ ‘Speciality’
└── button                   cancel-01 — clear                        (filled only)
```

- **The stroke is an `inset-ring`, not a `border`.** Figma's frame hugs its content and the padding sums to the published height exactly at all three devices — 12+20+12 = 44, 12+24+12 = 48, 16+28+16 = 60 — which only holds if the stroke contributes nothing to the box. A CSS border would give 46, 50 and 62.
- **The height is derived, not pinned.** It is the padding plus one line of the device's own type step.
- **The width is `w-full`.** Figma's 328 / 312 / 620 are viewport canvas widths, and the animating-text instance is overridden to `flex: 1 0 0` inside the bar, so the field fills whatever container it is given.
- **The static half sits outside the clipped window**, so `type` and `showAnimatedText` cannot reach it.

### Sizes and geometry

|                       | mobile            | desktop-1280 | desktop-1920 |
| --------------------- | ----------------- | ------------ | ------------ |
| Figma frame           | 328×44            | 312×48       | 620×60       |
| root padding          | `px` 16 / `py` 12 | 12           | 16           |
| root gap              | 8                 | 8            | 8            |
| Content gap           | 6                 | 8            | 12           |
| search icon           | 20                | 24           | 28           |
| clear icon            | 16                | 20           | 24           |
| field / window height | 20                | 24           | 28           |
| static → animated gap | 4                 | 6            | 8            |
| word pitch            | 24                | 28           | 32           |

`device` is Figma's own axis, **not a size scale** — the three viewports share only the fill, the stroke, the radius and the shadow. Same reasoning as [InputDropdown](#inputdropdown)'s `device`.

Figma positions the word stack with an absolute `left` of 70 / 81 / 102. Minus the measured width of "Search by" (66 / 75 / 94) that is exactly 4 / 6 / 8, so the offset is expressed as a layout gap — which holds even when Lexend Deca renders a fraction wider than Figma measured.

### The animated placeholder

The four words are stacked in a column with a 4px gap and clipped to a one-line window. `type` shifts the stack by one pitch per step, where the pitch is one line height plus that gap:

| type         | mobile | desktop-1280 | desktop-1920 |
| ------------ | ------ | ------------ | ------------ |
| `doctor`     | 0      | 0            | 0            |
| `hospital`   | −24    | −28          | −32          |
| `symptom`    | −48    | −56          | −64          |
| `speciality` | −72    | −84          | −96          |

Every word stays mounted at every `type`; the offset is the only thing that changes. That is Figma's own mechanism, and **cycling `type` on a timer is therefore the whole animation** — the measured offsets above stay the single source of geometry, and there is no second animation path to keep in step with them.

**Only the word stack moves.** The placeholder row, the static `Search by` and the clipped window all carry no transform at all — verified in the browser, where each reports `translate: none` and the static text holds its position across all twelve pinned combinations. The animation is confined to the stack inside the window, which is what makes it a vertical slide behind a one-line mask rather than a moving placeholder.

The step that wraps from the last word back to the first has no transition, so the stack resets instantly rather than scrolling backwards through all four. A pinned word declares no transition either — nothing can move, so a transition class would be dead styling.

**The timing is an implementation default, not a Figma value.** The file publishes four static frames and specifies no duration, easing or dwell anywhere; `src/foundations/motion/motion.css` is an empty `@theme {}`, so there is no token to read.

|                | value                          | source                                                                  |
| -------------- | ------------------------------ | ----------------------------------------------------------------------- |
| dwell per word | 2000ms                         | implementation default, via `intervalMs`                                |
| slide duration | 500ms                          | implementation default, in `constants.ts` (`MOTION.DURATION_S`)         |
| slide easing   | `cubic-bezier(0.4, 0, 0.2, 1)` | **repo convention** — Tailwind's `--default-transition-timing-function` |

The travel is driven by **framer-motion**, the frontend repository's motion layer, rather than a CSS transition — which is also why the offsets are no longer Tailwind utilities. It animates Figma's own pitch instead of the ±15px fade its `AnimatedRotatingText` uses, because that component's mechanism would lose the clipped-window geometry this design depends on.

Both numbers are placeholders for a real motion specification; when one lands, the dwell moves to a token and the slide follows it. **Do not read either as a design value.**

Cycling stops in four cases:

| condition                        | why                                                                                                                                                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `animate={false}`                | pins the window to `type`, reproducing Figma's twelve published `_Search animating text` variants exactly                                                                                                 |
| `prefers-reduced-motion: reduce` | a live subscription, so toggling the OS setting applies without a reload                                                                                                                                  |
| the field is filled              | Filled has no placeholder to animate, and the timer is torn down rather than left running                                                                                                                 |
| the page is hidden               | a hidden tab throttles timers to about once a second and runs no transitions, so a cycle left running there re-renders nothing anyone can see and then arrives at a word it jumped to rather than slid to |

The first three change what the markup claims; the last only pauses the timer, so switching tabs never swaps the accessible name or toggles the transition class.

`showAnimatedText={false}` removes the animated stack and nothing else — the static `Search by` is independent of it, exactly as Figma's `showAnimatedText=false` draws it.

The words carry Figma's typographic single quotes (U+2018 / U+2019): `‘Doctor’`, not `'Doctor'`.

### Typography — zero substitutions

Every style is an exact token match. Weight is a separate axis, and `--font-weight-light: 300` exists.

| device       | Figma style                            | px    | token                  | weight                       |
| ------------ | -------------------------------------- | ----- | ---------------------- | ---------------------------- |
| mobile       | `Mobile/M-Body/M-light` · `M-regular`  | 14/20 | `text-mobile-body-md`  | `font-light` · `font-normal` |
| desktop-1280 | `Desktop/D-Body/S-light` · `S-regular` | 16/24 | `text-desktop-body-sm` | `font-light` · `font-normal` |
| desktop-1920 | `Desktop/D-Body/M-light` · `M-regular` | 20/28 | `text-desktop-body-md` | `font-light` · `font-normal` |

The placeholder is Light 300 in `text-secondary`; the value is Regular 400 in `text-primary`. No Banner token is involved.

### Colours

| role                         | Figma                            | token                                             |
| ---------------------------- | -------------------------------- | ------------------------------------------------- |
| container fill               | `base/white`                     | `bg-semantic-bg-primary`                          |
| container stroke             | `Gray (Light mode)/50`           | `inset-ring-gray-light-50` — documented exception |
| shadow                       | `Shadow/Elevation 2`             | `shadow-elevation-2` — byte-exact                 |
| placeholder                  | `textcolor/Grey 700 - Secondary` | `text-semantic-text-secondary`                    |
| value                        | `textcolor/Grey 900 - Primary`   | `text-semantic-text-primary`                      |
| search icon, **both states** | `brand-blue/600`                 | `text-semantic-fg-brand-primary`                  |
| clear icon                   | `gray-light-mode/900`            | `text-semantic-fg-primary`                        |

The search glyph stays brand blue when the field fills — Figma does not dim it.

### Props

| prop               | type                                                  | default          | notes                                                    |
| ------------------ | ----------------------------------------------------- | ---------------- | -------------------------------------------------------- |
| `device`           | `'mobile' \| 'desktop-1280' \| 'desktop-1920'`        | `'mobile'`       | Figma's `Device`                                         |
| `type`             | `'doctor' \| 'hospital' \| 'symptom' \| 'speciality'` | `'doctor'`       | animated half only; the word the cycle starts from       |
| `showAnimatedText` | `boolean`                                             | `true`           | animated half only                                       |
| `animate`          | `boolean`                                             | `true`           | `false` pins the window to `type`                        |
| `intervalMs`       | `number`                                              | `2000`           | dwell per word, ms; not a Figma value                    |
| `value`            | `string`                                              | —                | controlled                                               |
| `filledText`       | `string`                                              | —                | Figma's text property; seeds the uncontrolled value      |
| `onValueChange`    | `(value: string) => void`                             | —                | every edit, and `''` on clear                            |
| `onClear`          | `() => void`                                          | —                | after the clear button empties the field                 |
| `searchIcon`       | `ReactNode`                                           | —                | Figma's `search-01`                                      |
| `clearIcon`        | `ReactNode`                                           | —                | Figma's `cancel-01`                                      |
| `clearLabel`       | `string`                                              | `'Clear search'` | accessible name for the clear button                     |
| `classNames`       | `SlotClassNames<…>`                                   | —                | per-slot escape hatch; `className` targets the container |

Remaining `<input>` props pass through. `type` is Figma's property, so the element's own type is fixed at `search`.

**Both glyphs are caller-supplied.** `src/icons/` is a deliberate stub — `Icon` returns `null`, `svg/` holds only `.gitkeep`, and it is not exported from the package — so no component bundles a library glyph. Same treatment as [Tag](#tag)'s `icon` / `closeIcon` and [InputDropdown](#inputdropdown)'s `chevron`.

### States

Only the two Figma publishes:

|            | Default                     | Filled                      |
| ---------- | --------------------------- | --------------------------- |
| text       | Light 300, `text-secondary` | Regular 400, `text-primary` |
| content    | animated placeholder        | the value                   |
| clear icon | absent                      | present                     |

The container is identical between them — same fill, stroke, radius, shadow and padding. There is **no** hover, pressed, disabled, error or loading treatment, because Figma draws none.

### Accessibility

The input is a real `<input type="search">`, so it carries the `searchbox` role and normal text-entry semantics.

**The accessible name only ever claims a word that is on screen and holding still**, because a name can only be one string and a name that churned would be worse than a less specific one:

| state                      | accessible name                                            |
| -------------------------- | ---------------------------------------------------------- |
| cycling                    | `Search by`                                                |
| pinned (`animate={false}`) | `Search by ‘Hospital’`                                     |
| `prefers-reduced-motion`   | `Search by ‘Hospital’` — visible, but not moving           |
| `showAnimatedText={false}` | `Search by`                                                |
| Filled                     | `Search by` — the placeholder is gone, so no word to claim |

While the words cycle, only the static half names the field: a name that changed every couple of seconds would churn for anyone focused on an empty field, and the four words are illustrative rather than instructions. The rendered placeholder stays two elements and is `aria-hidden`, since it duplicates the name. A caller's `aria-label` wins over all of this.

The placeholder overlay is `pointer-events-none`, so clicking anywhere on it reaches the input underneath.

**Focus is the one treatment Figma does not publish.** The component uses the library's shared indicator on the container, driven by `focus-within`, so it traces the bar's 12px radius and reads the same as every other focusable thing in Mozaic. The alternative — the browser's own ring — is a differently-coloured rectangle in every engine and ignores the radius. This is the shared indicator rather than a design invented for this component.

`type="search"` makes WebKit draw its own clear button, which would sit beside the `cancel-01` Figma specifies; a `::-webkit-search-cancel-button` reset removes the duplicate.

### Usage

```tsx
<SearchBar searchIcon={<SearchIcon />} clearIcon={<CancelIcon />} />

<SearchBar
  device="desktop-1920"
  type="hospital"
  value={query}
  onValueChange={setQuery}
  onClear={() => setQuery('')}
  searchIcon={<SearchIcon />}
  clearIcon={<CancelIcon />}
/>

<SearchBar intervalMs={3500} searchIcon={<SearchIcon />} />

<SearchBar type="hospital" animate={false} searchIcon={<SearchIcon />} />

<SearchBar showAnimatedText={false} />
```

Do not try to set the state directly — there is no `state` prop. Put text in `value` (or `filledText`) and Filled follows.

### Documented exceptions

Two, both recorded in `token-usage.policy.ts`:

1. **No semantic border token at gray/50** — `inset-ring-gray-light-50`. The three `border-*` semantic tokens resolve to gray/300, /200 and /100. A same-valued token of another role is deliberately not substituted, exactly as for error/600.
2. **No spacing or sizing step at 28px** — `size-[28px]`, `h-[28px]`. 28 is `spacing-7`, and the scale runs 6 (24) straight to 8 (32).
   The nine word-stack offsets used to be a third. They are gone: framer-motion applies the pitch from `MOTION.PITCH`, so nine arbitrary `-translate-y-[…]` utilities are no longer written at all.

### Figma inconsistencies

1. **Mobile's radius is a raw `12px`; both desktops bind `radius-xl`.** Same value, two of three bound.
2. **desktop-1920 Default is `flex-col` while its Filled sibling is a row.** No visual difference with one child; normalised to a row.
3. **Mobile is the only device with asymmetric padding** — `px` 16 / `py` 12, against uniform 12 and 16.
4. **The Content gap follows no ramp shared with anything else** — 6 / 8 / 12.
5. **`_Search animating text` is a component instance at Default but a local frame reusing the same layer name at Filled** (`4359:772` / `779` / `786`).
6. **The gap after "Search by" is baked into an absolute `x`** rather than being a layout gap, so it depends on the text rendering to exactly 66 / 75 / 94px.
7. **Property-name casing is inconsistent** — `Device` capitalised, `type` lowercase.
8. **The subcomponent's root widths do not match their content** — 175 vs 142, 204 vs 163, 204 vs 204; the two desktops share 204 despite different content. Moot inside Search Bar, which overrides the width to fill.
9. **`filledText` ends in a literal pipe character**, `"Cardi|"` — a drawn cursor, not a caret. A real input has its own caret, so the pipe is not reproduced.
10. **`showAnimatedText` doubles the combinations to 24** while only 12 are published.
11. **The shadow style is named `Shadow/Elevation 2` at Mobile and `shadow/elevation-2` at both desktops.** Same values.

### Consumers

**None.** No component or story in the repository renders a search field, and nothing accepted `onSearch`, `searchTerm`, `type="search"` or `role="search"` before this component.

---

## Tooltip

### Overview

A tooltip bubble. Measured from Figma `Tooltip` (node `1052:489`) — **14 variants**, `Supporting text`(2) × `Arrow`(7). All 14 are implemented.

**This is the bubble, not the behaviour.** Figma publishes two properties and neither is a state: there is no hover, focus, open, delay, collision or motion anywhere in the component set, and no z-index. Tooltip therefore renders what Figma draws and leaves visibility and placement to the caller. Adding a trigger would have meant inventing an interaction the design does not specify and picking a positioning strategy on every consumer's behalf; a triggered wrapper is the natural follow-up once a real consumer defines the interaction, exactly as for Modal's focus trap.

Because nothing here is stateful there are no hooks, so the module carries no `'use client'` directive and the component renders on the server.

### Anatomy

| Part           | Figma layer                | Notes                                                      |
| -------------- | -------------------------- | ---------------------------------------------------------- |
| root           | the symbol                 | Flex wrapper holding bubble and arrow. Carries the shadow. |
| content        | `Content`                  | The bubble: surface, radius, padding.                      |
| group          | `Text and supporting text` | Only present with supporting text.                         |
| label          | `Text`                     |                                                            |
| supportingText | `Supporting text`          |                                                            |
| arrow          | `Tooltip`                  | Decorative, `aria-hidden`.                                 |

### Props

| Prop             | Type                                                                                                | Default  | Notes                                                        |
| ---------------- | --------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------ |
| `label`          | `ReactNode`                                                                                         | —        | **Required.** Figma's `Text`.                                |
| `supportingText` | `ReactNode`                                                                                         | —        | Figma's `Supporting text`. **Presence selects the variant.** |
| `arrowPosition`  | `'none' \| 'bottom-center' \| 'bottom-left' \| 'bottom-right' \| 'top-center' \| 'left' \| 'right'` | `'none'` | Figma's `Arrow` axis.                                        |
| `classNames`     | `SlotClassNames<TooltipSlot>`                                                                       | —        | Per-slot overrides.                                          |

Plus every `div` prop, including `id` — which the accessibility contract needs.

**`arrowPosition`, spelling out Figma's `Arrow`.** The prop keeps Figma's term and says what the value selects: where the arrow attaches, and so where the tooltip sits relative to what it describes. The seven values are Figma's own, unchanged. The `arrow` slot in `classNames` is separate — it targets the arrow element rather than choosing a position.

`supportingText` is derived rather than paired with a boolean because a boolean plus a string can express "true with nothing to show", which Figma cannot. Same call as Avatar, where Figma's `Initials (Name)` is derived from `name`.

### Variants and states

**Tooltip has no state axis.** Nothing in the 14 reacts to interaction, and `Tooltip.test.tsx` asserts the absence — no `hover:`, `focus:`, `focus-visible:`, `active:` or `disabled:` class appears anywhere in the rendered output — so a state treatment cannot arrive later as an invention.

**The arrow matrix is asymmetric, and reproduced as published:** three bottom positions, one top, and two sides with no vertical qualifier. `top-left`, `top-right` and any side-centre do not exist in Figma and so do not exist here.

### Geometry — measured from Figma

|                       | Arrow=None | + vertical arrow | + horizontal arrow |
| --------------------- | ---------- | ---------------- | ------------------ |
| Supporting text=False | 115 × 36   | 115 × 42         | 121 × 36           |
| Supporting text=True  | 258 × 94   | 258 × 100        | 264 × 94           |

The arrow adds exactly **6px** to whichever axis it attaches on, and the padding is what the heights confirm: `8 + 20 + 8 = 36`, and `12 + (20 + 2 + 48) + 12 = 94`.

**The two content modes differ by more than a line.** Padding goes from `12/8` to 12 all round, and the label stops being centred and unwrapped and becomes a full-width wrapping block. Both are read from Figma.

**Width is not pinned.** Figma's instances are 115 and 258 wide, but those are canvas widths — `Content` is full-width inside them and the copy is sample text. The bubble hugs its content and the caller caps it, the same call documented for InputDropdown's `w-[320px]`. One consequence of reproducing Figma exactly: a label on its own carries `whitespace-nowrap`, so a long single-line label overflows rather than folding. `classNames.label` is the escape hatch.

### Typography and colours

|               | Figma                         | Token                                       |
| ------------- | ----------------------------- | ------------------------------------------- |
| Label         | `Body-sm-Medium` 12/20 w500   | `text-mobile-body-sm font-medium` — exact   |
| Label colour  | `#FFFFFF`                     | `text-semantic-text-white`                  |
| Supporting    | `Caption-md-Light` 10/16 w300 | `text-mobile-caption-md font-light` — exact |
| Surface       | `gray-light mode/900` #252D38 | `bg-semantic-bg-primary-solid`              |
| Radius        | `radius-md` 8                 | `rounded-md`                                |
| Padding / gap | 12 / 8 / 2                    | `semantic-lg` / `md` / `xxs`                |

**One value where Figma disagrees with itself.** The component binds the primitive `Colors/gray-light mode/100` (#DBE0E6) for supporting text, while Figma's own semantic variable `Components/Tooltips ✅/tooltip-supporting-text` aliases `gray-light mode/300` (#A4B0C0) — a visibly darker grey, which Mozaic generated as `--color-semantic-tooltip-supporting-text`. That variable is marked `hiddenFromPublishing`, so the component's binding is what a consumer of the library actually sees, and it wins. `utility-gray-100` is the semantic token carrying #DBE0E6 exactly, so the published value is reached without dropping to a primitive. **Worth reconciling in Figma**; once it is, this becomes `text-semantic-tooltip-supporting-text`.

### The arrow

Figma exports three SVG assets for the six drawn positions, but they are **one shape**: the 28-wide asset is the 16-wide path translated exactly +12px, and the top variant is the same asset under `rotate-180`. One path plus placement reproduces all six, so there is a single source of geometry.

The path is 16 × 8.51471, of which only 6px protrudes; Figma tucks the remaining 2.51471px behind the bubble, which is what carries the two rounded base corners. The glyph here crops to the visible window through its `viewBox` instead, which renders identically — that strip sits behind an opaque surface either way — and keeps the box on `semantic-xl` × `semantic-sm` rather than needing an off-scale offset.

The two offset positions use one `semantic-lg` of margin where Figma uses a wider 28px frame flush to the edge. Both put the arrow's near edge 12px from the bubble's; the margin reaches it through a token.

Colour arrives as `currentColor` from a text utility reading the surface token, so the arrow cannot drift from the bubble it belongs to.

### Shadow

Figma binds `uui-shadows/shadow-lg`, which **no Mozaic token carries**. The Shadows section the elevation foundation is transcribed from (node `4823:505`) holds exactly 8 styles, all two-layer, pure black and spread 0; shadow-lg is three layers of `#171b22` with negative spreads. Adding it to `elevation.json` would contradict that file's own transcription record, so it is a documented token exception rather than a new elevation step. Repaid by a shadow foundation covering the uui-shadows collection, once a second component needs one of them.

**It is a filter, not a box-shadow, and that is load-bearing.** Figma binds the effect to the wrapper holding bubble _and_ arrow, so it traces both as one silhouette. A `box-shadow` on the bubble would leave the arrow unshadowed, and shadowing the arrow separately would draw a seam where they meet.

### Accessibility

`role="tooltip"` provides **no accessible name on its own** — it has to be referenced. Give the tooltip an `id` and point the trigger at it with `aria-describedby`. The `id` is deliberately not generated: only the caller can put the same value on the trigger.

The arrow is decorative and hidden from assistive technology. The bubble is not focusable, and Figma specifies no keyboard interaction because it specifies no interaction at all.

### Usage

```tsx
// The consumer owns visibility and placement.
<button aria-describedby="save-tip">Save</button>;
{
  open && <Tooltip id="save-tip" arrow="top-center" label="Saves your changes" />;
}
```

```tsx
<Tooltip
  label="This is a tooltip"
  supportingText="Tooltips are used to describe or identify an element."
  arrowPosition="bottom-left"
/>
```

Do not reach for `arrowPosition="top-left"` or a side-centre — they are not published. Do not rely on the tooltip positioning itself; it renders where you put it.

### Deliberate omissions

- **No trigger, delay, or collision handling.** Not specified by Figma. Would require inventing the interaction and choosing a positioning strategy.
- **No portal or z-index.** Same reason.
- **No positioning library.** None is installed, and nothing in the published design needs one.

## TopNavigationBar

### Overview

The application top navigation bar. Measured from Figma `Mobile Top Navigation Bar` (node `2180:49648`, 360 × 64) and `Desktop Top Navigation Bar` (node `2180:49909`, 1920 × 92).

**Two Figma components behind one `device` prop.** They are separate nodes, not variants of one set, and the asymmetry is stark: mobile publishes five boolean properties and desktop publishes **none**. They also share no children — mobile has a back icon, an optional action and three generic slots; desktop has a logo, a search field, two action items and an account block. `device` therefore selects a layout rather than retuning one.

Auto-switching was rejected rather than overlooked. It needs a breakpoint that neither side defines: `src/foundations/breakpoints/breakpoints.css` is still an empty foundation because Figma publishes no breakpoint tokens, and the consuming application's scale stops at `2xl` 1536 with no 1920 step. Picking a boundary would have been inventing a design value.

**Scope is the bar only.** The Figma frame this came from (`2180:49908`) also contains `_Breadcrumb` (227 × 24) and `Desktop Header` (1440 × 73) as **separate sibling components**. Folding them in would have fused three Figma components and made the breadcrumb unusable anywhere else. They are candidates for their own components.

### Anatomy

| Part                                                       | Figma layer                         | Device  |
| ---------------------------------------------------------- | ----------------------------------- | ------- |
| root                                                       | the symbol                          | both    |
| container                                                  | `Container`                         | both    |
| middleSlot / heading / headingText / subHeading            | `_Middle Slot`                      | both    |
| leftIcon                                                   | `Left Icon`                         | mobile  |
| actionButton                                               | `Buttons/Button`                    | mobile  |
| rightSlot                                                  | `Right Slot 1/2/3`                  | mobile  |
| logo                                                       | `_MB Logos`                         | desktop |
| search / searchPlaceholder / searchIcon                    | `Search Bar`                        | desktop |
| rightSection / actionItem / badge                          | `right section`, `_[d]Action Items` | desktop |
| account / accountAvatar / accountName / accountDescription | `Account`                           | desktop |

### Props

| Prop                               | Type                                   | Default         | Notes                                                       |
| ---------------------------------- | -------------------------------------- | --------------- | ----------------------------------------------------------- |
| `device`                           | `'mobile' \| 'desktop'`                | `'mobile'`      | Which Figma bar to render.                                  |
| `heading` / `subHeading`           | `ReactNode`                            | —               | Figma's `Heading` / `Sub Heading`.                          |
| `headingStartIcon`                 | `ReactNode`                            | —               | 16 on mobile, 20 on desktop.                                |
| `headingEndIcon`                   | `ReactNode`                            | —               | **Desktop only** — Figma draws no trailing glyph on mobile. |
| `leftIcon` + `leftIconLabel`       | `ReactNode`, `string`                  | —               | Mobile. Presence replaces `leftIconShow`.                   |
| `action`                           | `{ label, onClick? }`                  | —               | Mobile MERGE button. Presence replaces `buttonShow`.        |
| `rightSlots`                       | `ReactNode[]`                          | —               | Mobile, 0–3. Replaces the three `*Show` booleans.           |
| `logo`                             | `ReactNode \| null`                    | shipped MB logo | Desktop. `null` drops the slot.                             |
| `searchPlaceholder` / `searchIcon` | `ReactNode`                            | —               | Desktop.                                                    |
| `actionItems`                      | `TopNavigationBarActionItem[]`         | —               | Desktop wallet and cart.                                    |
| `account`                          | `TopNavigationBarAccount`              | —               | Desktop.                                                    |
| `classNames`                       | `SlotClassNames<TopNavigationBarSlot>` | —               | Per-slot overrides.                                         |

Plus every `header` prop.

**Presence replaces Figma's `*Show` booleans.** Figma needs a flag per slot because it cannot express "absent". Passing the content is what shows it, which makes "shown but empty" unrepresentable — the same call Avatar makes for initials and Tooltip for supporting text.

**Figma's property names live on the _nested_ components, not the bars.** `actionType`, `walletAmount`, `noOfItems`, `showCartBadge` and `showWalletBadge` all belong to `_[d]Action Items`; `actionType: Back | Placeholder` belongs to `_[m]Action Items`. Only `actionType` survives into the public API, as `type: 'wallet' | 'cart'` on an action item, because it selects real geometry rather than just artwork.

### Geometry — measured from Figma

|                    | Mobile                                  | Desktop                             |
| ------------------ | --------------------------------------- | ----------------------------------- |
| Height             | **64** (pinned; `semantic-7xl` exactly) | **92** = `16 + 60 + 16`             |
| Horizontal padding | 16                                      | **112**                             |
| Root gap           | 16                                      | 48 between sections, 32 within them |
| Middle-slot gap    | 2                                       | 2                                   |
| Heading glyph      | 16                                      | 20                                  |
| Icon boxes         | 24                                      | 36 (glyphs), 28 (search)            |
| Elevation          | `elevation-1`                           | `elevation-2`                       |

The desktop height is padding plus the logo box rather than a pinned frame, which is why no `92` appears anywhere in the source.

**Badges close their own arithmetic**, and that is what settles the stroke: the wallet's is 57 × 20 with `8 + 41 + 8 = 57`, and the cart's 25 × 20 with `4 + 17 + 4 = 25` — text plus padding exactly. A 1.5px CSS border would have pushed them to 60 × 23 and 28 × 23, so the white stroke is a **ring**, which paints outside the box without perturbing it.

### Typography

Every step is an exact token match; the weight arrives separately because Mozaic's typography tokens carry size and line height only.

|                            | Mobile                                                  | Desktop                                                |
| -------------------------- | ------------------------------------------------------- | ------------------------------------------------------ |
| Heading                    | `text-mobile-body-md` 14/20 semibold                    | `text-desktop-body-md` 20/28 semibold                  |
| Sub-heading                | `text-mobile-caption-md` 10/16 medium, `text-secondary` | `text-desktop-body-sm` 16/24 light, **`text-primary`** |
| Action button              | `text-mobile-body-sm` 12/20 semibold                    | —                                                      |
| Search placeholder         | —                                                       | `text-desktop-body-md` 20/28 light                     |
| Account name / description | —                                                       | `text-desktop-caption-md` 14/20 semibold / light       |

**The sub-heading differs in size, weight _and_ colour between the two bars.** That reads like a mistake and is not — both are read from their own node.

### Reuse

**Avatar is reused as-is.** Figma nests `Avatar_user` at 36 in the account block, which is Avatar's `md` on `background="grey"`. Verified in the browser: 36 × 36 with `rgb(235, 238, 241)` — `gray-light-50`, matching Figma exactly, with no override.

**SearchBar is deliberately _not_ reused.** The desktop field shares SearchBar's height (60) and glyph size (28) and nothing else: it is `bg-secondary-subtle` with a 12px radius and a 1px inside stroke, a caret plus one placeholder, and the glyph on the **right**. SearchBar is white on `elevation-2` with the glyph on the left and an animated two-part placeholder.

**Button is deliberately not reused** for the MERGE action. Figma pins 44 × 20 with zero padding, `radius-xs` and bare brand text; Button's smallest size resolves to 36 tall on `rounded-sm`, and it publishes no text-only variant.

**Icons are caller-supplied**, following the established pattern — the icon foundation publishes no set yet. The **MediBuddy logo ships**, because it is brand artwork the desktop bar cannot render without. Its two fills are literals for the same reason Avatar's illustrations are: Figma binds them to `brand/600` and `error/600`, and a logo that changed hue with the surface would be the wrong logo.

### States and behaviour

**Neither bar has a state axis.** No hover, focus, pressed or disabled treatment appears in either node, and no motion. `TopNavigationBar.test.tsx` asserts the absence so one cannot arrive later as an invention.

**No behaviour is invented.** Figma publishes no menu, dropdown, sticky or scroll behaviour, no search submission and no navigation, so none exists here. Callbacks appear only where Figma draws a control, and the account becomes a `button` only when given a handler — Figma draws a chevron but publishes no open state.

The one deliberate addition is the shared `focusRing` on the real buttons: Figma publishes no focus state for either bar, and shipping an unfocusable control would be worse than the documented deviation. Same call as SearchBar.

### Accessibility

`role="banner"` on the root. Every icon-only control takes an accessible name — `leftIconLabel` on mobile, `label` on each action item. Decorative glyphs are `aria-hidden`. The shipped logo is announced as "MediBuddy" rather than hidden, because it is the product's name and not ornament.

**The search field is not an input.** Figma draws a caret glyph and a placeholder, not a text field, so nothing here claims to be one — there is no `searchbox` or `textbox` role to find.

### Usage

```tsx
<TopNavigationBar
  heading="Order Medicines"
  subHeading="Delivered in 2 hours"
  leftIcon={<BackIcon />}
  leftIconLabel="Go back"
  rightSlots={[<SearchIcon key="s" />, <BellIcon key="b" />]}
/>
```

```tsx
<TopNavigationBar
  device="desktop"
  heading="Heading"
  subHeading="This is the subtitle"
  searchPlaceholder="Search"
  searchIcon={<SearchIcon />}
  actionItems={[
    { type: 'wallet', icon: <WalletIcon />, label: 'Wallet', badge: '87586' },
    { type: 'cart', icon: <CartIcon />, label: 'Cart', badge: '88' },
  ]}
  account={{
    name: 'MediBuddy Benefits',
    description: 'Corporate Sponsored Account',
    avatar: <Avatar size="md" background="grey" name="Olivia Rhye" />,
    endIcon: <ChevronDownIcon />,
  }}
/>
```

### Known limitation — 1280

Figma publishes **only the 1920 desktop frame**, and its root is fluid with a fixed 112px padding. Reproducing that exactly means the search field — the one `flex-1` child — absorbs all the compression: measured at **176px wide at 1280**, against 592 at 1920. Nothing overflows and no Figma value is violated, but if the design intends a narrower gutter or a smaller logo below 1920, that is a design decision Figma has not published.

### Deliberate omissions

- **Breadcrumb and Desktop Header** — separate Figma components, not folded in.
- **No navigation, menu, sticky, scroll or search behaviour** — not specified by Figma.
- **No `Type` axis on the middle slot.** Figma's `_Middle Slot` is itself a set (`Type=Heading & Sub Text`) described as a master with toggles to its atoms; those toggles arrive here as presence rather than as a published axis.

## BeneficiarySelectChip

### Overview

A beneficiary shown as a selectable pill. Measured from Figma `Beneficiary Select Chip` (node `2180:33533`) — **4 variants**, `Device`(2) × `State`(2). All 4 are implemented.

**The chip is inert.** Figma draws a chip rather than a control: there is no hover, focus, pressed or disabled treatment across the 4, and no interaction of any kind. So the root renders a plain `span`, claims no role and sets no `aria-pressed`. A caller who needs it selectable wraps it in their own `button`, which keeps the role, the handler and the ARIA where they can be got right — and in a flex row of chips that button simply becomes the flex item, so nothing about the layout shifts.

Nothing here is stateful, so the module carries no `'use client'` directive and renders on the server.

**Deliberately independent of [BeneficiarySelector](#beneficiaryselector).** See the note there.

### Anatomy

| Part   | Figma layer   | Notes                                                        |
| ------ | ------------- | ------------------------------------------------------------ |
| root   | the symbol    | The pill: surface, stroke, radius, padding, shadow.          |
| avatar | `Avatar_user` | Decorative, `aria-hidden`. Caller-supplied; sets the height. |
| name   | `benifName`   | Truncates to one line at the cap.                            |

### Props

| Prop         | Type                                        | Default    | Notes                                                     |
| ------------ | ------------------------------------------- | ---------- | --------------------------------------------------------- |
| `name`       | `ReactNode`                                 | —          | **Required.** Figma's `benifName`.                        |
| `device`     | `'mobile' \| 'desktop'`                     | `'mobile'` | Figma's `Device` axis.                                    |
| `selected`   | `boolean`                                   | `false`    | Figma's `State` axis. **Visual only.**                    |
| `avatar`     | `ReactNode`                                 | —          | Mozaic's own Avatar; both of its axes follow these props. |
| `classNames` | `SlotClassNames<BeneficiarySelectChipSlot>` | —          | Per-slot overrides: `root`, `avatar`, `name`.             |

Plus every `span` prop, and a ref to the root `span`.

`selected` is a boolean rather than `state="selected"` because the axis has exactly two values and selection is the caller's to own — the same call `checked` makes on Radio and Checkbox.

**`avatar` is passed through, not restyled.** The chip does not resize or recolour what it is handed, and the avatar is what sets the chip's height, so the pairing matters:

| Chip               | Avatar               |
| ------------------ | -------------------- |
| `device="mobile"`  | `size="xs"` (24)     |
| `device="desktop"` | `size="sm"` (32)     |
| `selected={false}` | `background="grey"`  |
| `selected`         | `background="white"` |

**No `asChild`.** The chip always renders an avatar and a name, and `Slot` merges props onto exactly one caller-supplied element — two children have no correct interpretation, which is why `Slot` throws rather than guessing.

### Variants and states

**No state axis beyond `State`.** `BeneficiarySelectChip.test.tsx` asserts the absence — no `hover:`, `focus:`, `focus-visible:`, `active:` or `disabled:` class appears anywhere in the rendered output — so a state treatment cannot arrive later as an invention. Not even a focus ring, because the element is inert.

**Selection changes three things at once**: surface, stroke and name colour. The avatar's own background flipping grey to white is a fourth, and belongs to Avatar's `background` axis.

### Geometry — measured from Figma

|         | mobile                     | desktop                      |
| ------- | -------------------------- | ---------------------------- |
| Height  | 40                         | 56                           |
| Width   | cap 132                    | cap 200                      |
| Padding | 8 start / 12 end / 8 block | 12 start / 16 end / 12 block |
| Gap     | 8                          | 8                            |
| Avatar  | 24                         | 32                           |
| Radius  | full                       | full                         |

**The avatar sets the height, not the text**: `8 + 24 + 8 = 40` and `12 + 32 + 12 = 56`, against text line heights of 20 and 24. Nothing pins a height, because Figma does not either.

**The width is a cap, not a size.** Figma writes `max-width`, so the chip hugs its content and truncates only on reaching the cap. Verified in the browser: a short name renders 76.2 wide on mobile, a long one stops at exactly 132 and ellipsises to one line with the height unchanged.

Padding is asymmetric on both devices — Figma insets the avatar side less than the text side, which keeps the optical inset even once the round avatar is in place. Written logically (`ps`/`pe`) so the chip mirrors under right-to-left.

The stroke is an `inset-ring` rather than a border, and the arithmetic proves it: the 132 frame is `8 + 24 + 8 + text + 12`, leaving no room for a border box.

### Typography and colours

|                     | Figma                         | Token                                        |
| ------------------- | ----------------------------- | -------------------------------------------- |
| Name (mobile)       | `Body-md-Medium` 14/20 w500   | `text-mobile-body-md font-medium` — exact    |
| Name (desktop)      | `Body-sm-Medium` 16/24 w500   | `text-desktop-body-sm font-medium` — exact   |
| Name, unselected    | `gray-light mode/700` #252D38 | `text-semantic-text-primary`                 |
| Name, selected      | `brand/600` #0066DC           | `text-semantic-text-brand-tertiary`          |
| Surface, unselected | `base/white`                  | `bg-semantic-bg-primary`                     |
| Surface, selected   | `brand/25` #F1F7FF            | `bg-brand-25` — token exception              |
| Stroke, unselected  | `gray-light mode/50` #EBEEF1  | `inset-ring-gray-light-50` — token exception |
| Stroke, selected    | `brand/600` #0066DC           | `inset-ring-semantic-border-brand-alt`       |
| Shadow              | `elevation-1`                 | `shadow-elevation-1`                         |

Weight is 500 on both devices and in both states; only the scale and the colour move.

### Accessibility

The name carries the meaning, so the avatar is `aria-hidden` — its initials would otherwise be read out as a second, garbled copy of the name.

The chip itself is not focusable and exposes no role, because Figma publishes no interaction. A caller who makes it selectable owns the role, the keyboard behaviour and `aria-pressed`; wrapping it in a `button` gives the button the chip's name automatically.

### Usage

```tsx
<BeneficiarySelectChip
  name="Aarav Sharma"
  avatar={<Avatar size="xs" background="grey" name="Aarav Sharma" />}
/>
```

```tsx
// Selectable: the caller owns the element, the role and the ARIA.
<button type="button" aria-pressed={picked === 'aarav'} onClick={() => pick('aarav')}>
  <BeneficiarySelectChip
    selected={picked === 'aarav'}
    name="Aarav Sharma"
    avatar={<Avatar size="xs" background="white" name="Aarav Sharma" />}
  />
</button>
```

Do not pin a width to fit a long name — the cap is what Figma specifies and truncation is the intended result. Do not pass an avatar whose size does not match the device: it changes the chip's height.

### Deliberate omissions

- **No `onClick`, `role` or `aria-pressed`.** Figma publishes no interaction. Wrapping in a `button` is the documented route.
- **No `asChild`.** Two children, and `Slot` takes one.
- **No hover, focus or disabled treatment.** Not published for any of the 4.

---

## BeneficiarySelector

### Overview

A beneficiary shown as a selectable card with a radio. Measured from Figma `Beneficiary Selector` (node `2180:33550`) — **4 variants**, `Device`(2) × `State`(2). All 4 are implemented.

**Deliberately independent of [BeneficiarySelectChip](#beneficiaryselectchip).** The two share the idea of an avatar beside a name and share no values: the avatar is 40/48 here against 24/32 there, the gaps differ, and their selection languages genuinely diverge — this card keeps a white surface and changes the name's _weight_, while the chip tints its surface and recolours the name. A shared primitive would be two divergent variant tables behind one wrapper, which is the same reasoning Radio and Checkbox use for staying apart.

`useId` ties the nested Radio to the name, and that is a hook — so this module does carry `'use client'`, unlike the chip.

### Anatomy

| Part        | Figma layer      | Notes                                                |
| ----------- | ---------------- | ---------------------------------------------------- |
| root        | the symbol       | The card: surface, stroke, radius, padding, shadow.  |
| badge       | `Badge`          | Pinned flush into the top-right corner.              |
| leftSection | `Left Section`   | Avatar beside the text block, taking the free space. |
| avatar      | `Avatar_user`    | Decorative, `aria-hidden`. Caller-supplied.          |
| content     | `Container`      | The name over the meta row.                          |
| name        | `benifName`      | Truncates to one line.                               |
| meta        | `Self \| Gender` | Relation, separator, age and gender, 4 apart.        |
| control     | the radio        | Mozaic's Radio at `md`.                              |

### Props

| Prop               | Type                                      | Default    | Notes                                                                                  |
| ------------------ | ----------------------------------------- | ---------- | -------------------------------------------------------------------------------------- |
| `name`             | `ReactNode`                               | —          | **Required.** Figma's `benifName`.                                                     |
| `device`           | `'mobile' \| 'desktop'`                   | `'mobile'` | Figma's `Device` axis.                                                                 |
| `selected`         | `boolean`                                 | `false`    | Figma's `State` axis, and the Radio's checked state.                                   |
| `relation`         | `ReactNode`                               | —          | Figma's `relation`. Presence replaces `relationShow` — **and controls the separator.** |
| `age`              | `ReactNode`                               | —          | Figma's `age`. Presence replaces `ageShow`.                                            |
| `gender`           | `ReactNode`                               | —          | Figma's `gender`. Presence replaces `genderShow`.                                      |
| `badge`            | `ReactNode`                               | —          | Figma's `badgeShow`, as content.                                                       |
| `avatar`           | `ReactNode`                               | —          | Mozaic's own Avatar; size follows the device.                                          |
| `value`            | `string`                                  | —          | Groups this selector's Radio with its siblings.                                        |
| `onSelectedChange` | `(selected: boolean) => void`             | —          | Fires when the nested Radio becomes checked.                                           |
| `classNames`       | `SlotClassNames<BeneficiarySelectorSlot>` | —          | Per-slot overrides, one per part above.                                                |

Plus every `div` prop, and a ref to the root `div`.

**The `*Show` booleans are derived from presence.** Figma publishes `relationShow`, `ageShow`, `genderShow`, `selfGenderShow` and `badgeShow`; taking content instead makes "shown but empty" unrepresentable. Same call as Avatar, where Figma's `Initials (Name)` is derived from `name`. The meta row as a whole appears when any of its three parts does.

**`badge` takes a node, not a boolean.** Figma publishes the boolean but not the text — "Sponsored" is typed into the component. A node keeps product copy out of the design system while drawing exactly what Figma draws.

**`avatar` is passed through, not restyled:** `size="lg"` (40) on mobile, `size="xl"` (48) on desktop. Unlike the chip, the background does **not** flip with selection — Figma keeps it `grey` in all four variants.

### Variants and states

**No state axis beyond `State`.** Figma publishes no hover, focus, pressed or disabled treatment for any of the 4, and the test suite asserts the absence. The only focus treatment belongs to the nested Radio, which brings its own.

**Selected changes the stroke, the name's weight and the name's colour** — and nothing else. The surface stays white.

### Geometry — measured from Figma

|               | mobile               | desktop              |
| ------------- | -------------------- | -------------------- |
| Height        | 84                   | 124                  |
| Padding       | 16 inline / 20 block | 24 inline / 32 block |
| Gap           | 12                   | 16                   |
| Name–meta gap | 4                    | 8                    |
| Meta item gap | 4                    | 4                    |
| Avatar        | 40                   | 48                   |
| Radio         | 20                   | 20                   |
| Radius        | 8                    | 16                   |

**The text block sets the height, not the avatar** — the opposite of the chip:

- mobile: `20 + (20 + 4 + 20) + 20 = 84`, against a 40px avatar
- desktop: `32 + (28 + 8 + 24) + 32 = 124`, against a 48px avatar

Verified in the browser at Figma's own frame widths: 84 at 244 and 124 at 342, with a long name truncating to one line and leaving the height unchanged.

**Width is not pinned.** Figma's frames are 244 and 342 wide, but those are canvas widths — a card in a list takes the width its container gives it, the same call documented for InputDropdown's `w-[320px]`. The stories constrain a container to Figma's numbers rather than baking them in.

The stroke is an `inset-ring` rather than a border, and the arithmetic proves it: `16 + 40 + 12 + 128 + 12 + 20 + 16 = 244` exactly, leaving no room for a border box.

### The badge

Pinned into the top-right corner with its outer corner rounded to the card's radius and the inner one to match, which is why the two rounded corners are diagonal. `overflow-clip` on the root keeps it inside the radius.

Figma offsets it to `-1px` on both axes to sit over the 1px border. Because the stroke here is an `inset-ring` — which paints inside the box and costs no layout — there is no border box to cover, so the offset is `0` and the result is identical without an off-scale value. Measured flush at `top 0, right 0`.

|                    | mobile              | desktop             |
| ------------------ | ------------------- | ------------------- |
| Type               | 8/12 w400           | 12/16 w400          |
| Padding            | 16 inline / 2 block | 24 inline / 4 block |
| Radius (tr and bl) | 8                   | 16                  |

The horizontal padding is large for the text it holds — 16 and 24 against an 8px and 12px type step. That is what Figma draws.

### Typography and colours

|                    | Figma                               | Token                                        |
| ------------------ | ----------------------------------- | -------------------------------------------- |
| Name (mobile)      | `Body-md` 14/20                     | `text-mobile-body-md` — exact                |
| Name (desktop)     | `Body-md` 20/28                     | `text-desktop-body-md` — exact               |
| Name, unselected   | w500, `gray-light mode/500` #47566A | `font-medium text-semantic-text-secondary`   |
| Name, selected     | w600, `gray-light mode/700` #252D38 | `font-semibold text-semantic-text-primary`   |
| Meta (mobile)      | `Body-sm` 12/20                     | `text-mobile-body-sm` — exact                |
| Meta (desktop)     | `Body-sm` 16/24                     | `text-desktop-body-sm` — exact               |
| Meta colour        | `gray-light mode/500` #47566A       | `text-semantic-text-secondary`               |
| Surface            | `base/white`                        | `bg-semantic-bg-primary`                     |
| Stroke, unselected | `gray-light mode/50` #EBEEF1        | `inset-ring-gray-light-50` — token exception |
| Stroke, selected   | `brand/600` #0066DC                 | `inset-ring-semantic-border-brand-alt`       |
| Badge surface      | #F1EDFE                             | `bg-semantic-bg-creative-purple`             |
| Badge text         | #5E40AD                             | `text-semantic-text-purple-secondary`        |
| Shadow             | `elevation-1`                       | `shadow-elevation-1`                         |

Worth knowing, because it looks like an oversight and is reproduced as measured: the unselected name is `text-secondary`, inherited from Figma's `Container`, where BeneficiarySelectChip's equivalent is `text-primary`. The meta row's colour and weight do not move with selection; only the scale changes with device.

### Figma deviations

**The desktop control is 20, not 24 — a deliberate 4px deviation.** Figma draws 20 on mobile and 24 on desktop, but the 24 comes from a node outside the canonical `Checkbox` set, and that set publishes `Size` as `sm` and `md` only, across all 78 of its variants. Adding an `lg` would invent a size in a shared component; re-implementing the control privately would duplicate Radio's checked, unchecked, dot and focus-ring behaviour. So Radio is reused unchanged at `md` and the difference is recorded here. Everything else about the control matches exactly: `border-semantic-border-primary` unchecked, `bg-semantic-bg-brand-solid` checked, and an 8px dot. **Worth reconciling in Figma.**

**The separator is gated on the relation, trailing pipe included.** Figma puts the `|` inside the same `relationShow` gate as the relation itself, so a relation with no age and no gender renders a trailing `Self |`, and an age and gender with no relation render with no separator at all. Reproduced rather than corrected, and asserted in the tests so it stays a known quirk rather than becoming an accident.

### Accessibility

The Radio is labelled by the name through `aria-labelledby` rather than by nesting, because Radio renders its own `<label>` around its input and labels cannot nest. The `id` is generated with `useId`.

The avatar is `aria-hidden` — the name carries the meaning. The separator is hidden too, so assistive technology reads "Self 22 F" rather than a pipe character.

Keyboard behaviour is Radio's, unchanged: arrow keys move within a group, and the focus ring is Radio's own.

### Usage

```tsx
<RadioGroup name="beneficiary" value={picked} onValueChange={setPicked}>
  {people.map((person) => (
    <BeneficiarySelector
      key={person.id}
      value={person.id}
      selected={picked === person.id}
      name={person.name}
      relation={person.relation}
      age={person.age}
      gender={person.gender}
      badge={person.sponsored ? 'Sponsored' : undefined}
      avatar={<Avatar size="lg" background="grey" name={person.name} />}
    />
  ))}
</RadioGroup>
```

Do not pin the card's width to Figma's 244 or 342 — let the container decide. Do not pass an `age` and `gender` without a `relation` expecting a separator; Figma gates it on the relation.

### Deliberate omissions

- **No `lg` Radio.** The canonical Checkbox set publishes `sm` and `md` only; see the deviation above.
- **No private radio implementation.** It would duplicate Radio's states and focus ring.
- **No hover, focus or disabled treatment on the card.** Not published for any of the 4.
- **No fixed width.** Figma's frame widths are canvas widths.

---

## UploadModule

### Overview

A square card for adding a file, or for showing the one already added. Measured from Figma `Upload Module` (node `2180:67664`) — **6 variants**, `Size`(3) × `State`(2). All 6 are implemented.

**One component, because the box is genuinely shared.** Frame, radius and stroke are identical across both states and only the body differs, so splitting this in two would duplicate a 3×3 table of box values. That is the opposite of [BeneficiarySelectChip](#beneficiaryselectchip) and [BeneficiarySelector](#beneficiaryselector), which share the _idea_ of an avatar beside a name and share no values, and so were kept apart.

The two prop sets are **parallel, not a discriminated union** — `state` decides which applies and the other is ignored. Same shape as InputDropdown's `type`, and for the same reason: a union breaks prop spreading, Storybook args, wrappers and HOCs.

Nothing here is stateful, so the module carries no `'use client'` directive and renders on the server.

### Anatomy

| Part    | Figma layer            | Notes                                                         |
| ------- | ---------------------- | ------------------------------------------------------------- |
| root    | the symbol             | The card: frame, radius, stroke. `relative`, never clipped.   |
| icon    | `icon`                 | `state="add"`. Decorative, `aria-hidden`. Caller-supplied.    |
| label   | `buttonName`           | `state="add"`. Wraps and clips against the frame.             |
| preview | the frame's image fill | `state="display"`. Clipped to the radius, covers the frame.   |
| view    | `View Icon`            | `state="display"`. White circle, centred.                     |
| delete  | `Delete Icon`          | `state="display"`. White circle, across the top-right corner. |

### Props

**Figma's six published properties:**

| Prop             | Type                   | Default | Figma                                     |
| ---------------- | ---------------------- | ------- | ----------------------------------------- |
| `size`           | `'sm' \| 'md' \| 'lg'` | `'sm'`  | `Size`                                    |
| `state`          | `'add' \| 'display'`   | `'add'` | `State`                                   |
| `label`          | `ReactNode`            | —       | `buttonName`                              |
| `icon`           | `ReactNode`            | —       | `icon` (its one instance swap)            |
| `showViewIcons`  | `boolean`              | `true`  | `showViewIcons` — plural, as published    |
| `showDeleteIcon` | `boolean`              | `true`  | `showDeleteIcon` — singular, as published |

**Implementation and accessibility additions** — Figma publishes none of these, and each is marked as such on the prop itself:

| Prop          | Type                               | Why it exists                                                                                                                                                                                                                                                                                      |
| ------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `preview`     | `ReactNode`                        | Figma's image is a placeholder fill, not a swappable instance. A node keeps `alt`, `loading` and `next/image` the caller's.                                                                                                                                                                        |
| `viewIcon`    | `ReactNode`                        | Figma draws `eye` with no swap property; every recognisable glyph in Mozaic is caller-supplied.                                                                                                                                                                                                    |
| `deleteIcon`  | `ReactNode`                        | As above, for `delete-02`.                                                                                                                                                                                                                                                                         |
| `onUpload`    | `() => void`                       | Makes the Add card a `<button>`. Figma publishes no interaction.                                                                                                                                                                                                                                   |
| `onView`      | `() => void`                       | Makes the view affordance a `<button>`.                                                                                                                                                                                                                                                            |
| `onDelete`    | `() => void`                       | Makes the delete affordance a `<button>`.                                                                                                                                                                                                                                                          |
| `viewLabel`   | `string`                           | Accessible name for an icon-only control.                                                                                                                                                                                                                                                          |
| `deleteLabel` | `string`                           | As above.                                                                                                                                                                                                                                                                                          |
| `classNames`  | `SlotClassNames<UploadModuleSlot>` | Per-slot overrides: `root`, `icon`, `label`, `preview`, `view`, `delete` — one per element the component positions. The affordances' inner glyph boxes are deliberately not exposed: their classes are pure Figma geometry, and a caller needing a different glyph box supplies a different glyph. |

Plus every `div` prop, and a ref to the root.

`label` ships no default copy. Figma types "Upload New Prescription" into the component, which is product copy — the same call the Beneficiary badge's "Sponsored" got.

**The visibility booleans are Figma's own, under Figma's own names** — `showViewIcons` plural against `showDeleteIcon` singular, which is how Figma publishes them. They stay explicit booleans rather than being derived from content, because they are published properties.

**Each is gated with its glyph.** The boolean decides whether the affordance is wanted; the glyph decides whether there is anything to draw. `false` never renders it, and `true` renders it only once a glyph is supplied — a `true` with no glyph draws nothing, because an empty white circle is not something Figma ever draws, and no artwork ships here that could fill one:

|                        | `viewIcon` given   | no `viewIcon`   |
| ---------------------- | ------------------ | --------------- |
| `showViewIcons: true`  | affordance renders | nothing renders |
| `showViewIcons: false` | nothing renders    | nothing renders |

The two affordances are independently controlled, and one glyph never stands in for the other.

### Variants and states

**No state axis beyond `State`.** Figma publishes no hover, focus, pressed, active, selected, disabled, error, loading, progress, validation or drag treatment for any of the 6, and `UploadModule.test.tsx` asserts the absence so none can arrive later as an invention. There is no file input either: a real upload needs a `<label>` around a hidden `<input type="file">`, which only the caller can wire up.

**Interaction is opt-in, and it is an implementation behaviour rather than a Figma state.** A part becomes a control only when handed a handler — the rule TopNavigationBar's account block already follows. Without `onUpload` the Add root is an inert `div`; with it, a `<button type="button">` carrying the shared `focusRing`. The Display root is **never** a button, because it contains two.

### Geometry — measured from Figma

|                | sm        | md        | lg        |
| -------------- | --------- | --------- | --------- |
| Frame          | 100 × 100 | 160 × 160 | 240 × 240 |
| Radius         | 8         | 12        | 16        |
| Padding (Add)  | 12        | 16        | 24        |
| Gap (Add)      | 8         | 12        | 12        |
| Icon box (Add) | 24        | 32        | 48        |
| Type (Add)     | 10/16     | 14/20     | 20/28     |
| Action circle  | 24        | 32        | 48        |
| Action glyph   | 16        | 21.333    | 32        |

**The frame pins the height, and the content does not sum to it**: sm's Add body is `12 + 24 + 8 + 16 + 12 = 72` inside a pinned 100, so the body is centred in whatever the frame gives it. The Display frame has no padding and no gap — the preview is positioned rather than laid out.

Verified in the browser at all six variants: frames 100/160/240 exactly, radii 8/12/16, padding 12/16/24, gaps 8/12/12, icon boxes 24/32/48, type 10/16, 14/20 and 20/28 all at weight 500.

### The stroke

Figma draws a 1px inside-aligned `gray-light mode/100` stroke, reproduced as `inset-ring-semantic-border-tertiary` — and unlike SearchBar's and Beneficiary's `gray/50` strokes this needs no colour exception, because `border-tertiary` resolves to `gray-light-100` (`#DBE0E6`) exactly.

**A ring rather than a border, and in the Display state that is load-bearing.** Figma's inside stroke paints _over_ the preview's outer edge. A `border` would give the preview a 98 × 98 content box and inset the image by 1px on every side; a ring costs no layout, so the preview fills the full frame and the stroke lands on top. Measured: the preview box is 100/160/240, matching the card exactly. This is an implementation detail with no visual difference from Figma.

### The preview

Fills the frame and is clipped to the card's radius, with `object-cover` and `pointer-events-none`. Figma's two exports express the same crop differently — lg as `object-cover`, sm and md as a percentage offset inside a clipping wrapper — which is their different source aspect ratios rather than two behaviours.

**The clip lives on the preview, not on the root.** The delete affordance hangs across the corner and outside the frame, so a clipped root would slice it off. Figma splits it the same way, with the clip on a wrapper around the image and the affordances as its siblings.

### The affordances

One white circle at three sizes, drawn twice: `rounded-full`, `bg-semantic-bg-primary`, with the glyph at exactly two thirds of the circle. Colour arrives through `currentColor` — `fg-brand-primary` (`#0066DC`) on view, `fg-error-primary` (`#D80008`) on delete, matching the strokes Figma binds on `eye` and `delete-02`.

The view circle is centred in the card. The delete circle is pinned across the top-right corner at Figma's exact offsets, which **do not agree with each other**:

|     | Offsets              | Centre    | Relative to the corner |
| --- | -------------------- | --------- | ---------------------- |
| sm  | `top -13, right -11` | (99, −1)  | 1px **inside**         |
| md  | `top -17, right -17` | (161, −1) | 1px **outside**        |
| lg  | `top -25, right -25` | (241, −1) | 1px **outside**        |

Reproduced as drawn rather than reconciled to a single corner-centred rule, which would move sm by 2px. Measured centres in the browser: exactly (99, −1), (161, −1) and (241, −1).

### Shadow

Figma draws a two-layer shadow on each circle and **binds it to no effect style** — the variable export for this node lists colours, typography and radii only. There are three values because Figma scales one 24px affordance by 1.333 and 2, so the offsets and blurs scale with the circle:

|     | Layer 1                 | Layer 2                 |
| --- | ----------------------- | ----------------------- |
| sm  | `0 1 2 rgba(0,0,0,.04)` | `0 4 5 rgba(0,0,0,.08)` |
| md  | `0 1.333 2.667 .04`     | `0 5.333 6.667 .08`     |
| lg  | `0 2 4 .04`             | `0 8 10 .08`            |

**No elevation token carries any of them, and the near miss is instructive rather than usable**: `elevation-2` shares sm's offsets and first alpha but blurs 4 and 10 against Figma's 2 and 5, and halves the second alpha — substituting it would visibly soften the affordance. So all three are documented token exceptions and reproduced exactly.

Written as arbitrary `box-shadow` properties rather than the `drop-shadow` filter Figma's exporter emits: each circle is solid and fully round, where the two render identically, and `box-shadow` is the property an element's shadow belongs in. Verified in the browser — all three resolve to Figma's values exactly.

### Reuse decisions

**Nothing is reused wholesale; what is reused is tokens and conventions.**

- **IconButton is deliberately not used.** It is padding-sized (`p-semantic-md/lg` plus a 16/20 glyph), rounds to `rounded-sm/md/lg`, and carries variant/tone surfaces. These affordances are pinned circles at 24/32/48 with a bespoke shadow and no tone, so reaching for it would mean overriding its padding, radius, background and shadow — re-styling it into something it is not. What is borrowed is the idea, not the code: an icon-only control needs an accessible name, hence `viewLabel` and `deleteLabel`.
- **No artwork ships.** Figma's `upload-04`, `eye` and `delete-02` are icon-library components and its preview is a placeholder photograph, so all four are the caller's — the convention Checkbox's tick and SearchBar's magnifier already follow. The library ships exactly two glyphs, the Tooltip arrow (a structural shape) and the MediBuddy logo (brand artwork), and this adds neither.
- **`focusRing`** from `@utils/a11y`, the same source Radio, Checkbox, Toggle and SearchBar use, and only on the parts that actually become controls.

### Accessibility

- **Add root:** an inert `div` until `onUpload` is given, then a `<button type="button">` taking its accessible name from `label` and its focus treatment from `focusRing`.
- **Display root:** always a `div`. It must never be a button, because it contains two.
- **View and delete:** rendered only when the boolean and the glyph are both present. A `<button type="button">` when the matching handler is given, otherwise a `<span aria-hidden>` — a circle that does nothing is decoration, and announcing it would be noise. Pass `viewLabel`/`deleteLabel` whenever you pass a handler; an icon-only control has no text to name it.
- **Icon:** `aria-hidden`. The label carries the meaning.
- **Preview:** left visible to assistive technology, because it is the content. `alt` is the caller's — only they know whether the preview is meaningful or decorative.

### Usage

```tsx
<UploadModule label="Upload New Prescription" icon={<UploadIcon />} onUpload={pickFile} />
```

```tsx
<UploadModule
  state="display"
  preview={<img src={file.url} alt={file.name} />}
  viewIcon={<EyeIcon />}
  onView={() => open(file)}
  viewLabel={`View ${file.name}`}
  deleteIcon={<TrashIcon />}
  onDelete={() => remove(file)}
  deleteLabel={`Delete ${file.name}`}
/>
```

A row of these needs room above and between the cards: the delete affordance overhangs the frame on both axes, so a flush container will clip it.

### Token exceptions

Four groups, all narrowly scoped and all repaid by a Sizing or shadow foundation — see `token-usage.policy.ts` for the full reasons.

| Classes                        | Cause                                                                                                 |
| ------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `size-[100px]`, `size-[240px]` | The primitive scale skips both steps (24→32, 56→64). md's 160 is `semantic-11xl` exactly and uses it. |
| three `[box-shadow:…]` values  | No elevation token carries the action shadow, and Figma binds no effect style.                        |
| `size-[21.333px]`              | md's glyph is the arithmetic remainder of Figma's 1.333 scale factor.                                 |
| six delete offsets             | Figma pins them off-scale and inconsistently; see the table above.                                    |

### Deliberate omissions

- **No file input, drag-and-drop, progress, validation or multi-file handling.** None is published, and each would be an invented behaviour.
- **No hover, pressed or disabled treatment.** Not published for any of the 6.
- **`text-overflow: ellipsis` on the label is not carried over.** Figma sets it, but it has no effect on a wrapping block — inert CSS rather than a visual.

---

## Toast

### Overview

A status bar that reports what just happened — a message, an optional leading glyph, and an optional trailing action. Measured from Figma `Toast` (node `2181:829`) — **2 variants** on a single `State` axis valued `Mobile | Desktop`. Both are implemented.

**This is the toast as drawn, not a toast system.** Figma publishes eight properties and not one of them is behavioural: across both variants there is no open state, no duration, no placement, no enter or exit treatment, no dismiss handler and no interaction of any kind. So none of that exists here. Positioning, queueing, timing and dismissal belong to whatever shows the toast — the same division Tooltip uses, where the bubble is the component and visibility and placement stay with the caller. A caller who needs the trailing action to _do_ something passes a control as `postIcon`, or wraps `postText` in one.

Nothing here is stateful, so the module carries no `'use client'` directive and renders on the server.

### Anatomy

| Part        | Figma layer          | Notes                                                              |
| ----------- | -------------------- | ------------------------------------------------------------------ |
| root        | the symbol           | The bar: width, radius, padding, surface, shadow. `role="status"`. |
| content     | leading `Container`  | Flexes into the free space; may shrink below its text.             |
| leftIcon    | `left icon`          | Decorative, `aria-hidden`. Caller-supplied.                        |
| primaryText | `Primary Text`       | Fills the remaining width and wraps.                               |
| post        | trailing `Container` | Intrinsic. Omitted entirely when it would be empty.                |
| postText    | `Post Text`          | Stays on one line.                                                 |
| postIcon    | `post icon`          | **Not** `aria-hidden` — a control passed here must stay reachable. |

### Props

**Figma's eight published properties**, under Figma's own names:

| Prop           | Type                    | Default    | Figma                                   |
| -------------- | ----------------------- | ---------- | --------------------------------------- |
| `state`        | `'mobile' \| 'desktop'` | `'mobile'` | `State` — values lowercased             |
| `primaryText`  | `ReactNode`             | —          | `Primary Text`                          |
| `preIconShow`  | `boolean`               | `true`     | `Pre Icon Show`                         |
| `leftIcon`     | `ReactNode`             | —          | `left icon` (instance swap)             |
| `postTextShow` | `boolean`               | `true`     | `Post Text Show`                        |
| `postText`     | `ReactNode`             | —          | `Post Text`                             |
| `postIconShow` | `boolean`               | `true`     | `Post Icon Show` — plural, as published |
| `postIcon`     | `ReactNode`             | —          | `post icon` (instance swap)             |

The names needed no normalising beyond lowercasing the `State` values: Figma's own property names are already the camelCase React wants, plural and singular included.

**Engineering-only:** `classNames` (per-slot overrides), plus `className`, a `ref` to the root, and native `div` props. That is the whole addition — there is no `open`, `duration`, `autoDismiss`, `position`, `portal`, `onClose`, `onUndo`, `variant`, `intent` or `size`, because Figma publishes none of it and a test asserts their absence.

**No default copy ships.** Figma types "Placeholder Text" into the message and "Undo" into the action; the first is placeholder, the second product copy. Same call UploadModule's label and the Beneficiary badge's "Sponsored" got.

### Variants and states

**No state axis beyond `State`.** Figma publishes no hover, focus, pressed, disabled, entering, leaving or timed treatment for either variant, and the test suite asserts the absence so none can arrive later as an invention.

The axis is named `State` in Figma but valued `Mobile | Desktop`, so it is a device axis wearing another name. The prop keeps Figma's name.

### Geometry — measured from Figma

|               | mobile              | desktop                    |
| ------------- | ------------------- | -------------------------- |
| Width         | 328                 | 480                        |
| Height        | 40                  | 56                         |
| Radius        | 8                   | 12                         |
| Padding       | 12 inline / 8 block | 16                         |
| Inner padding | 2 block             | —                          |
| Gap           | 8                   | 8                          |
| Icon boxes    | 16                  | 24                         |
| Type          | 12/20 w500          | 16/24 w500                 |
| Shadow        | `elevation-2`       | Figma's `Web`, four layers |

**Width is pinned; height is not.** Figma pins both widths, and the layout needs a definite width to mean anything — the message flexes and the trailing action stays intrinsic. The heights fall out of the padding exactly, `8 + (2 + 20 + 2) + 8 = 40` and `16 + 24 + 16 = 56`, so nothing declares them. `className` overrides the width for a caller who needs the bar to track a container.

The 2px inner padding is mobile-only: on desktop the 24px line height already fills the 24px content box on its own. Both content groups end up 24 tall either way.

Verified in the browser: 328 × 40 and 480 × 56 exactly, radii 8 and 12, padding 8/12 and 16, inner padding 2 on mobile and 0 on desktop, gaps 8, icon boxes 16 and 24, type 12/20 and 16/24 at weight 500 in white.

### Surface

`#252D38` from `bg-semantic-bg-primary-solid`, and white text from `text-semantic-text-white` — both exact.

**Mobile's shadow needs no exception.** Figma binds the effect style `shadow/elevation-2`, and this library's token of that name carries those two layers exactly: `#0000000D` at `(0, 4)` blur 10 and `#0000000A` at `(0, 1)` blur 4. It is the one shadow in the library so far that came back as a clean token match.

**Desktop's does.** Figma binds `Web`: four layers, where every one of the eight elevation tokens is two. Reproduced exactly as a documented exception rather than substituted — see below.

**The 1px stroke is not drawn, and it makes no visual difference.** Figma gives both frames a 1px border bound to `text-primary (900)`, the same `#252D38` as the fill, so it is invisible by construction. It also cannot be a border box: the height arithmetic closes exactly on the padding, so a border would push 40 to 42 and 56 to 58. Drawing it as a ring would mean substituting a same-valued token of another role for its colour — there is no border- or ring-role token at gray/900, only `screen-mockup-border`, whose role is something else entirely — and this library refuses that substitution on principle, exactly as it does for `error/600` and `gray/50`. So the stroke is recorded here rather than rendered, and a test asserts no border appears.

### Visibility

Figma's three booleans are kept as booleans, under Figma's own names, all defaulting to `true`. **Each is gated with its content:**

|         | content given   | no content      |
| ------- | --------------- | --------------- |
| `true`  | part renders    | nothing renders |
| `false` | nothing renders | nothing renders |

The boolean stays authoritative — it can always hide a part that has content — but it cannot conjure a part that has none. No icon artwork and no default copy ship here, so the alternative is a 16px hole in the layout or an empty text node holding open an 8px gap. Same gate UploadModule's affordances use.

The three are independent, and all eight combinations are covered by both the tests and a story. When neither trailing part renders, the trailing group is omitted entirely rather than left as an empty flex item.

### Text behaviour

The message fills whatever the trailing action leaves and **wraps rather than truncating** — Figma sets `word-break: break-word` and no ellipsis, so long copy grows the bar's height. The action is `white-space: nowrap`, which is what makes the message the part that reflows. No truncation is added, because Figma specifies none.

### Icons

Both are caller-supplied, and nothing ships. Figma's default for each instance swap is a plain stroked `circle` — its icon library's placeholder for "an icon goes here" rather than artwork that means anything — so there was nothing to reuse and no reason to add an icon foundation for it. This follows the convention Checkbox's tick and SearchBar's magnifier already set. The slot supplies the size and the colour arrives as `currentColor` from the bar's white text, so a caller's glyph needs neither.

### Accessibility

- **`role="status"`** on the root. A toast that assistive technology never announces is not doing its job, and `status` is the non-interactive role for advisory information — a polite live region. This is an accessibility addition rather than a Figma property, and native props spread after it, so a caller who needs `role="alert"` for something urgent can say so.
- **The leading glyph is `aria-hidden`** — the message carries the meaning.
- **The trailing glyph is not**, deliberately. It is where a dismiss or undo control naturally goes, and `aria-hidden` on the wrapper would bury a caller's `<button>`. A purely decorative glyph should carry its own `aria-hidden`, which is what this library's stories do.
- **No interactive semantics are invented.** The component claims no button role, binds no handler and has no focusable parts. An icon-only control passed as `postIcon` needs its own accessible name.

### Usage

```tsx
<Toast primaryText="Prescription uploaded" />
```

```tsx
// The trailing action is the caller's control, because Figma publishes no handler.
<Toast
  state="desktop"
  leftIcon={<CheckCircleIcon />}
  primaryText="Prescription uploaded"
  postText={
    <button type="button" onClick={undo}>
      Undo
    </button>
  }
  postIcon={
    <button type="button" aria-label="Dismiss" onClick={close}>
      <CloseIcon />
    </button>
  }
/>
```

Do not reach for a `duration` or `position` prop — this component draws the bar and nothing else. Wrap it in whatever your app uses to place and time overlays.

### Token exceptions

Two groups, both narrowly scoped — see `token-usage.policy.ts` for the full reasons.

| Classes                         | Cause                                                                                                                                                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `w-[328px]`, `w-120`            | 480 is the `spacing-120` primitive exactly and is reached through it, but the semantic scale stops at 11xl 160 and cannot carry it — the same wall InputDropdown's menu height hit. 328 is on no step at all. |
| the four-layer `[box-shadow:…]` | Figma's `Web` effect style is four layers; every elevation token is two, and no combination reproduces it.                                                                                                    |

### Deliberate omissions

- **No toast manager.** No `open`, `duration`, `autoDismiss`, `position`, `portal`, `onClose` or animation — Figma publishes none of it, and a test asserts none of it exists.
- **No `intent` or `variant` axis.** Figma draws one surface, `#252D38`, for both states. There is no success, error or warning treatment to expose.
- **No default glyphs.** Figma's `circle` is a placeholder, not artwork.
- **No truncation.** Figma wraps.

---

## Divider

### Overview

A 1px rule between things. Measured from Figma `Divider` (node `4725:3274`) — **8 variants**, `Orientation`(2) × `Style`(2) × `Variant`(2). All 8 are implemented.

**Why it exists:** every layout eventually needs a line between two groups, and without a canonical one each component invents its own — a `border-t` here, an `h-px` div there, each reaching for whichever grey was nearest. This is that line, published once. It is used wherever a layout separates rows in a list, items in a row, or an optional section from a required one.

**One element and three axes.** There is no size, thickness, colour, spacing, inset, length or responsive prop, because Figma publishes none: the line is always 1px, always one of two greys, and always as long as whatever contains it. Spacing _around_ a divider belongs to the layout that places it, not to the rule — which is why there is no margin baked in.

Nothing here is stateful, so the module carries no `'use client'` directive and renders on the server.

### Anatomy

One element. There are no slots, so `className` is the whole override surface and no `classNames` prop exists.

### Props

**Figma's three published properties**, and nothing else:

| Prop          | Type                         | Default        | Figma         |
| ------------- | ---------------------------- | -------------- | ------------- |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | `Orientation` |
| `style`       | `'solid' \| 'dashed'`        | `'solid'`      | `Style`       |
| `variant`     | `'normal' \| 'lighter'`      | `'normal'`     | `Variant`     |

Plus `className`, a `ref` to the root, and native `div` props. **There are no engineering-only props at all** — a rule needs none.

**`style` shadows the native `style` attribute**, which this component therefore does not accept. The name is Figma's, and the trade is a fair one: a design system's rule has no business taking inline CSS, and `className` carries anything `style` would have. This is the one place in the library where a Figma property name displaces a native one, and it is called out on the prop itself.

**`variant` is not a semantic intent.** Figma publishes `Normal` and `Lighter` — two greys — and nothing else. There is no success, warning or error rule to reach for.

### Variants

|       | Normal                | Lighter              |
| ----- | --------------------- | -------------------- |
| Figma | `gray-light-mode/100` | `gray-light-mode/50` |
| Value | `#DBE0E6`             | `#EBEEF1`            |

`Solid` and `Dashed` differ by exactly one thing in Figma: the dash pattern. The exported SVG for a solid rule is the identical `<line>` with the `stroke-dasharray` attribute simply absent.

### Geometry — measured from Figma

**The line is 1px of fill on a zero-thickness box, and Figma's own geometry says so.** Its horizontal frames measure `328 × 0.0000287` and its vertical ones `0.0000143 × 328` — the cross axis is zero, and everything visible is the stroke. That stroke is centred on the zero axis: the export draws `<line y1="0.5" y2="0.5">` in a 1px-tall box with no `stroke-width`, so it defaults to 1 and spans exactly 0→1.

So the thickness arrives as a 1px box that is entirely fill — `h-px` across, `w-px` down — and **nothing carries a border**. That is what keeps a 1px line from becoming a 2px one: a border on a box that already has thickness would draw both. Verified in the browser: all 8 combinations measure exactly 1px on the cross axis with `border-width: 0` on every edge.

**Figma's 328px is a sample frame, not a runtime constraint.** It appears on the _long_ axis in **both** orientations — 328 wide when horizontal, 328 tall when vertical — which is the signature of a canvas size rather than a specification. So:

- **Horizontal** fills its container's width (`w-full`) and is 1px tall.
- **Vertical** fills its parent's height (`h-full`) and is 1px wide. A vertical rule therefore needs a parent with a height — a flex row with `items-stretch`, or an explicit one. Without it, it collapses to nothing.

Nothing pins a length, and `className` sets one for a caller who needs a fixed run.

The rule also carries `shrink-0`, because a 1px flex child is the first thing a crowded row collapses and a divider that vanishes under pressure is worse than one that overflows. It changes no measurement.

### The dashed implementation

Figma publishes `stroke-dasharray="2 2"` — 2px of line, 2px of gap, identical in both orientations.

**CSS `border-dashed` does not reproduce it, and that was measured rather than assumed.** The CSS spec leaves dashed-border geometry to the browser. Rendered against each other over the same 40px, where Figma's pattern gives exactly 10 dashes:

|                           | Dashes over 40px | Period |
| ------------------------- | ---------------- | ------ |
| Figma `2 2`               | 10               | 4px    |
| CSS `1px dashed` (Chrome) | 8                | ~5px   |

Chrome's dashes are half again as long as Figma's. So the pattern is drawn with a `repeating-linear-gradient` using **hard stops** — the colour runs `0 → 2px`, then `transparent` runs `2px → 4px` — which reproduces 2/2 exactly, needs no exported asset, and has no interpolation between the colour and `transparent` and therefore none of the grey fringing a soft stop produces. The gradient runs `to right` when horizontal and `to bottom` when vertical.

Verified in the browser: the computed gradient on all four dashed combinations is `colour 0px, colour 2px, transparent 2px, transparent 4px`.

### Token mapping

| Figma                           | Token                       | Notes                                                   |
| ------------------------------- | --------------------------- | ------------------------------------------------------- |
| `gray-light-mode/100` `#DBE0E6` | `semantic-utility-gray-100` | solid: `bg-*`; dashed: `var(--color-*)` in the gradient |
| `gray-light-mode/50` `#EBEEF1`  | `semantic-utility-gray-50`  | as above                                                |
| 1px stroke                      | `h-px` / `w-px`             | no border-width token is needed or used                 |
| Length                          | `w-full` / `h-full`         | 328 is not baked in                                     |

**Both greys come from `utility-*` rather than the border family, and the reason is that only one of them has a border-role token at all.** `border-tertiary` carries `gray-light-100` for Normal, but nothing in the border family carries `gray-light-50` for Lighter — the gap SearchBar's container stroke already documents. Reaching one through its role and the other through the value family would split a single axis across two families, so both come from `utility-*`, which is the value-addressable family and is already used exactly this way: Tooltip for a text colour, TagCheckbox for a ring.

Both tokens are **theme-aware** — `utility-gray-100` and `utility-gray-50` resolve to `gray-dark-*` under the dark theme — where a raw primitive such as `bg-gray-light-50` would not be.

### Token exceptions

**None.** Every value maps to an existing semantic token or a policy-legal utility: the two greys are semantic tokens, `h-px`/`w-px` and `w-full`/`h-full` are ignored by the token rule, and the gradient names its colour through `var(--color-semantic-utility-gray-*)`, which the policy scans and verifies exactly as it does a class.

### Accessibility

- **`role="separator"`** on the root — the meaning Figma draws, and nothing more. It is presentational and non-interactive: no focus, no handler, no state.
- **`aria-orientation="vertical"`** on the vertical variant only. `separator` is horizontal by default, so stating it on a horizontal rule would be noise.
- Native props spread last, so a **purely decorative** rule can be handed `aria-hidden` or `role="presentation"` by its caller.

### Usage

```tsx
<Divider />
```

```tsx
// Vertical rules fill their parent's height, so the parent has to have one.
<div className="flex h-10 items-stretch">
  <span>Before</span>
  <Divider orientation="vertical" style="dashed" variant="lighter" />
  <span>After</span>
</div>
```

Spacing is the layout's, not the rule's — put margin or gap on the container rather than looking for a prop. Use `className` to pin a length, and `style` for the dash pattern rather than inline CSS, which this component does not take.

### Figma deviations

**None.** All 8 combinations reproduce Figma's measured values exactly — 1px thickness, both greys, the 2/2 dash pattern, and the fill-the-container length that Figma's zero-thickness frames imply.

### Migration

**No existing divider usages required migration.** At the time Divider was added the repository contained no `<hr>`, no `role="separator"`, no `divide-x`/`divide-y`, and no 1px rule drawn as a fill anywhere in the component layer. The only single-edge borders are the two spinner rings in Button and IconButton (`border-t-transparent`), which are not dividers. BeneficiarySelector's `|` is a text character in its metadata row, not a rule.

---

## BottomSheet

Measured from Figma `Bottom Sheet` (node `4751:5485`).

### 1.0 Introduction

#### 1.1 What is it?

A panel that rises from the bottom of the screen over a dimmed background, carrying a title, some content and up to two actions. It is the mobile counterpart to a dialog: the content sits against the bottom edge, within thumb reach, with the page behind it dimmed but still visible.

It is **the sheet as drawn, not a sheet system**. Figma specifies no open state, no animation, no backdrop dismissal, no drag-to-dismiss, no scroll locking and no focus treatment, so none of that is here.

#### 1.2 Where is it used?

Contextual mobile interactions that need a decision without leaving the page — uploading a document, confirming removal of an item from the cart, reporting an issue. The pattern suits a short task with one or two ways out of it.

#### 1.3 Why did we create this?

Because the alternative is every surface inventing its own: a fixed panel here, a rounded card there, each with its own scrim colour, corner radius and handle. Publishing it once fixes the geometry, the scrim, the divider and the footer layout in one place. It also gives the two canonical parts somewhere to be reused — `Divider` under the header and `Button` in the footer — instead of being redrawn.

### 2.0 Construction

#### 2.1 Overall component

Two layers. The **scrim** fills whatever it is placed in and dims what is behind it; the **card** sits against its bottom edge, full width, with only its top corners rounded. Everything else stacks inside the card: a drag handle, a header with a divider beneath it, the content, and an optional footer.

The scrim fills its container rather than pinning Figma's 360 × 780, which is a phone canvas rather than a specification. The caller decides whether that container is a viewport-fixed wrapper, a device frame or a story — which keeps `fixed`, `z-index` and portalling out of a component whose Figma node specifies none of them, and out of a library whose `z-index` foundation is an empty export.

#### 2.2 Construction

| Part       | Figma layer   | Notes                                                                      |
| ---------- | ------------- | -------------------------------------------------------------------------- |
| root       | the symbol    | The scrim: `rgba(0,0,0,0.6)`, clipped, and the card's positioning context. |
| card       | `Bottom Card` | Bottom-aligned, full width, top corners at 24, 24 bottom padding, 24 gap.  |
| dragHandle | `Drag Handle` | 16 a side, 12 above and below — a 28-tall block.                           |
| handle     | `Drag handle` | 40 × 4, fully round. Decorative.                                           |
| header     | `Header`      | The title row over the divider, 16 apart.                                  |
| leftIcon   | `leftIcon`    | 20 square, decorative, caller-supplied.                                    |
| title      | `header`      | 16/24 semibold, one line, truncating.                                      |
| close      | `cancel-01`   | 20 square. A real `<button>`.                                              |
| content    | `Content`     | 16 a side; holds the header block and the body.                            |
| footer     | `_Footer`     | 16 a side, 4 above and below, 8 between, equal-width actions.              |

**Measured geometry**, all verified in the browser against the node:

|                   | Figma                         | Rendered                                 |
| ----------------- | ----------------------------- | ---------------------------------------- |
| Scrim             | 360 × 780                     | 360 × 780                                |
| Card              | bottom-aligned, 360 wide      | bottom offset 0, left offset 0, 360 wide |
| Card radius       | 24 top only                   | `tl24 tr24 br0 bl0`                      |
| Card padding      | 0 top, 24 bottom              | `0` / `24px`                             |
| Card gap          | 24                            | 24                                       |
| Card shadow       | `0 2px 8px #0000000A`         | `rgba(0,0,0,0.04) 0px 2px 8px 0px`       |
| Drag handle block | 28 tall, 16/12 padding        | 28, `12px 16px`                          |
| Handle            | 40 × 4, `#DBE0E6`             | 40 × 4, `rgb(219,224,230)`               |
| Header row gap    | 20                            | 20                                       |
| Icon-to-title gap | 8                             | 8                                        |
| Left icon / close | 20 each                       | 20 × 20 each                             |
| Title             | 16/24 w600 `#252D38`          | 16/24 w600 `rgb(37,45,56)`, ellipsis     |
| Divider           | 328 wide                      | 328 × 1                                  |
| Footer            | 360 × 48, 16/4 padding, 8 gap | same                                     |
| Footer actions    | equal widths                  | 160 / 160                                |

#### 2.3 Properties

**Figma's five published properties.** Four are on the sheet; `type` is published on the nested `_Footer`.

| Prop           | Type                            | Default         | Figma                                                          |
| -------------- | ------------------------------- | --------------- | -------------------------------------------------------------- |
| `header`       | `ReactNode`                     | —               | `header`                                                       |
| `showLeftIcon` | `boolean`                       | `true`          | `showLeftIcon`                                                 |
| `leftIcon`     | `ReactNode`                     | —               | `leftIcon`                                                     |
| `showFooter`   | `boolean`                       | `true`          | `showFooter`                                                   |
| `type`         | `'two-buttons' \| 'one-button'` | `'two-buttons'` | `type`, on `_Footer` — `2 buttons` and `1 button`, kebab-cased |

**Engineering-only**, each required by the architecture rather than speculative:

| Prop         | Why it exists                                                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `children`   | The content block. Figma marks its placeholder "swap me with your custom content", so it is a hole in the design rather than a part of it. |
| `footer`     | The footer's actions. Figma's two `Button CTA`s are sample labels, not design.                                                             |
| `closeIcon`  | Figma draws `cancel-01`; no artwork ships in this library.                                                                                 |
| `closeLabel` | Names the icon-only close button.                                                                                                          |
| `classNames` | Per-slot overrides, one per part above.                                                                                                    |

Plus `className`, a `ref` to the root, and native `div` props.

**No default copy ships.** Figma types "Placeholder content to be replaced" into the title, "Place elements and patterns here" into the content block and "Button CTA" into both actions; all four are placeholder or product copy.

**The two booleans are gated with their content.** `false` never renders its part; `true` renders it only once there is something to put there. No icon artwork and no footer actions ship, so the alternative is a 20px hole beside the title or an empty strip under the content.

### 3.0 How to add

**Adding the component**

```tsx
import { BottomSheet, Button } from '@medibuddy/mozaic';
```

The sheet fills its container, so put it in one that has a size. In an application that is usually a viewport-fixed wrapper, mounted while the sheet is open — mounting and unmounting being how it opens and closes, since the component holds no state of its own:

```tsx
{
  open && (
    <div className="fixed inset-0 z-50">
      <BottomSheet header="Remove from cart" closeLabel="Close" closeIcon={<CloseIcon />}>
        <p>Paracetamol 500mg will be removed from your cart.</p>
      </BottomSheet>
    </div>
  );
}
```

**Configuring the header** — `header` takes a node and truncates to one line, which is what keeps the close button pinned rather than pushed off the edge.

**The optional left icon** — pass `leftIcon`; `showLeftIcon` turns it off without removing it. Both must be satisfied for the glyph to render.

**Enabling and disabling the footer** — `showFooter` gates it, and `footer` supplies the actions. With either missing, the card ends after the content and keeps its 24 bottom padding.

**Providing custom content** — anything passed as `children` becomes the body, full width inside the 16px inset. Nothing renders there otherwise.

**Providing footer actions** — pass `Button`s; the row sizes them, so they need no `fullWidth` or `flex` of their own. Pass one for `type="one-button"` and it spans the row; pass two for `type="two-buttons"` and they share it equally:

```tsx
footer={
  <>
    <Button variant="secondary" onClick={close}>Cancel</Button>
    <Button onClick={confirm}>Remove</Button>
  </>
}
```

### Accessibility

- **No `dialog` role.** `role="dialog"` with `aria-modal` promises focus containment this component does not implement, and the scrim is decoration rather than the thing being described. A caller building real modal behaviour adds those semantics along with the focus trap that makes them true — native props spread last, so `role`, `aria-modal` and `aria-label` all pass straight through.
- **The close is a real `<button type="button">`** with the shared focus ring, named by `closeLabel` — but Figma publishes no behaviour behind it, so the element is drawn and nothing more. There is deliberately **no `onClose`**: adding one would be inventing dismissal the design does not specify. Wiring it, along with mounting, focus and unmounting, belongs to the consuming application.
- **The drag handle and the left icon are `aria-hidden`** — both are decoration, and the handle does not make the sheet draggable.

### Token mappings

| Figma                             | Token                                                                                                               |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| white                             | `bg-semantic-bg-primary`                                                                                            |
| `#252D38` title                   | `text-semantic-text-primary`                                                                                        |
| `#DBE0E6` handle                  | `bg-semantic-utility-gray-100`                                                                                      |
| radius 24                         | `rounded-t-4xl`                                                                                                     |
| 4 / 8 / 12 / 16 / 20 / 24 spacing | `semantic-xs` / `md` / `lg` / `xl` / `2xl` / `3xl`                                                                  |
| handle 40 × 4                     | `w-semantic-5xl` / `h-semantic-xs`                                                                                  |
| icons 20                          | `size-semantic-2xl`                                                                                                 |
| title 16/24 semibold              | `text-mobile-heading-sm font-semibold`                                                                              |
| divider                           | the canonical `Divider`                                                                                             |
| footer buttons                    | the caller's `Button size="md"` — Figma's 16/8 padding, radius 8 and 14/20 text are exactly what `md` already draws |

### Token exceptions

Two, both narrowly scoped — see `token-usage.policy.ts` for the full reasons.

| Class                                    | Cause                                                                                                                                                                                                                                                                       |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bg-base-black/60`                       | No semantic token resolves to black. `bg-overlay` is the semantically right name carrying the wrong value — `gray-light-900`, and opaque — so tinting it to 60% would be a different colour, not a near miss. The only tokens reaching `base-black` are `social-icon-fg-*`. |
| `[box-shadow:0px_2px_8px_0px_#0000000a]` | Figma's `Drop shadow/Normal` is one layer; all eight elevation tokens are two, and the nearest pairs that offset with a 4px blur plus a second layer.                                                                                                                       |

### Design decisions taken

**Figma property mapping.** All five published properties are kept under Figma's own names. Only the `type` values are normalised — `2 buttons` → `two-buttons` and `1 button` → `one-button` — which is how every enum value in this library is written. Both published variants are implemented.

**Why both `type` values resolve to the same classes.** Figma's `_Footer` component set (node `4751:5477`) publishes `Type=2 buttons` and `Type=1 button`, and their rows are byte-identical: same 16 inline padding, 4 block padding, 8 gap and white surface. They differ only in how many buttons sit inside, and since every footer button is `flex: 1 0 0`, one action spans the full 328 and two share it equally — one rule covers both. The axis is still declared rather than dropped, because it is published and it is what a reader checks the row against.

**Composition strategy.** Figma's generated code inlines `Footer` and `ContentBlockPlaceholder` as nested pieces with hardcoded copy. Neither is reproduced that way. The content block is a hole — Figma marks it "swap me with your custom content" — so it takes `children`, and the footer takes the caller's actions while the row supplies Figma's layout. That is what keeps "Button CTA" and "Place elements and patterns here" out of the published API.

**Reuse of canonical Divider and Button.** The divider is the `Divider` component, not another 1px line; the footer actions are the caller's `Button`s, and `md` already matches Figma's footer button exactly. Nothing about either is re-implemented.

**Placeholder content strategy.** Nothing renders in the content area unless the caller fills it. The dashed placeholder exists in the stories only, so the sheet reads against the Figma frame without the library shipping a frame nobody asked for.

**No close handler.** Figma renders the close as a `<button>`, which is why the element is reproduced, but rendering a button is not the same as publishing a behaviour: no handler, open state, backdrop dismissal or escape handling appears in the node, so none appears here. The component stays presentational and the consuming application owns the interaction.

**What intentionally differs from the generated code.** The scrim fills its container instead of `w-[360px] h-[780px]`; the card is `w-full` rather than a centred 360; the close is a real button with a focus ring and an accessible name; and no `data-node-id` attributes reach the DOM.

### Figma deviations

**One, and it is a layout consequence rather than a visual one.** Figma's divider frame is `0.0000287` tall with its 1px stroke painted outside the box, so it contributes nothing to the stack; the canonical `Divider` is a real 1px box, so it contributes 1px. The card therefore measures 253 where Figma's measures 252, with the line itself identical at 1px. Reproducing Figma's zero-height frame would mean a line that overflows its own box, which is the fragile version of the same picture.

Everything else matches exactly.

---

## Modal

Measured from Figma `Modal` (node `4792:13831`) and its nested `_Modal card` (node `4792:13743`).

### 1.0 Introduction

#### 1.1 What is it?

A centred card over a dimmed screen, carrying a heading, some content and up to two actions. It is the desktop counterpart to `BottomSheet`: the same job — take a decision without leaving the page — drawn as a card in the middle of the viewport rather than a panel against its bottom edge.

It is **the modal as drawn, not a modal system**. Figma specifies no open state, no animation, no backdrop dismissal, no focus treatment and no z-index, so none of that is here.

#### 1.2 Where is it used?

Interruptions that need an answer: confirming a destructive action, reporting the outcome of one, or collecting a short piece of input. `icon+text` reports, `text only` confirms, and `custom` holds whatever the surface needs.

#### 1.3 Why did we create this?

Because the alternative is every surface inventing its own centred card, each with its own width, scrim colour, corner radius and footer layout. Publishing it once fixes the geometry, the scrim, the divider and the footer in one place, and gives the two canonical parts somewhere to be reused — `Divider` under the header and `Button` in the footer — instead of being redrawn.

### 2.0 Construction

#### 2.1 Overall component

Two layers. The **scrim** fills whatever it is placed in and dims what is behind it; the **card** is centred in it on both axes. Everything else stacks inside the card: a `Top section` holding the header and the body, and an optional footer 40 (desktop) or 24 (mobile) below it.

The scrim fills its container rather than pinning Figma's 1920 × 1080 or 360 × 780, which are screen canvases rather than a specification. The caller decides whether that container is a viewport-fixed wrapper, a device frame or a story — which keeps `fixed`, `z-index` and portalling out of a component whose Figma node specifies none of them, and out of a library whose `z-index` foundation is an empty export.

**One component, not two.** `_Modal card` carries the underscore Figma reserves for internal parts, the same one on `_Footer` and `_Content Block Placeholder`. The modal is a scrim plus a centred card, so splitting them would export a private part and duplicate the card's 3 × 2 table. `ModalCard` is therefore not exported.

#### 2.2 Construction

| Part         | Figma layer   | Notes                                                                      |
| ------------ | ------------- | -------------------------------------------------------------------------- |
| root         | the symbol    | The scrim: `rgba(0,0,0,0.6)`, clipped, and the card's positioning context. |
| card         | `_Modal card` | Centred both axes. 16 radius, `elevation-4`, a 1px inside stroke.          |
| header       | `Header`      | The title row over the divider — 16 apart on desktop, 12 on mobile.        |
| icon         | `circle`      | 28 desktop / 24 mobile, decorative, caller-supplied. Titled types only.    |
| heading      | `heading`     | Centred body text on `icon+text`; a truncating title on the other two.     |
| close        | `cancel-01`   | 28 desktop / 24 mobile. A real `<button>`.                                 |
| illustration | `Icon`        | 120 desktop / 80 mobile, decorative. `icon+text` only, caller-supplied.    |
| subText      | `Sub text`    | The light secondary line under an `icon+text` heading.                     |
| text         | `Sub text`    | The body paragraph of `text only` — same layer, a different text style.    |
| content      | `Content`     | The body block: illustration and lines, or the paragraph.                  |
| footer       | `_Footer`     | 16 between equal-width actions, on a white strip.                          |

**Measured geometry**, all six variants verified in the browser against the node:

|                  | Figma `icon+text`  | Rendered             | Figma `text only` | Rendered            | Figma `custom` | Rendered         |
| ---------------- | ------------------ | -------------------- | ----------------- | ------------------- | -------------- | ---------------- |
| Card, desktop    | 400 wide           | 400                  | 400 wide          | 400                 | no width set   | hugs its content |
| Card, mobile     | 328 wide           | 328                  | 328 wide          | 328                 | no width set   | hugs its content |
| Card padding     | 32 / 24 · 24 / 16  | `32px` / `24px`      | same              | same                | same           | same             |
| Card gap         | 40 · 24            | 40 · 24              | 40 · 24           | 40 · 24             | 40 · 24        | 40 · 24          |
| Top section gap  | 24 · 4             | 24 · 4               | 24 · 16           | 24 · 16             | 32 · 16        | 32 · 16          |
| Header gap       | 16 · 12            | 16 · 12              | 16 · 12           | 16 · 12             | 16 · 12        | 16 · 12          |
| Header row gap   | 24 · 16            | 24 · 16              | 24 · 16           | 24 · 16             | 24 · 16        | 24 · 16          |
| Title & icon gap | — (no title)       | —                    | 8 · 4             | 8 · 4               | 8 · 4          | 8 · 4            |
| Glyph boxes      | close only, 28· 24 | 28 × 28 · 24 × 24    | 28 · 24, both     | two at each         | 28 · 24, both  | two at each      |
| Illustration     | 120 · 80           | 120 × 120 · 80× 80   | hidden            | not rendered        | hidden         | not rendered     |
| Content gap      | 24 · 12            | 24 · 12              | 12 · 12           | 12 · 12             | — (caller's)   | —                |
| Text group gap   | — · 8              | — · 8                | —                 | —                   | —              | —                |
| Divider          | hidden             | not rendered         | full width        | 352 × 1 · 296 × 1   | full width     | full width × 1   |
| Footer gap       | 16                 | 16                   | 16                | 16                  | 16             | 16               |
| Footer actions   | equal widths       | 168 / 168 · 140 /140 | equal widths      | 168 / 168 · 140/140 | equal widths   | equal            |

Shared across all six, measured: card radius `16px`; card surface `rgb(255,255,255)`; card stroke `rgb(219,224,230)` painted **inside**; card shadow `rgba(0,0,0,0.06) 0 8px 20px` + `rgba(0,0,0,0.12) 0 24px 60px`, which is `shadow/elevation-4` exactly; scrim `oklab(0 0 0 / 0.6)`; and the card centred to the pixel — 80 / 80 and 50 / 50 in a 560 × 520 frame, 16 / 16 and 120 / 120 in a 360 × 520 one.

**Typography**, measured:

| Layer               | Desktop                     | Mobile                      |
| ------------------- | --------------------------- | --------------------------- |
| `icon+text` heading | 20/28 w600 `rgb(37,45,56)`  | 14/20 w600 `rgb(37,45,56)`  |
| titled heading      | 24/36 w600, ellipsis        | 16/24 w600, ellipsis        |
| sub-text            | 16/24 w300 `rgb(71,86,106)` | 12/20 w300 `rgb(71,86,106)` |
| body text           | 20/28 w400 `rgb(37,45,56)`  | 14/20 w400 `rgb(37,45,56)`  |

#### 2.3 Properties

**Figma's eight published properties**, two of them the variant axes.

| Prop           | Type                                     | Default       | Figma                                                         |
| -------------- | ---------------------------------------- | ------------- | ------------------------------------------------------------- |
| `device`       | `'desktop' \| 'mobile'`                  | `'desktop'`   | `Device`                                                      |
| `type`         | `'icon-text' \| 'text-only' \| 'custom'` | `'icon-text'` | `type`, on `_Modal card` — `icon+text`, `text only`, `custom` |
| `heading`      | `ReactNode`                              | —             | `heading`                                                     |
| `showSubText`  | `boolean`                                | `true`        | `showSubText`                                                 |
| `subText`      | `ReactNode`                              | —             | `subText`                                                     |
| `text`         | `ReactNode`                              | —             | `text`                                                        |
| `showLeftIcon` | `boolean`                                | `true`        | `showLeftIcon`                                                |
| `icon`         | `ReactNode`                              | —             | `icon`                                                        |

**Engineering-only**, each required by the architecture rather than speculative:

| Prop           | Why it exists                                                                                                                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `illustration` | Figma draws artwork above an `icon+text` heading but binds **no published property** to that layer, so it can only be changed by editing the file. No artwork ships, so it arrives from the caller. |
| `children`     | The `custom` body. Figma marks its placeholder "swap me with your custom content", so it is a hole in the design rather than a part of it.                                                          |
| `footer`       | The footer's actions. Figma's two `Button CTA`s are sample labels, not design.                                                                                                                      |
| `closeIcon`    | Figma draws `cancel-01`; no artwork ships in this library.                                                                                                                                          |
| `onClose`      | The one notification the parent needs to own visibility. **It notifies; it does not dismiss** — see 4.0.                                                                                            |
| `closeLabel`   | Names the icon-only close button.                                                                                                                                                                   |
| `classNames`   | Per-slot overrides, one per part above.                                                                                                                                                             |

Plus `className`, a `ref` to the root, and native `div` props.

**Parallel props, not a discriminated union.** `type` selects the layout and the props that do not belong to it are ignored rather than rejected — passing `text` to an `icon+text` modal is legal and renders nothing. This is the shape `InputDropdown` and `UploadModule` already use, for the same reason: a union turns every optional prop into a type error at the call site the moment `type` is a variable.

**No default copy ships.** Figma types "This is a placeholder Heading text, to be replaced" into the heading, lorem ipsum into the body, "Place elements and patterns here" into the content block and "Button CTA" into both actions. All of it is placeholder or product copy.

**The two booleans are gated with their content.** `false` never renders its part; `true` renders it only once there is something to put there. No icon artwork ships, so the alternative is an empty box beside the title.

### 3.0 How to add

**Adding the component**

```tsx
import { Modal, Button } from '@medibuddy/mozaic';
```

The modal fills its container, so put it in one that has a size. In an application that is usually a viewport-fixed wrapper, mounted while the modal is open — **mounting and unmounting is how it opens and closes**, since the component holds no state of its own:

```tsx
{
  open && (
    <div className="fixed inset-0 z-50">
      <Modal
        type="text-only"
        heading="Delete this report?"
        text="This removes the report from every dashboard it appears on."
        icon={<InfoIcon />}
        closeIcon={<CloseIcon />}
        closeLabel="Close"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button size="lg" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="lg" tone="error" onClick={confirm}>
              Delete
            </Button>
          </>
        }
      />
    </div>
  );
}
```

**Choosing a layout** — `icon+text` reports an outcome: an illustration over a centred heading and an optional sub-text, with no header title and no divider. `text only` confirms: a titled header with an optional leading glyph, a divider, and one paragraph. `custom` keeps that header and hands the body to you.

**Choosing a device** — `device` is a real axis, not a scale factor: the two differ in width, padding, every gap, both glyph sizes and every type step. Pick it from your own breakpoint; the component does no matching of its own.

**The illustration** — pass `illustration`; it is sized by the slot (120 desktop, 80 mobile) and hidden from assistive technology. Nothing is rendered without it.

**The optional leading icon** — pass `icon`; `showLeftIcon` turns it off without removing it. Both must be satisfied for the glyph to render, and it appears on the titled types only.

**Providing custom content** — anything passed as `children` becomes the `custom` body, full width. Nothing renders there otherwise.

**Providing footer actions** — pass `Button`s; the row sizes them, so they need no `fullWidth` or `flex` of their own. One spans the row, two share it equally. Use `size="lg"` on desktop and `size="md"` on mobile.

### 4.0 Visibility

**The modal draws; the parent owns visibility.** There is deliberately no `open`, no `defaultOpen`, no internal state, no portal, no `container`, no focus trap, no focus restoration, no escape-key dismissal, no backdrop dismissal, no z-index handling and no animation. Figma publishes none of them, and this library has no overlay, portal or dialog architecture to inherit one from.

`onClose` **only notifies.** It fires when the close button is pressed and nothing in this component acts on it: the modal stays mounted, and a parent that ignores the call keeps seeing it. Unmounting is the parent's job:

```tsx
const [open, setOpen] = useState(false);

{
  open && <Modal onClose={() => setOpen(false)} /* … */ />;
}
```

It does not fire on a scrim click, on a card click, or on Escape — none of those is published, so none is wired.

### Accessibility

- **No `dialog` role.** `role="dialog"` with `aria-modal` promises focus containment this component does not implement, and the scrim is decoration rather than the thing being described. A caller building real modal behaviour adds those semantics along with the focus trap that makes them true — native props spread last, so `role`, `aria-modal` and `aria-label` all pass straight through.
- **The close is a real `<button type="button">`** with the shared focus ring, named by `closeLabel`. The focus ring is the one treatment here Figma does not draw: a focusable control without a visible focus state is a defect.
- **The leading icon and the illustration are `aria-hidden`** — both are decoration.
- **The titled heading truncates to one line**, which is what keeps the close button pinned rather than pushed off the card.

### Token mappings

| Figma                                  | Token                                                        |
| -------------------------------------- | ------------------------------------------------------------ |
| white                                  | `bg-semantic-bg-primary`                                     |
| `#252D38` heading and body             | `text-semantic-text-primary`                                 |
| `#47566A` sub-text                     | `text-semantic-text-secondary`                               |
| `#DBE0E6` card stroke                  | `inset-ring-semantic-border-tertiary`                        |
| radius 16                              | `rounded-2xl`                                                |
| `shadow/elevation-4`                   | `shadow-elevation-4` — both layers, exactly                  |
| 4 / 8 / 12 / 16 / 24 / 32 / 40 spacing | `semantic-xs` / `md` / `lg` / `xl` / `3xl` / `4xl` / `5xl`   |
| icons 24 (mobile)                      | `size-semantic-3xl`                                          |
| illustration 80 (mobile)               | `size-semantic-8xl`                                          |
| desktop heading 24/36 semibold         | `text-desktop-heading-sm font-semibold`                      |
| mobile heading 16/24 semibold          | `text-mobile-heading-sm font-semibold`                       |
| body 20/28 · 14/20 regular             | `text-desktop-body-md` / `text-mobile-body-md` `font-normal` |
| sub-text 16/24 · 12/20 light           | `text-desktop-body-sm` / `text-mobile-body-sm` `font-light`  |
| divider                                | the canonical `Divider`                                      |
| footer buttons                         | the caller's `Button` — `lg` on desktop, `md` on mobile      |

### Token exceptions

Four causes, all narrowly scoped — see `token-usage.policy.ts` for the full reasons. Only one is new: three were already documented by another component and Modal reaches them through the same entry.

| Class                       | Cause                                                                                                                                                                                                                   |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bg-base-black/60`          | No semantic token resolves to black. `bg-overlay` is the right name carrying the wrong value — `gray-light-900`, and opaque. Shared with `BottomSheet`, which reached it first.                                         |
| `w-[328px]`                 | 328 is on no step at all, primitive or semantic. Shared with `Toast`, which reached it first.                                                                                                                           |
| `w-[400px]`, `size-[120px]` | The desktop card width and the desktop illustration. 400 is 25rem, between the 24rem and 30rem primitives; 120 is on no scale at all. Their mobile counterparts need none — 328 is documented and 80 is `semantic-8xl`. |
| `size-[28px]`               | Both desktop glyph boxes. 28 is `spacing-7`, and the scale runs 6 straight to 8. Shared with `SearchBar`, which reached it first.                                                                                       |

### Design decisions taken

**Figma property mapping.** All eight published properties are kept under Figma's own names. Only the `type` values are normalised — `icon+text` → `icon-text`, `text only` → `text-only` — which is how every enum value in this library is written. All six variants are implemented.

**One exported component.** `_Modal card` is Figma's private part, so it is internal here too and `ModalCard` is not exported. Splitting it would publish a private name and duplicate the 3 × 2 table across two components.

**Three layouts, not three skins.** The types differ in which parts exist, not in how they are painted: `icon+text` has no header title and no divider and does have an illustration; the other two have a titled header with a divider and no illustration. That is why the props are parallel and ignored rather than rejected.

**The layer name is not the property name.** Figma draws both the `icon+text` sub-text and the `text only` paragraph on a layer called `Sub text`, with different text styles per variant — 16/24 light against 20/28 regular on desktop. The published properties are `subText` and `text`, and those are the names used here.

**Composition strategy.** Figma's generated code inlines `_Footer` and `_Content Block Placeholder` with hardcoded copy. Neither is reproduced that way: the content block is a hole, so it takes `children`, and the footer takes the caller's actions while the row supplies Figma's layout. That is what keeps "Button CTA" and "Place elements and patterns here" out of the published API.

**Reuse of canonical Divider and Button.** The divider under the titled headers is the `Divider` component, not another 1px line; the footer actions are the caller's `Button`s.

**An inside stroke, not a border.** Figma's frame heights (452, 300, 312, 204, 252, 192) are auto-layout heights that its inside-aligned 1px stroke does not contribute to, so a CSS border would add 2px to every card. `inset-ring` paints inside and costs no layout.

**No close behaviour beyond the notification.** Figma renders the close as a `<button>`, which is why the element is reproduced, but rendering a button is not the same as publishing a behaviour. `onClose` exists because the parent has to be told the press happened in order to unmount; nothing beyond that is invented.

**What intentionally differs from the generated code.** The scrim fills its container instead of pinning a screen canvas; the stroke is an inset ring; the close is a real button with a focus ring and an accessible name; `justify-end` is carried only on `icon+text`, where it is the thing that pushes the lone close to the end (Figma writes it on `text only` Desktop too, but the `flex-1` title cluster makes it a no-op there, and `custom` Mobile omits it); and no `data-node-id` attributes reach the DOM.

### Figma deviations

**Three, all recorded rather than silently absorbed.**

**1. Footer button height, on desktop only.** Figma's three Desktop variants draw the button `px-18 py-12` with 16/24 text — 48 tall. This library's `Button` has no such size: `lg` is 44. The decision taken was to use the published sizes rather than add a Modal-specific button, so every desktop footer measures 44 against Figma's 48. Widths and the gap are exact.

**Mobile is not affected.** Figma draws `icon+text` and `text only` at `px-16 py-8` with 14/20 text — 40 tall, which is `Button size="md"` exactly, and what both render. Only Mobile `custom` differs, which is deviation 2.

Figma's own `Buttons/Button` description publishes the same mapping, which is what the chosen sizes follow:

> for mobile - xs to md (use md for main CTAs)
>
> for desktop - lg to 2xl

Card heights follow from this and from Figma's placeholder copy, and the arithmetic closes on every variant. Desktop `icon+text` renders 420 against 452 drawn: 4 of the 32 is the button, and 28 is Figma's placeholder heading wrapping to two lines. Mobile `text only` renders 185 against 204: 20 is the placeholder body wrapping to two lines, and the remaining 1 back is the `Divider` deviation already recorded under [BottomSheet](#bottomsheet) — Figma's divider frame is `0.0000287` tall with its stroke painted outside the box, while the canonical `Divider` is a real 1px box.

**2. The Mobile `custom` button.** Figma draws it at the Desktop dimensions — `px-18 py-12`, 16/24 text — identical to the Desktop variants, a step larger than the other two Mobile variants of the same component, and outside the range Figma's own Button description gives for mobile.

> The Mobile `custom` variant uses the standard Mobile Button `md` size for consistency with the other Modal variants, even though the current Figma reference shows the Desktop button dimensions.

**3. `custom` is capped at its container.** Figma sets no width on `custom`; its 250 and 234 frames are what its own placeholder happens to hug to, so the card here hugs too. But a hugging box is sized from its content's _minimum_ width, and the heading is `truncate` — `white-space: nowrap` — so its minimum is the whole untruncated line. Uncapped, a `custom` card with a long heading measured 380.63 in a 360 frame and hung off both edges. `max-w-full` caps it, which makes the heading truncate at the container edge exactly as it does on the fixed-width variants. Nothing else about the hug changes: a short heading still gives a narrow card.

Everything else matches exactly.

---

## Frontend repository alignment

Avatar and SearchBar are aligned with the MediBuddy frontend repository
(`libs/ui-kit/{ui,util}` — Nx, Next.js, Tailwind v3, Radix, tsup). The split is deliberate:
**that repository is the authority on engineering conventions, Figma on visual values.**

### Adopted

| Convention                         | Where it came from                         | Applied                                                                             |
| ---------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------- |
| `"use client"` on every component  | 121 files across `src/lib/ui`              | Both — a stateful component imported into a Next server component throws without it |
| `React.forwardRef` + `displayName` | `Button`, `Input`, every flat component    | Both, replacing React 19's ref-as-prop, which needs React 19 on the consumer        |
| `constants.ts` per component       | `HOSPITAL_DOCTOR_SEARCH_CONSTANTS`         | Both: `ARIA_LABELS`, `TEXT`, `ROLES`, `MOTION`                                      |
| Sub-components in `components/`    | `DoctorCard`, `HospitalDoctorSearch`       | `SearchBar/components/SearchBarPlaceholder.tsx`                                     |
| `types.ts` for the public surface  | 17 components                              | `SearchBar/types.ts`                                                                |
| framer-motion for motion           | `AnimatedRotatingText`                     | SearchBar's word stack                                                              |
| `intervalMs` prop name             | `AnimatedRotatingText`                     | SearchBar, replacing `animationInterval`                                            |
| `data-*` state attributes          | Radix, which the repo builds on throughout | `data-active-type` on the animated window                                           |
| `cn` = `clsx` + `twMerge`          | `@medibuddyweb/ui-kit-util`                | Already identical — nothing to change                                               |

### Deliberately not adopted

| Their pattern                               | Why not                                                                                                                                                                                                 |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mb-gray-*` / `DESIGN_TOKENS` (`rem-16.25`) | A flat bag of value-named rems and a palette with duplicated steps (`#252D38` at `mb-gray-800`, `-920` and `-998`; zero `semantic` aliases). Mozaic's generated tokens stay the source of design values |
| Their `Input` primitive                     | `any`-typed `setInputValue`/`setErrorMessage` props and raw `blue-600`/`gray-300` utilities; composing it would break both Figma parity and the token rule                                              |
| Fluid `autoScale` type instead of `device`  | `body-m` resolves to 14/20 at 352px and 20/28 at 1920px — Figma's Mobile and 1920 exactly — but **17.55/24.73 at 1280 where Figma publishes 16/24**                                                     |
| `AnimatedRotatingText` wholesale            | Its ±15px opacity fade mounts one word at a time; Figma stacks four behind a one-line clip and moves them by a measured pitch. Its library and API names are adopted, its mechanism is not              |
| Remote CDN artwork                          | Figma publishes the thirteen Avatar relationships and the Verified seal _inside_ `Avatar_user`, making them design-system content. They stay bundled with geometry and `fill="none"` intact             |
| `title: "UI/X"`, `stories/` subfolder       | `architecture.test.ts` enforces `Components/X` and a flat layout, and every component already conforms                                                                                                  |

### Consuming Mozaic from a Tailwind v3 app

The frontend repository is **Tailwind v3 with a JS config**; Mozaic is **v4 CSS-first
`@theme`**. That difference does not matter for utility resolution, because **the host app's
Tailwind never resolves a Mozaic class name.** This package compiles its own utilities at
its own build time and ships them as plain CSS — semantic tokens, arbitrary values, and
`inset-ring`, which has no v3 equivalent, all arrive as finished rules plus the 38
`@property --tw-*` registrations they depend on. No v3 preset is needed, and none should be
written.

Two things _did_ need solving, both measured in a browser against a v3 preflight rather than
reasoned about.

#### 1. Which stylesheet to import

|                                   | Contents                                           | Use when                                                                                       |
| --------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `@medibuddy/mozaic-ui/styles.css` | theme + **preflight** + utilities, layered         | Mozaic is the page's only styling layer — Storybook, a docs site, an app with no framework CSS |
| `@medibuddy/mozaic-ui/embed.css`  | theme + utilities, **no preflight**, **unlayered** | The app already has a reset — including the frontend repository                                |

Tailwind's preflight rewrites the **host page**: `html { font-family; line-height: 1.5 }`,
`-webkit-text-size-adjust`, `tab-size`, and a `*, ::before, ::after` reset. Since this
package points `--font-sans` at Lexend Deca, importing `styles.css` into an app that has its
own reset would silently change that app's global font and fight its preflight. `embed.css`
emits no `html`, `:host` or `body` rule at all.

**`embed.css` assumes the host supplies a reset**, which the frontend repository does. The
two rules our components actually depend on are `box-sizing: border-box` (without it a
Mobile Search Bar measures 360×44 instead of 328×44, because the padding stops being
included) and `margin: 0` on form controls. Without any reset at all, the geometry is wrong.

#### 2. `embed.css` is unlayered on purpose

Tailwind v3 emits its preflight as plain **unlayered** rules, and in the CSS cascade
unlayered author declarations beat every layered one _regardless of import order_. While
`embed.css` wrapped its utilities in `layer(utilities)`, the host's
`input { font-size: 100%; font-family: inherit }` won over `text-mobile-body-md` and the
field rendered in the host's default face at 16px instead of Figma's 14/20. Unlayered, the
contest is specificity instead, and a class (0,1,0) beats an element selector (0,0,1).

`architecture.test.ts` asserts both properties — no preflight, no `layer()` — so neither can
be undone quietly.

#### 3. Text-bearing roots state their own family

`font-family` is inherited, so with no preflight a component inherits whatever the host uses
— measured as Georgia against a host app whose body font is Georgia. The dividing line is
whether a component renders text of its own, which the **type ramp settles objectively**: a
component with no `text-mobile-*` / `text-desktop-*` token draws no text and needs no family.

| Component      | Type-ramp tokens | Renders text                               | `font-sans` on root |
| -------------- | ---------------- | ------------------------------------------ | ------------------- |
| Avatar         | 4                | initials                                   | yes                 |
| Button         | 2                | label                                      | yes                 |
| Checkbox       | 2                | label + description                        | yes                 |
| Input          | 4                | label, value, hint, leading text           | yes                 |
| InputDropdown  | 5                | label, value, hint, menu rows              | yes                 |
| OtpInput       | 3                | label, digits, hint                        | yes                 |
| Radio          | 2                | label + description                        | yes                 |
| SearchBar      | 3                | placeholder halves, value                  | yes                 |
| Tag            | 3                | label, count                               | yes                 |
| Textarea       | 4                | label, value, hint                         | yes                 |
| Toggle         | 2                | label + supporting text                    | yes                 |
| **IconButton** | **0**            | none — caller glyph, named by `aria-label` | **no**              |

It goes on the **root** only, and children inherit from there. `action-surface.ts` is shared
by Button _and_ IconButton, so the family sits on Button's root rather than in the shared
surface, where it would give IconButton a family it has no text to use.
`font-family.test.ts` asserts both lists _and_ that the split still matches which components
use a type-ramp token, so a component that gains or loses text moves lists with it.

#### What `embed.css` requires from the host

Verified by loading it with no reset at all: the two rules that matter are
`box-sizing: border-box` (without it a Mobile Search Bar measures 360×44 instead of 328×44,
because padding stops being included) and `margin: 0` on form controls. Every mainstream
reset provides both, including the Tailwind v3 preflight the frontend repository already
ships. Nothing else in the preflight is load-bearing for these components.

Two preflight-derived values reach components _harmlessly_: inherited `line-height` and
inherited `color` land on wrappers, icon boxes and SVG nodes that set neither. No rendered
text is affected, because every type-ramp token pairs a size **and** a line height, and every
text element sets its own colour.

#### Verified in a host-app simulation

A host page was built with everything deliberately unlike Mozaic — Georgia as its body
family, `line-height: 1.7`, its own colour and background, its own button/input rules, its
own image rules, and a Tailwind v3-style preflight — then every one of the 12 components was
rendered twice: once under `styles.css`, once under host CSS + `embed.css`, comparing 15
computed properties per element with `document.fonts.ready` awaited on both sides.

**Result: across every leaf text element in all 12 components, zero differences** in
family, size, line-height, weight, colour or letter-spacing. The only residual diffs are
`w-full` elements measuring exactly +32px wider, which is Storybook's own `layout: padded`
being absent from the second pass — a harness artifact, not a component one.

**And the host page is untouched:** its heading, paragraph, button, input, card, image and
list are byte-identical before and after `embed.css` is added, Georgia and its own colour
intact.

One trap worth recording: an earlier run of this same harness reported text widths shifting
by 3–8px on nine components. That was the harness measuring before the re-injected base64
webfont had finished loading. `await document.fonts.ready` removed every one of those
differences. A font-swap artifact and a real regression look identical in a single
measurement.

The one global thing `embed.css` still carries is Tailwind's `@layer properties` fallback,
which initialises `--tw-*` custom properties on every element for browsers without
`@property`. It sets no visual property, and an app running Tailwind emits the same block
itself.
