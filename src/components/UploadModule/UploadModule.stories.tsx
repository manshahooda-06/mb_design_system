import type { Meta, StoryObj } from '@storybook/react-vite';
import { UploadModule } from './UploadModule';
import { UPLOAD_MODULE_SIZES, UPLOAD_MODULE_STATES } from './constants';

const LABEL = 'Upload New Prescription';

/*
 * Figma's own glyphs, story-only.
 *
 * The paths are `upload-04`, `eye` and `delete-02` exactly as Figma exports them, with
 * the hardcoded stroke swapped for `currentColor` so the component's slot supplies the
 * colour. They live here rather than in the library because every recognisable glyph in
 * Mozaic is caller-supplied — SearchBar's stories define their magnifier the same way.
 */
const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path
      d="M9.5 6.75L12 4.25L14.5 6.75M12 14.25V4.85878M20 16.75L19.7785 18.0788C19.6178 19.0432 18.7834 19.75 17.8057 19.75H6.19425C5.21658 19.75 4.3822 19.0432 4.22147 18.0788L4 16.75"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const EyeIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path
      d="M13.3333 5.86692C13.3333 5.86692 10.9455 3.20025 8 3.20025C5.05448 3.20025 2.66667 5.86692 2.66667 5.86692M2.66667 9.06692C3.43004 7.8839 5.37958 5.33359 8 5.33359C10.6204 5.33359 12.57 7.8839 13.3333 9.06692C12.57 10.2499 10.6204 12.8003 8 12.8003C5.37958 12.8003 3.43004 10.2499 2.66667 9.06692ZM9.6 9.06692C9.6 8.18327 8.88366 7.46692 8 7.46692C7.11634 7.46692 6.4 8.18327 6.4 9.06692C6.4 9.95058 7.11634 10.6669 8 10.6669C8.88366 10.6669 9.6 9.95058 9.6 9.06692Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DeleteIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path
      d="M12.4999 4.1L11.9682 12.8726C11.9298 13.506 11.4049 14 10.7704 14H5.22934C4.59479 14 4.06993 13.506 4.03154 12.8726L3.49987 4.1M10.3999 4.1H13.3999M10.3999 4.1L9.65572 2.36365C9.56117 2.14304 9.34425 2 9.10423 2H6.89551C6.65549 2 6.43857 2.14304 6.34402 2.36365L5.59987 4.1M10.3999 4.1H5.59987M2.59987 4.1H5.59987M6.49987 10.7L6.49987 7.1M9.49987 10.7V7.1"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/*
 * A stand-in for the uploaded file.
 *
 * Figma's Display frames are filled with a placeholder photograph of a prescription,
 * which is sample content rather than an asset — and shipped images stay out of the
 * package. This is a data URI so the stories carry no binary, and it is an `<img>`
 * because that is what a caller passes and what the slot's `object-cover` acts on.
 */
const PREVIEW_SRC =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='320'%3E%3Crect width='240' height='320' fill='%23fff'/%3E%3Crect x='16' y='16' width='120' height='10' rx='2' fill='%230066dc'/%3E%3Crect x='16' y='44' width='208' height='6' rx='2' fill='%23dbe0e6'/%3E%3Crect x='16' y='60' width='176' height='6' rx='2' fill='%23dbe0e6'/%3E%3Crect x='16' y='76' width='196' height='6' rx='2' fill='%23dbe0e6'/%3E%3Crect x='16' y='104' width='208' height='40' rx='4' fill='%23f1f7ff'/%3E%3Crect x='16' y='160' width='208' height='6' rx='2' fill='%23dbe0e6'/%3E%3Crect x='16' y='176' width='150' height='6' rx='2' fill='%23dbe0e6'/%3E%3Crect x='16' y='204' width='208' height='6' rx='2' fill='%23dbe0e6'/%3E%3Crect x='16' y='220' width='120' height='6' rx='2' fill='%23dbe0e6'/%3E%3C/svg%3E";

const Preview = () => <img src={PREVIEW_SRC} alt="Prescription for Aarav Sharma" />;

/** Figma publishes one instance swap on `icon`, defaulting to `upload-04`. */
const ICON_OPTIONS: Record<string, React.ReactNode> = {
  'upload-04 (Figma default)': <UploadIcon />,
  None: undefined,
};

const VIEW_ICON_OPTIONS: Record<string, React.ReactNode> = {
  'eye (Figma default)': <EyeIcon />,
  None: undefined,
};

const DELETE_ICON_OPTIONS: Record<string, React.ReactNode> = {
  'delete-02 (Figma default)': <DeleteIcon />,
  None: undefined,
};

const PREVIEW_OPTIONS: Record<string, React.ReactNode> = {
  'Prescription (placeholder)': <Preview />,
  None: undefined,
};

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="gap-semantic-4xl flex flex-wrap items-start">{children}</div>
);
const Stack = ({ children }: { children: React.ReactNode }) => (
  <div className="gap-semantic-4xl flex flex-col">{children}</div>
);
const Caption = ({ children }: { children: React.ReactNode }) => (
  <p className="text-desktop-caption-sm text-semantic-text-tertiary mb-semantic-md">{children}</p>
);

const meta = {
  title: 'Components/UploadModule',
  component: UploadModule,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A square card for adding a file, or for showing the one already added. ' +
          'Measured from Figma `Upload Module` (node 2180:67664) — **all 6 variants**: ' +
          '`Size`(3) × `State`(2).\n\n' +
          '**One component, because the box is the shared part.** Frame, radius and ' +
          'stroke are identical across both states (100/160/240, radius 8/12/16, a 1px ' +
          '`gray-light-100` stroke) and only the body differs, so two components would ' +
          'duplicate a 3×3 table of box values.\n\n' +
          '**Six published properties**: `size`, `state`, `label` (Figma’s ' +
          '`buttonName`), `icon`, `showViewIcon` (`showViewIcons`) and `showDeleteIcon`. ' +
          'Everything else — `preview`, `viewIcon`, `deleteIcon`, the three handlers and ' +
          'the two accessible names — is an implementation or accessibility addition, ' +
          'marked as such in the props table. Figma publishes no handler, no accessible ' +
          'name and no swappable preview.\n\n' +
          '**All four glyphs and the preview are caller-supplied.** Figma’s ' +
          '`upload-04`, `eye` and `delete-02` are icon-library components and its ' +
          'preview is a placeholder photograph, so none ships here — the convention ' +
          'Checkbox’s tick and SearchBar’s magnifier already follow. These stories ' +
          'supply Figma’s own paths with `currentColor` swapped in.\n\n' +
          '**No interaction is invented.** Figma publishes no hover, focus, pressed, ' +
          'disabled, loading, progress, error, validation or drag treatment, and none ' +
          'appears. A part becomes a control only when you hand it a handler: `onUpload` ' +
          'makes the Add card a `<button>`, and `onView`/`onDelete` make the affordances ' +
          'buttons. There is no file input — that needs a `<label>` around a hidden ' +
          '`<input type="file">`, which only you can wire up.',
      },
    },
  },
  tags: ['autodocs'],
  args: {
    size: 'sm',
    state: 'add',
    label: LABEL,
    icon: 'upload-04 (Figma default)',
    showViewIcons: true,
    showDeleteIcon: true,
    preview: 'Prescription (placeholder)',
    viewIcon: 'eye (Figma default)',
    deleteIcon: 'delete-02 (Figma default)',
    viewLabel: 'View prescription',
    deleteLabel: 'Delete prescription',
  },
  argTypes: {
    size: { control: 'inline-radio', options: UPLOAD_MODULE_SIZES },
    state: { control: 'inline-radio', options: UPLOAD_MODULE_STATES },
    label: {
      control: 'text',
      description: '**Figma property** `buttonName`. `state="add"` only.',
    },
    icon: {
      options: Object.keys(ICON_OPTIONS),
      mapping: ICON_OPTIONS,
      control: { type: 'select' },
      description:
        '**Figma property** `icon` — its one instance swap. Caller-supplied; sized and ' +
        'coloured by the slot.',
    },
    showViewIcons: {
      control: 'boolean',
      description:
        '**Figma property** `showViewIcons` — plural, as published. `state="display"` ' +
        'only. Gated with `viewIcon`: set the glyph to None and the affordance ' +
        'disappears rather than drawing an empty circle.',
    },
    showDeleteIcon: {
      control: 'boolean',
      description:
        '**Figma property** `showDeleteIcon` — singular, as published. Gated with ' +
        '`deleteIcon` in the same way.',
    },
    preview: {
      options: Object.keys(PREVIEW_OPTIONS),
      mapping: PREVIEW_OPTIONS,
      control: { type: 'select' },
      description:
        '**Engineering-only.** Figma’s image is a placeholder fill on the frame, not a ' +
        'swappable instance, so the file has to arrive from the caller.',
    },
    viewIcon: {
      options: Object.keys(VIEW_ICON_OPTIONS),
      mapping: VIEW_ICON_OPTIONS,
      control: { type: 'select' },
      description:
        '**Engineering-only.** Figma draws `eye` with no swap property and this library ' +
        'ships no artwork, so the glyph is the caller’s — and its presence is half the ' +
        'affordance’s visibility gate.',
    },
    deleteIcon: {
      options: Object.keys(DELETE_ICON_OPTIONS),
      mapping: DELETE_ICON_OPTIONS,
      control: { type: 'select' },
      description: '**Engineering-only.** As `viewIcon`, for Figma’s `delete-02`.',
    },
    viewLabel: {
      control: 'text',
      description:
        '**Engineering-only, accessibility.** An icon-only control has no text to name ' +
        'it, so pass this whenever `onView` is given.',
    },
    deleteLabel: {
      control: 'text',
      description: '**Engineering-only, accessibility.** As `viewLabel`, for `onDelete`.',
    },
    onUpload: {
      description:
        '**Engineering-only.** Figma publishes no interaction; supplying this makes the ' +
        'Add card a `<button>` with the shared focus ring.',
    },
    onView: { description: '**Engineering-only.** Makes the view affordance a `<button>`.' },
    onDelete: { description: '**Engineering-only.** Makes the delete affordance a `<button>`.' },
  },
} satisfies Meta<typeof UploadModule>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Every published property is live here, and the two prop sets are parallel — switch
 * `state` and the other set takes over.
 */
export const Playground: Story = {};

/** All six published variants, laid out as Figma's component set. */
export const EveryVariant: Story = {
  render: () => (
    <Stack>
      {UPLOAD_MODULE_STATES.map((state) => (
        <div key={state}>
          <Caption>State = {state} — 100 × 100, 160 × 160, 240 × 240 in Figma</Caption>
          <Row>
            {UPLOAD_MODULE_SIZES.map((size) => (
              <UploadModule
                key={size}
                size={size}
                state={state}
                label={LABEL}
                icon={<UploadIcon />}
                preview={<Preview />}
                viewIcon={<EyeIcon />}
                deleteIcon={<DeleteIcon />}
                viewLabel="View prescription"
                deleteLabel="Delete prescription"
              />
            ))}
          </Row>
        </div>
      ))}
    </Stack>
  ),
};

/**
 * The Add state at all three sizes. The glyph and the type step both move with the size —
 * 24/32/48 and 10/16, 14/20, 20/28 — and the label wraps and clips against the frame
 * rather than truncating.
 */
export const AddState: Story = {
  render: () => (
    <Row>
      {UPLOAD_MODULE_SIZES.map((size) => (
        <div key={size}>
          <Caption>{size}</Caption>
          <UploadModule size={size} label={LABEL} icon={<UploadIcon />} />
        </div>
      ))}
    </Row>
  ),
};

/**
 * The Display state at all three sizes. The preview fills the frame and is clipped to its
 * radius; the delete affordance hangs across the top-right corner, which is why the clip
 * lives on the preview rather than on the card.
 */
export const DisplayState: Story = {
  render: () => (
    <Row>
      {UPLOAD_MODULE_SIZES.map((size) => (
        <div key={size}>
          <Caption>{size}</Caption>
          <UploadModule
            size={size}
            state="display"
            preview={<Preview />}
            viewIcon={<EyeIcon />}
            deleteIcon={<DeleteIcon />}
            viewLabel="View prescription"
            deleteLabel="Delete prescription"
          />
        </div>
      ))}
    </Row>
  ),
};

/** Figma's two visibility booleans, in all four combinations. */
export const Affordances: Story = {
  render: () => (
    <Row>
      {[
        { showViewIcons: true, showDeleteIcon: true, label: 'both (Figma default)' },
        { showViewIcons: true, showDeleteIcon: false, label: 'view only' },
        { showViewIcons: false, showDeleteIcon: true, label: 'delete only' },
        { showViewIcons: false, showDeleteIcon: false, label: 'neither' },
      ].map(({ label, ...flags }) => (
        <div key={label}>
          <Caption>{label}</Caption>
          <UploadModule
            size="md"
            state="display"
            preview={<Preview />}
            viewIcon={<EyeIcon />}
            deleteIcon={<DeleteIcon />}
            viewLabel="View prescription"
            deleteLabel="Delete prescription"
            {...flags}
          />
        </div>
      ))}
    </Row>
  ),
};

/**
 * Interaction is opt-in, and it is an implementation addition rather than a Figma state.
 * Without a handler a part is drawn exactly as Figma draws it and claims no role; with
 * one it becomes a `<button>` and takes the shared focus ring. Tab through these.
 */
export const Interactive: Story = {
  render: () => (
    <Stack>
      <div>
        <Caption>No handlers — inert, as Figma publishes it.</Caption>
        <Row>
          <UploadModule size="md" label={LABEL} icon={<UploadIcon />} />
          <UploadModule
            size="md"
            state="display"
            preview={<Preview />}
            viewIcon={<EyeIcon />}
            deleteIcon={<DeleteIcon />}
          />
        </Row>
      </div>
      <div>
        <Caption>With handlers — the card and the affordances become buttons.</Caption>
        <Row>
          <UploadModule
            size="md"
            label={LABEL}
            icon={<UploadIcon />}
            onUpload={() => alert('Upload')}
          />
          <UploadModule
            size="md"
            state="display"
            preview={<Preview />}
            viewIcon={<EyeIcon />}
            deleteIcon={<DeleteIcon />}
            viewLabel="View prescription"
            deleteLabel="Delete prescription"
            onView={() => alert('View')}
            onDelete={() => alert('Delete')}
          />
        </Row>
      </div>
    </Stack>
  ),
};

/**
 * The real shape of the thing: a row of uploaded files with an Add card at the end. The
 * delete affordances overhang their cards, so the row needs enough gap and top room to
 * let them show — which is what `Row`'s `items-start` and the gap here are for.
 */
export const InAList: Story = {
  render: () => (
    <div className="gap-semantic-4xl pt-semantic-2xl flex flex-wrap items-start">
      {['Prescription', 'Lab report', 'Discharge summary'].map((name) => (
        <UploadModule
          key={name}
          size="sm"
          state="display"
          preview={<img src={PREVIEW_SRC} alt={name} />}
          viewIcon={<EyeIcon />}
          deleteIcon={<DeleteIcon />}
          viewLabel={`View ${name}`}
          deleteLabel={`Delete ${name}`}
          onView={() => alert(`View ${name}`)}
          onDelete={() => alert(`Delete ${name}`)}
        />
      ))}
      <UploadModule
        size="sm"
        label="Upload New Prescription"
        icon={<UploadIcon />}
        onUpload={() => alert('Upload')}
      />
    </div>
  ),
};
