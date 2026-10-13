import { createRef, useRef, type MouseEvent } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { composeRefs } from './compose-refs';
import { Slot } from './slot';

describe('Slot', () => {
  it('renders the child element rather than a wrapper', () => {
    const { container } = render(
      <Slot data-testid="slotted">
        <a href="/x">Link</a>
      </Slot>,
    );
    // One element, not a wrapper around it: a wrapper would break flex layout
    // and, around an <a>, would nest two interactive elements.
    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild?.tagName).toBe('A');
  });

  it('passes slot props onto the child', () => {
    render(
      <Slot data-testid="slotted" aria-label="labelled">
        <button type="button">Press</button>
      </Slot>,
    );
    expect(screen.getByTestId('slotted')).toHaveAttribute('aria-label', 'labelled');
  });

  it('lets the child win a plain prop', () => {
    render(
      <Slot id="from-slot" data-testid="slotted">
        <button type="button" id="from-child">
          Press
        </button>
      </Slot>,
    );
    expect(screen.getByTestId('slotted')).toHaveAttribute('id', 'from-child');
  });

  it('merges className through cn so the child wins a conflict', () => {
    render(
      <Slot className="px-semantic-md bg-semantic-bg-primary" data-testid="slotted">
        <button type="button" className="px-semantic-xl">
          Press
        </button>
      </Slot>,
    );
    const { className } = screen.getByTestId('slotted');
    expect(className).toContain('bg-semantic-bg-primary');
    expect(className).toContain('px-semantic-xl');
    expect(className).not.toContain('px-semantic-md');
  });

  it('merges style, child last', () => {
    render(
      <Slot style={{ color: 'red', margin: '1px' }} data-testid="slotted">
        <button type="button" style={{ color: 'blue' }}>
          Press
        </button>
      </Slot>,
    );
    const style = screen.getByTestId('slotted').getAttribute('style');
    expect(style).toContain('color: blue');
    expect(style).toContain('margin: 1px');
  });

  it('runs both event handlers, slot first', async () => {
    const order: string[] = [];
    const slotClick = vi.fn(() => order.push('slot'));
    const childClick = vi.fn((_: MouseEvent) => order.push('child'));

    render(
      <Slot onClick={slotClick} data-testid="slotted">
        <button type="button" onClick={childClick}>
          Press
        </button>
      </Slot>,
    );
    await userEvent.click(screen.getByTestId('slotted'));

    // Overriding either one would silently cancel behaviour the other side
    // reasonably assumed was running.
    expect(order).toEqual(['slot', 'child']);
  });

  it('composes refs from both sides onto the same node', () => {
    const slotRef = createRef<HTMLButtonElement>();
    const childRef = createRef<HTMLButtonElement>();

    render(
      <Slot ref={slotRef}>
        <button type="button" ref={childRef}>
          Press
        </button>
      </Slot>,
    );

    expect(slotRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(slotRef.current).toBe(childRef.current);
  });

  it('throws on more than one child', () => {
    // Two children have no correct interpretation — the props can only land on
    // one — and silently choosing would produce a component that ignores half
    // its own props while looking right in the inspector.
    expect(() =>
      render(
        <Slot>
          <span>one</span>
          <span>two</span>
        </Slot>,
      ),
    ).toThrow();
  });

  it('throws on a text child', () => {
    expect(() => render(<Slot>text</Slot>)).toThrow();
  });
});

describe('composeRefs', () => {
  it('assigns object refs and calls function refs', () => {
    const objectRef = createRef<HTMLDivElement>();
    const functionRef = vi.fn();
    const node = document.createElement('div');

    composeRefs<HTMLDivElement>(objectRef, functionRef)(node);

    expect(objectRef.current).toBe(node);
    expect(functionRef).toHaveBeenCalledWith(node);
  });

  it('ignores absent refs', () => {
    const objectRef = createRef<HTMLDivElement>();
    expect(() => composeRefs<HTMLDivElement>(undefined, objectRef, null)(null)).not.toThrow();
    expect(objectRef.current).toBeNull();
  });

  it('works with a ref created by useRef', () => {
    function Probe() {
      const ref = useRef<HTMLDivElement>(null);
      return <div ref={composeRefs(ref)} data-testid="probe" />;
    }
    render(<Probe />);
    expect(screen.getByTestId('probe')).toBeInTheDocument();
  });
});
