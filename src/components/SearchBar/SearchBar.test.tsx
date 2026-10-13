import { act, createRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchBar } from './SearchBar';
import type { SearchBarDevice, SearchBarType } from './types';

const DEVICES: SearchBarDevice[] = ['mobile', 'desktop-1280', 'desktop-1920'];
const TYPES: SearchBarType[] = ['doctor', 'hospital', 'symptom', 'speciality'];

/** Figma's own text, quotes included. */
const WORDS = ['‘Doctor’', '‘Hospital’', '‘Symptom’', '‘Speciality’'];

const field = () => screen.getByRole('searchbox');
const clearButton = () => screen.queryByRole('button', { name: 'Clear search' });

/** The word stack — the only element the animation moves. */
const stackOf = (container: HTMLElement) =>
  container.querySelector('.flex-col') as HTMLElement | null;

/** What framer-motion has written to the stack, e.g. `translateY(-24px)`. */
const transformOf = (container: HTMLElement) => stackOf(container)?.style.transform ?? null;

/** Which of the four `type` values the window is showing. */
const activeTypeOf = (container: HTMLElement) =>
  container.querySelector('[data-active-type]')?.getAttribute('data-active-type') ?? null;

/**
 * The four resting transforms for a device's pitch.
 *
 * Step 0 is `none` rather than `translateY(0px)`: framer-motion omits a zero transform
 * instead of writing an identity one.
 */
const PITCH_OFFSETS = (pitch: number) =>
  [0, 1, 2, 3].map((step) => (step === 0 ? 'none' : `translateY(${-(step * pitch)}px)`));

describe('SearchBar', () => {
  it('renders a search input', () => {
    render(<SearchBar />);
    expect(field()).toHaveAttribute('type', 'search');
  });

  it('forwards a ref to the input', () => {
    const ref = createRef<HTMLInputElement>();
    render(<SearchBar ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('passes through arbitrary DOM props to the input', () => {
    render(<SearchBar id="custom" name="q" />);
    expect(field()).toHaveAttribute('id', 'custom');
    expect(field()).toHaveAttribute('name', 'q');
  });

  it('lets className win over a variant class on the container', () => {
    // twMerge must drop the variant's padding rather than emit both, or which one
    // applies depends on Tailwind's output order instead of on the caller.
    const { container } = render(<SearchBar className="p-semantic-4xl" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('p-semantic-4xl');
    expect(root.className).not.toContain('py-semantic-lg');
  });

  it('applies a class to every slot it publishes', () => {
    const { container } = render(
      <SearchBar
        filledText="Cardi"
        classNames={{
          root: 'slot-root',
          content: 'slot-content',
          searchIcon: 'slot-search',
          field: 'slot-field',
          input: 'slot-input',
          clearIcon: 'slot-clear',
        }}
      />,
    );
    for (const slot of ['root', 'content', 'search', 'field', 'input', 'clear']) {
      expect(container.querySelector(`.slot-${slot}`)).not.toBeNull();
    }
  });

  it('applies the placeholder slot classes while empty', () => {
    const { container } = render(
      <SearchBar
        classNames={{
          placeholder: 'slot-placeholder',
          staticText: 'slot-static',
          animatingText: 'slot-animating',
        }}
      />,
    );
    for (const slot of ['placeholder', 'static', 'animating']) {
      expect(container.querySelector(`.slot-${slot}`)).not.toBeNull();
    }
  });
});

/**
 * Figma's `State` axis, which this component derives rather than exposes.
 *
 * A prop would let a caller ask for Filled with an empty field, which Figma cannot draw.
 */
describe('SearchBar state', () => {
  it('shows the placeholder and no clear button while empty', () => {
    render(<SearchBar />);
    expect(screen.getByText('Search by')).toBeInTheDocument();
    expect(clearButton()).toBeNull();
  });

  it('replaces the placeholder with the value and shows the clear button when filled', () => {
    render(<SearchBar filledText="Cardi" />);
    expect(field()).toHaveValue('Cardi');
    expect(screen.queryByText('Search by')).toBeNull();
    expect(clearButton()).not.toBeNull();
  });

  it('seeds the uncontrolled value from filledText and still edits', async () => {
    const user = userEvent.setup();
    render(<SearchBar filledText="Cardi" />);
    await user.type(field(), 'ology');
    expect(field()).toHaveValue('Cardiology');
  });

  it('switches back to the placeholder when the value empties', async () => {
    const user = userEvent.setup();
    render(<SearchBar filledText="C" />);
    await user.clear(field());
    expect(screen.getByText('Search by')).toBeInTheDocument();
    expect(clearButton()).toBeNull();
  });
});

describe('SearchBar value API', () => {
  it('reports every edit through onValueChange', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<SearchBar onValueChange={onValueChange} />);
    await user.type(field(), 'ab');
    expect(onValueChange).toHaveBeenNthCalledWith(1, 'a');
    expect(onValueChange).toHaveBeenNthCalledWith(2, 'ab');
  });

  it('still calls a caller-supplied onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchBar onChange={onChange} />);
    await user.type(field(), 'a');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('honours a controlled value and does not drift from it', async () => {
    const user = userEvent.setup();
    render(<SearchBar value="fixed" />);
    await user.type(field(), 'more');
    expect(field()).toHaveValue('fixed');
  });

  it('follows a controlled value that the caller updates', async () => {
    const user = userEvent.setup();
    const Controlled = () => {
      const [value, setValue] = useState('');
      return <SearchBar value={value} onValueChange={setValue} />;
    };
    render(<Controlled />);
    await user.type(field(), 'derm');
    expect(field()).toHaveValue('derm');
  });

  it('clears through the clear button, reporting both callbacks', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    const onValueChange = vi.fn();
    render(<SearchBar filledText="Cardi" onClear={onClear} onValueChange={onValueChange} />);
    await user.click(clearButton()!);
    expect(field()).toHaveValue('');
    expect(onValueChange).toHaveBeenCalledWith('');
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('leaves a controlled value to the caller when cleared', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<SearchBar value="Cardi" onValueChange={onValueChange} />);
    await user.click(clearButton()!);
    expect(onValueChange).toHaveBeenCalledWith('');
    expect(field()).toHaveValue('Cardi');
  });
});

/**
 * The placeholder's two halves.
 *
 * Figma's `_Search animating text` is a static "Search by" plus a separately positioned
 * stack of four words. The halves must stay separate elements: `type` and
 * `showAnimatedText` drive one and must not be able to reach the other.
 */
describe('SearchBar placeholder structure', () => {
  it('renders the static text as its own element, outside the animated stack', () => {
    render(<SearchBar />);
    const staticText = screen.getByText('Search by');
    for (const word of WORDS) {
      expect(staticText).not.toContainElement(screen.getByText(word));
    }
  });

  it('never composes the two halves into one string', () => {
    render(<SearchBar />);
    expect(screen.queryByText('Search by ‘Doctor’')).toBeNull();
    expect(screen.getByText('Search by').textContent).toBe('Search by');
  });

  it('keeps all four words mounted so only the offset selects one', () => {
    render(<SearchBar />);
    for (const word of WORDS) {
      expect(screen.getByText(word)).toBeInTheDocument();
    }
  });

  it('uses Figma’s typographic quotes, not apostrophes', () => {
    render(<SearchBar />);
    expect(screen.getByText('‘Doctor’')).toBeInTheDocument();
    expect(screen.queryByText("'Doctor'")).toBeNull();
    expect(screen.queryByText('Doctor')).toBeNull();
  });

  it('clips the animated stack to a single line', () => {
    const { container } = render(<SearchBar classNames={{ animatingText: 'window' }} />);
    expect(container.querySelector('.window')?.className).toContain('overflow-clip');
  });

  it('hides the placeholder from assistive technology', () => {
    // It duplicates the accessible name, which the input already carries.
    const { container } = render(<SearchBar classNames={{ placeholder: 'ph' }} />);
    expect(container.querySelector('.ph')).toHaveAttribute('aria-hidden');
  });

  it('does not let the placeholder swallow clicks meant for the input', () => {
    const { container } = render(<SearchBar classNames={{ placeholder: 'ph' }} />);
    expect(container.querySelector('.ph')?.className).toContain('pointer-events-none');
  });
});

describe('SearchBar showAnimatedText', () => {
  it('removes only the animated half', () => {
    render(<SearchBar showAnimatedText={false} />);
    expect(screen.getByText('Search by')).toBeInTheDocument();
    for (const word of WORDS) {
      expect(screen.queryByText(word)).toBeNull();
    }
  });

  it('keeps the animated half by default', () => {
    render(<SearchBar />);
    expect(screen.getByText('‘Doctor’')).toBeInTheDocument();
  });

  it('drops the animated word from the accessible name when hidden', () => {
    render(<SearchBar showAnimatedText={false} />);
    expect(field()).toHaveAccessibleName('Search by');
  });
});

/**
 * `type` selects a word by offsetting the stack one line pitch per step.
 *
 * The pitch is the line height plus the 4px stack gap, so it differs per device: 24, 28
 * and 32.
 */
describe('SearchBar type', () => {
  // The offset is a rendered transform, not a class: framer-motion applies it from
  // `MOTION.PITCH`. Asserting the transform checks the geometry Figma specifies rather
  // than the utility that used to express it.
  const OFFSETS: Record<SearchBarDevice, string[]> = {
    mobile: PITCH_OFFSETS(24),
    'desktop-1280': PITCH_OFFSETS(28),
    'desktop-1920': PITCH_OFFSETS(32),
  };

  // Pinned, so these assert `type`'s geometry rather than wherever the cycle has reached.
  it.each(DEVICES)('offsets the stack by one pitch per step at %s', (device) => {
    for (const [index, type] of TYPES.entries()) {
      const { container, unmount } = render(
        <SearchBar device={device} type={type} animate={false} />,
      );
      expect(transformOf(container), `${device}/${type}`).toBe(OFFSETS[device][index]);
      unmount();
    }
  });

  it('reaches only the animated half, never the static text', () => {
    for (const type of TYPES) {
      const { unmount } = render(<SearchBar type={type} animate={false} />);
      expect(screen.getByText('Search by').textContent).toBe('Search by');
      unmount();
    }
  });

  it('names the active word in the accessible name', () => {
    render(<SearchBar type="speciality" animate={false} />);
    expect(field()).toHaveAccessibleName('Search by ‘Speciality’');
  });

  it('lets the caller override the accessible name', () => {
    render(<SearchBar aria-label="Find a doctor" />);
    expect(field()).toHaveAccessibleName('Find a doctor');
  });
});

/**
 * The animation is `type` advancing on a timer.
 *
 * Every word is already mounted and the offset is the only thing that moves, so the whole
 * motion reuses the measured Figma offsets rather than introducing its own geometry.
 *
 * The timing is the one thing not measured from Figma: the file publishes four static
 * frames and no duration, easing or dwell, and the motion foundation is an empty stub.
 */
describe('SearchBar animation', () => {
  const MOBILE = PITCH_OFFSETS(24);

  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it('cycles through the four words, then wraps', async () => {
    const { container } = render(<SearchBar />);
    const seen = [activeTypeOf(container)];
    for (let step = 0; step < 4; step++) {
      await act(async () => vi.advanceTimersByTime(2000));
      seen.push(activeTypeOf(container));
    }
    expect(seen).toEqual(['doctor', 'hospital', 'symptom', 'speciality', 'doctor']);
  });

  it('honours intervalMs', async () => {
    const { container } = render(<SearchBar intervalMs={500} />);
    await act(async () => vi.advanceTimersByTime(500));
    expect(activeTypeOf(container)).toBe('hospital');
  });

  it('does not cycle when animate is false', async () => {
    const { container } = render(<SearchBar animate={false} />);
    await act(async () => vi.advanceTimersByTime(2000 * 5));
    expect(activeTypeOf(container)).toBe('doctor');
    expect(transformOf(container)).toBe(MOBILE[0]);
  });

  it('starts the cycle from type', async () => {
    const { container } = render(<SearchBar type="symptom" />);
    // The resting offset is observable on mount; after that the travel is animated.
    expect(transformOf(container)).toBe(MOBILE[2]);
    expect(activeTypeOf(container)).toBe('symptom');
    await act(async () => vi.advanceTimersByTime(2000));
    expect(activeTypeOf(container)).toBe('speciality');
  });

  it('holds the accessible name still while the word cycles', async () => {
    // A name that changed every couple of seconds would churn for anyone focused on an
    // empty field. The cycling words are illustrative, so only the static half names it.
    render(<SearchBar />);
    expect(field()).toHaveAccessibleName('Search by');
    await act(async () => vi.advanceTimersByTime(2000 * 3));
    expect(field()).toHaveAccessibleName('Search by');
  });

  it('names the pinned word, which cannot churn', () => {
    render(<SearchBar type="symptom" animate={false} />);
    expect(field()).toHaveAccessibleName('Search by ‘Symptom’');
  });

  it('claims no word once Filled has replaced the placeholder', () => {
    // Naming a word that is not on screen would describe nothing.
    render(<SearchBar filledText="Cardi" type="symptom" />);
    expect(field()).toHaveAccessibleName('Search by');
  });

  // `prefers-reduced-motion` is covered in `SearchBar.reduced-motion.test.tsx`:
  // framer-motion reads the query once into a module singleton, so it has to be stubbed
  // before the module initialises, which needs a file of its own.

  it('rests at the pinned offset with no styling that implies movement', () => {
    const { container } = render(<SearchBar type="hospital" animate={false} />);
    expect(transformOf(container)).toBe(MOBILE[1]);
    // The offset is a transform, so the stack carries no transition utility at all.
    expect(stackOf(container)!.className).not.toContain('transition');
  });

  it('pauses while the page is hidden and resumes when it returns', async () => {
    const visibility = vi.spyOn(document, 'visibilityState', 'get');

    visibility.mockReturnValue('hidden');
    const { container } = render(<SearchBar />);
    await act(async () => vi.advanceTimersByTime(2000 * 4));
    // A hidden tab throttles timers and animates nothing anyone can see.
    expect(activeTypeOf(container)).toBe('doctor');

    visibility.mockReturnValue('visible');
    await act(async () => document.dispatchEvent(new Event('visibilitychange')));
    await act(async () => vi.advanceTimersByTime(2000));
    expect(activeTypeOf(container)).toBe('hospital');

    visibility.mockRestore();
  });

  it('stops once the field is filled, since Filled has no placeholder', async () => {
    const { container } = render(<SearchBar filledText="Cardi" />);
    await act(async () => vi.advanceTimersByTime(2000 * 3));
    expect(stackOf(container)).toBeNull();
  });

  it('does not cycle when the animated half is hidden', async () => {
    const { container } = render(<SearchBar showAnimatedText={false} />);
    await act(async () => vi.advanceTimersByTime(2000 * 3));
    expect(stackOf(container)).toBeNull();
    expect(screen.getByText('Search by')).toBeInTheDocument();
  });

  it('clears its timer on unmount', async () => {
    const clearSpy = vi.spyOn(globalThis, 'clearInterval');
    const { unmount } = render(<SearchBar />);
    unmount();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});

/** Every device carries its own padding, gaps, icon ramp and type step. */
describe('SearchBar device', () => {
  const ROOT: Record<SearchBarDevice, string> = {
    mobile: 'px-semantic-xl',
    'desktop-1280': 'p-semantic-lg',
    'desktop-1920': 'p-semantic-xl',
  };
  const CONTENT_GAP: Record<SearchBarDevice, string> = {
    mobile: 'gap-semantic-sm',
    'desktop-1280': 'gap-semantic-md',
    'desktop-1920': 'gap-semantic-lg',
  };
  const SEARCH_ICON: Record<SearchBarDevice, string> = {
    mobile: 'size-semantic-2xl',
    'desktop-1280': 'size-semantic-3xl',
    'desktop-1920': 'size-[28px]',
  };
  const CLEAR_ICON: Record<SearchBarDevice, string> = {
    mobile: 'size-semantic-xl',
    'desktop-1280': 'size-semantic-2xl',
    'desktop-1920': 'size-semantic-3xl',
  };
  const TEXT: Record<SearchBarDevice, string> = {
    mobile: 'text-mobile-body-md',
    'desktop-1280': 'text-desktop-body-sm',
    'desktop-1920': 'text-desktop-body-md',
  };

  it.each(DEVICES)('applies %s geometry', (device) => {
    const { container } = render(
      <SearchBar
        device={device}
        filledText="Cardi"
        classNames={{
          root: 'r',
          content: 'c',
          searchIcon: 's',
          input: 'i',
          clearIcon: 'x',
        }}
      />,
    );
    expect(container.querySelector('.r')?.className).toContain(ROOT[device]);
    expect(container.querySelector('.c')?.className).toContain(CONTENT_GAP[device]);
    expect(container.querySelector('.s')?.className).toContain(SEARCH_ICON[device]);
    expect(container.querySelector('.i')?.className).toContain(TEXT[device]);
    expect(container.querySelector('.x')?.className).toContain(CLEAR_ICON[device]);
  });

  it('defaults to mobile', () => {
    const { container } = render(<SearchBar classNames={{ root: 'r' }} />);
    expect(container.querySelector('.r')?.className).toContain('px-semantic-xl');
  });

  it('uses one root gap and one radius at every device', () => {
    for (const device of DEVICES) {
      const { container, unmount } = render(
        <SearchBar device={device} classNames={{ root: 'r' }} />,
      );
      const { className } = container.querySelector('.r') as HTMLElement;
      expect(className).toContain('gap-semantic-md');
      expect(className).toContain('rounded-xl');
      unmount();
    }
  });

  it('keeps the search icon brand-coloured in both states', () => {
    for (const filledText of ['', 'Cardi']) {
      const { container, unmount } = render(
        <SearchBar filledText={filledText} classNames={{ searchIcon: 's' }} />,
      );
      expect(container.querySelector('.s')?.className).toContain('text-semantic-fg-brand-primary');
      unmount();
    }
  });
});

/**
 * The container's stroke is an inside-aligned Figma stroke.
 *
 * Figma's frame hugs its content and the padding sums to the published height exactly —
 * 12+20+12 = 44 at Mobile — which only holds if the stroke adds nothing to the box. A
 * CSS border would make it 46.
 */
describe('SearchBar container', () => {
  it('draws the stroke as an inset ring, not a border', () => {
    const { container } = render(<SearchBar classNames={{ root: 'r' }} />);
    const { className } = container.querySelector('.r') as HTMLElement;
    expect(className).toContain('inset-ring');
    expect(className).not.toMatch(/(^|\s)border(\s|$)/);
  });

  it('uses Elevation 2', () => {
    const { container } = render(<SearchBar classNames={{ root: 'r' }} />);
    expect(container.querySelector('.r')?.className).toContain('shadow-elevation-2');
  });
});

/** Figma publishes no other states, so none exist here. */
describe('SearchBar has only the two published states', () => {
  it('applies no hover, disabled or error styling', () => {
    const { container } = render(<SearchBar filledText="Cardi" />);
    const markup = container.innerHTML;
    expect(markup).not.toContain('hover:');
    expect(markup).not.toContain('disabled:');
    expect(markup).not.toContain('error');
  });

  /**
   * Focus is the one treatment Figma does not publish but the component must have.
   *
   * It uses the library's shared indicator on the container rather than a per-component
   * design, so it traces the bar's radius and reads the same as every other focusable
   * thing in the library — instead of the browser's own ring, which is a
   * differently-coloured rectangle in every engine.
   */
  it('carries the library focus indicator on the container, not a designed state', () => {
    const { container } = render(<SearchBar classNames={{ root: 'r', input: 'i' }} />);
    const root = container.querySelector('.r') as HTMLElement;
    expect(root.className).toContain('focus-within:ring-semantic-focus-ring');
    expect(root.className).toContain('focus-within:ring-offset-semantic-bg-primary');
    // The input defers to it rather than drawing a second ring inside the bar.
    expect(container.querySelector('.i')?.className).toContain('outline-none');
  });

  it('changes nothing else between the two states', () => {
    // Figma's Default and Filled share the container exactly.
    const shared = (filledText: string) => {
      const { container, unmount } = render(
        <SearchBar filledText={filledText} classNames={{ root: 'r' }} />,
      );
      const { className } = container.querySelector('.r') as HTMLElement;
      unmount();
      return className;
    };
    expect(shared('')).toBe(shared('Cardi'));
  });
});
