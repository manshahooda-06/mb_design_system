import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Radio } from './Radio';
import { RadioGroup } from './RadioGroup';

const radios = () => screen.getAllByRole('radio') as HTMLInputElement[];
const group = () => screen.getByRole('radiogroup');
const circleOf = (r: HTMLInputElement) => r.nextElementSibling as HTMLElement;
const dotOf = (r: HTMLInputElement) => circleOf(r).firstElementChild as HTMLElement | null;

function setup(props: Partial<Parameters<typeof RadioGroup>[0]> = {}) {
  return render(
    <RadioGroup label="Plan" {...props}>
      <Radio value="free" label="Free" />
      <Radio value="pro" label="Pro" />
      <Radio value="team" label="Team" />
    </RadioGroup>,
  );
}

describe('RadioGroup', () => {
  describe('semantics', () => {
    it('is a radiogroup', () => {
      setup();
      expect(group()).toBeInTheDocument();
      expect(group().tagName).toBe('DIV');
    });

    it('takes its accessible name from label', () => {
      setup();
      expect(screen.getByRole('radiogroup', { name: 'Plan' })).toBe(group());
    });

    it('does not render the label — Figma publishes no group label', () => {
      // Drawing one would mean inventing typography and spacing the design system has
      // not agreed.
      setup({ label: 'Plan' });
      expect(screen.queryByText('Plan')).not.toBeInTheDocument();
    });

    it('lets an explicit aria-label win over label', () => {
      setup({ label: 'Plan', 'aria-label': 'Billing plan' });
      expect(screen.getByRole('radiogroup', { name: 'Billing plan' })).toBe(group());
    });

    it('defers to aria-labelledby and applies no aria-label alongside it', () => {
      render(
        <>
          <h2 id="heading">Choose a plan</h2>
          <RadioGroup label="Plan" aria-labelledby="heading">
            <Radio value="free" label="Free" />
          </RadioGroup>
        </>,
      );
      expect(group()).not.toHaveAttribute('aria-label');
      expect(screen.getByRole('radiogroup', { name: 'Choose a plan' })).toBe(group());
    });
  });

  describe('layout — deliberately none', () => {
    it('imposes no spacing, gap, orientation or display', () => {
      // Figma publishes no group container at all, so any layout here would be a
      // measurement we invented. Consumers own it.
      setup();
      expect(group().className).toBe('');
    });

    it('renders children verbatim, so a caller wrapper survives', () => {
      render(
        <RadioGroup label="Plan">
          <div data-testid="own-layout" className="flex flex-col gap-4">
            <Radio value="free" label="Free" />
          </div>
        </RadioGroup>,
      );
      expect(screen.getByTestId('own-layout')).toBeInTheDocument();
      expect(screen.getByTestId('own-layout').parentElement).toBe(group());
    });

    it('passes className through when a caller supplies one', () => {
      setup({ className: 'flex flex-col gap-4' });
      expect(group().className).toBe('flex flex-col gap-4');
    });
  });

  describe('name grouping', () => {
    it('gives every radio the same generated name', () => {
      setup();
      const names = new Set(radios().map((r) => r.name));
      expect(names.size).toBe(1);
      expect([...names][0]).toBeTruthy();
    });

    it('honours an explicit name', () => {
      setup({ name: 'plan' });
      expect(radios().every((r) => r.name === 'plan')).toBe(true);
    });

    it('keeps two groups from interfering — the footgun of a duplicated name', async () => {
      const user = userEvent.setup();
      render(
        <>
          <RadioGroup label="First">
            <Radio value="a" label="A1" />
            <Radio value="b" label="B1" />
          </RadioGroup>
          <RadioGroup label="Second">
            <Radio value="a" label="A2" />
            <Radio value="b" label="B2" />
          </RadioGroup>
        </>,
      );
      const [a1, b1, a2, b2] = radios();
      expect(a1?.name).not.toBe(a2?.name);

      await user.click(screen.getByText('A1'));
      await user.click(screen.getByText('B2'));
      // Selecting in the second group must not disturb the first.
      expect(a1).toBeChecked();
      expect(b1).not.toBeChecked();
      expect(a2).not.toBeChecked();
      expect(b2).toBeChecked();
    });
  });

  describe('value', () => {
    it('selects the radio matching defaultValue', () => {
      setup({ defaultValue: 'pro' });
      const [free, pro] = radios();
      expect(free).not.toBeChecked();
      expect(pro).toBeChecked();
    });

    it('selects nothing when no value is given', () => {
      setup();
      expect(radios().some((r) => r.checked)).toBe(false);
    });

    it('moves selection on click and reports the new value', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      setup({ onValueChange });
      await user.click(screen.getByText('Pro'));
      expect(onValueChange).toHaveBeenCalledWith('pro');
      expect(radios()[1]).toBeChecked();
      expect(radios()[0]).not.toBeChecked();
    });

    it('is mutually exclusive — selecting one deselects the rest', async () => {
      const user = userEvent.setup();
      setup({ defaultValue: 'free' });
      await user.click(screen.getByText('Team'));
      const [free, pro, team] = radios();
      expect(free).not.toBeChecked();
      expect(pro).not.toBeChecked();
      expect(team).toBeChecked();
    });

    it('repaints the circle and dot as selection moves', async () => {
      const user = userEvent.setup();
      setup({ defaultValue: 'free' });
      const [free, pro] = radios();
      expect(dotOf(free!)).not.toBeNull();
      expect(dotOf(pro!)).toBeNull();
      await user.click(screen.getByText('Pro'));
      expect(dotOf(free!)).toBeNull();
      expect(dotOf(pro!)).not.toBeNull();
      expect(circleOf(pro!).className).toContain('bg-semantic-bg-brand-solid');
    });

    it('does not move itself when controlled', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      setup({ value: 'free', onValueChange });
      await user.click(screen.getByText('Pro'));
      expect(onValueChange).toHaveBeenCalledWith('pro');
      expect(radios()[0]).toBeChecked();
      expect(radios()[1]).not.toBeChecked();
    });

    it('follows a controlled value when the parent updates it', () => {
      const { rerender } = setup({ value: 'free' });
      expect(radios()[0]).toBeChecked();
      rerender(
        <RadioGroup label="Plan" value="team">
          <Radio value="free" label="Free" />
          <Radio value="pro" label="Pro" />
          <Radio value="team" label="Team" />
        </RadioGroup>,
      );
      expect(radios()[0]).not.toBeChecked();
      expect(radios()[2]).toBeChecked();
    });

    it('cannot be deselected by clicking the selected radio', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      setup({ defaultValue: 'pro', onValueChange });
      await user.click(screen.getByText('Pro'));
      expect(radios()[1]).toBeChecked();
      expect(onValueChange).not.toHaveBeenCalled();
    });
  });

  describe('inherited settings', () => {
    it('applies the group size to every radio', () => {
      setup({ size: 'md' });
      for (const r of radios()) {
        expect(circleOf(r).className).toContain('size-semantic-2xl');
      }
    });

    it('lets a radio override the group size', () => {
      render(
        <RadioGroup label="Plan" size="md">
          <Radio value="free" label="Free" />
          <Radio value="pro" label="Pro" size="sm" />
        </RadioGroup>,
      );
      const [free, pro] = radios();
      expect(circleOf(free!).className).toContain('size-semantic-2xl');
      expect(circleOf(pro!).className).toContain('size-semantic-xl');
    });

    it('disables every radio in the group', () => {
      setup({ disabled: true });
      expect(radios().every((r) => r.disabled)).toBe(true);
    });

    it('lets a radio opt out of a disabled group', () => {
      render(
        <RadioGroup label="Plan" disabled>
          <Radio value="free" label="Free" />
          <Radio value="pro" label="Pro" disabled={false} />
        </RadioGroup>,
      );
      const [free, pro] = radios();
      expect(free).toBeDisabled();
      expect(pro).toBeEnabled();
    });

    it('marks every radio required, with no invented visual', () => {
      setup({ required: true });
      expect(radios().every((r) => r.required)).toBe(true);
      for (const r of radios()) {
        expect(circleOf(r).className).not.toMatch(/error|required|destructive/);
      }
    });
  });

  describe('native keyboard behaviour', () => {
    it('is a single tab stop for the whole group', async () => {
      const user = userEvent.setup();
      render(
        <>
          <button type="button">before</button>
          <RadioGroup label="Plan" defaultValue="pro">
            <Radio value="free" label="Free" />
            <Radio value="pro" label="Pro" />
            <Radio value="team" label="Team" />
          </RadioGroup>
          <button type="button">after</button>
        </>,
      );
      await user.click(screen.getByText('before'));
      // Tab enters the group at the selected radio...
      await user.tab();
      expect(radios()[1]).toHaveFocus();
      // ...and the next Tab leaves the group entirely rather than visiting siblings.
      await user.tab();
      expect(screen.getByText('after')).toHaveFocus();
    });

    it('enters an unselected group at the first radio', async () => {
      const user = userEvent.setup();
      render(
        <>
          <button type="button">before</button>
          <RadioGroup label="Plan">
            <Radio value="free" label="Free" />
            <Radio value="pro" label="Pro" />
          </RadioGroup>
        </>,
      );
      await user.click(screen.getByText('before'));
      await user.tab();
      expect(radios()[0]).toHaveFocus();
    });

    it('skips a fully disabled group', async () => {
      const user = userEvent.setup();
      render(
        <>
          <button type="button">before</button>
          <RadioGroup label="Plan" disabled>
            <Radio value="free" label="Free" />
          </RadioGroup>
          <button type="button">after</button>
        </>,
      );
      await user.click(screen.getByText('before'));
      await user.tab();
      expect(screen.getByText('after')).toHaveFocus();
    });
  });

  describe('form participation', () => {
    it('submits the selected value under the group name', () => {
      const { container } = render(
        <form>
          <RadioGroup label="Plan" name="plan" defaultValue="pro">
            <Radio value="free" label="Free" />
            <Radio value="pro" label="Pro" />
          </RadioGroup>
        </form>,
      );
      const form = container.querySelector('form') as HTMLFormElement;
      expect([...new FormData(form).entries()]).toEqual([['plan', 'pro']]);
    });

    it('submits nothing when the group has no selection', () => {
      const { container } = render(
        <form>
          <RadioGroup label="Plan" name="plan">
            <Radio value="free" label="Free" />
          </RadioGroup>
        </form>,
      );
      const form = container.querySelector('form') as HTMLFormElement;
      expect([...new FormData(form).entries()]).toEqual([]);
    });
  });

  it('is exported from the package, unlike the context that powers it', () => {
    const barrel = readFileSync(resolve(__dirname, 'index.ts'), 'utf8');
    expect(barrel).toContain('export { RadioGroup }');
    expect(barrel).toContain('export type { RadioGroupProps }');
    expect(barrel).not.toMatch(/^export[^\n]*radio-context/m);
  });

  it('matches its rendered markup', () => {
    const { container } = render(
      <RadioGroup label="Plan" name="plan" defaultValue="pro" size="md">
        <Radio value="free" label="Free" />
        <Radio value="pro" label="Pro" supportingText="Everything in Free, plus more." />
      </RadioGroup>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
