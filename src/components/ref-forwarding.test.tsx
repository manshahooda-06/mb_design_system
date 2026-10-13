import { createRef } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar } from './Avatar';
import { Checkbox } from './Checkbox';
import { Input } from './Input';
import { Radio } from './Radio';
import { SearchBar } from './SearchBar';
import { Tag } from './Tag';
import { Textarea } from './Textarea';
import { Toggle } from './Toggle';

/**
 * Every component that accepts a ref must forward it through `forwardRef`.
 *
 * **This is a React-version compatibility guard, not a style rule.** React 19 treats `ref`
 * as an ordinary prop, so a component typed `ComponentPropsWithRef` appears to forward one
 * while doing nothing of the sort on React 18 — React strips it and the ref stays null,
 * with no error anywhere. A per-component ref test would not catch that either, if the
 * component were only ever exercised on 19.
 *
 * Asserting it once, here, for every ref-accepting component keeps the guarantee whole: a
 * component converted back to ref-as-prop fails this file rather than failing silently in a
 * consumer's app.
 *
 * Absent by design: Button and IconButton are generic over their `variant` (so `tone` can be
 * narrowed per variant) and polymorphic through `asChild`, and `forwardRef` erases the
 * generic. They expose no ref today; `asChild` is the escape hatch, since it hands the
 * element to the caller who can attach their own. InputDropdown and OtpInput type their
 * props `ComponentPropsWithoutRef` — neither has a single obvious element to point a ref at.
 */
describe('ref forwarding', () => {
  it('forwards Avatar to its root span', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Avatar ref={ref} name="Olivia Rhye" />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('forwards Tag to its root span', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Tag ref={ref} label="Cardiology" />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('forwards Toggle to its button', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Toggle ref={ref} label="Remember me" />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('forwards Input to its input', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} label="Email" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('forwards Textarea to its textarea', () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} label="Notes" />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('forwards SearchBar to its input', () => {
    const ref = createRef<HTMLInputElement>();
    render(<SearchBar ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  /**
   * These two compose the forwarded ref with an internal one — the internal ref drives
   * `indeterminate`, which has no HTML attribute and can only be set on the DOM node. Both
   * must survive: the caller's ref resolves *and* the internal behaviour still works.
   */
  it('forwards Checkbox while keeping its internal ref', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Checkbox ref={ref} label="I agree" indeterminate />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.indeterminate).toBe(true);
  });

  it('forwards Radio while keeping its internal ref', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Radio ref={ref} label="Morning" value="am" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('sets displayName on every forwarding component', () => {
    // forwardRef components render as "ForwardRef" in devtools and Storybook without it.
    const named = [
      [Avatar, 'Avatar'],
      [Checkbox, 'Checkbox'],
      [Input, 'Input'],
      [Radio, 'Radio'],
      [SearchBar, 'SearchBar'],
      [Tag, 'Tag'],
      [Textarea, 'Textarea'],
      [Toggle, 'Toggle'],
    ] as const;
    for (const [component, name] of named) {
      expect((component as { displayName?: string }).displayName, name).toBe(name);
    }
  });
});
