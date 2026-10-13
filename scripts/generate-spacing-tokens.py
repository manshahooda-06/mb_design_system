"""Generate the spacing foundation from the Figma token export.

The `Spacing` collection lives in the same full-variable export as `Colors`.
Values are copied verbatim; only names are normalized.

Figma names embed the pixel value and use U+2024 ONE DOT LEADER for the decimal
point, because Figma reserves '.' as its group separator:

    "0(U+2024)5 (2px)"  ->  spacing key "0-5", value 0.125rem

Keys use '-' for the fractional part because a literal '.' is not valid in a CSS
custom property name without escaping. The original Figma name, pixel value and
step number are all preserved in `spacingSource` for traceability.

px is divided by 16 to give rem, matching the typography foundation.

The `Filled Text` collection in the same file is ignored entirely.
"""

import pathlib
import re

from common import css, parser, typescript as ts, validation

SRC = pathlib.Path('figma/exports/primitives/colors.json')
CSS_OUT = pathlib.Path('src/foundations/spacing/spacing.css')
TS_OUT = pathlib.Path('src/tokens/spacing/index.ts')

ONE_DOT_LEADER = '․'

# "0․5 (2px)" / "256 (1,024px)"
NAME = re.compile(r'^([\d' + ONE_DOT_LEADER + r'.]+)\s*\((\d[\d,]*)px\)$')

tokens = {}
seen = set()
for path, node in parser.collection(parser.load(SRC), 'Spacing'):
    figma_name = path[-1]
    match = NAME.match(figma_name)
    validation.require(match, f'unparseable spacing name: {figma_name!r}')

    step_text = match.group(1).replace(ONE_DOT_LEADER, '.')
    label_px = int(match.group(2).replace(',', ''))
    value_px = node['$value']

    # The name embeds the pixel value; refuse to guess if the two disagree.
    validation.require(
        label_px == value_px,
        f'{figma_name!r}: label says {label_px}px but $value is {value_px}',
    )
    validation.require_int_ratio(
        repr(figma_name), float(step_text) * 4, value_px, f'step {step_text} x 4'
    )

    key = step_text.replace('.', '-')
    validation.require_unique(key, seen, 'spacing')
    tokens[key] = {
        'rem': parser.rem(value_px),
        'px': value_px,
        'step': float(step_text),
        'figmaName': figma_name,
    }

css.write_stylesheet(
    CSS_OUT,
    css.block_comment(
        'Spacing tokens.',
        'GENERATED FROM FIGMA — DO NOT EDIT BY HAND.\n'
        'Run `pnpm generate:spacing-tokens` after re-exporting. See\n'
        'docs/Foundations.md for the full reference.',
        f'Values are the Figma px values divided by {parser.ROOT_FONT_SIZE}, matching the typography\n'
        "foundation, so spacing scales with the reader's browser font-size setting.",
        "Keys are Figma's step numbers (step x 4 = px). Fractional steps use '-'\n"
        "rather than '.', which is not valid in a CSS custom property name.",
        '`static` forces every token into the output; without it Tailwind tree-shakes\n'
        'theme variables its own utilities do not reference.',
    ),
    [
        (
            None,
            [
                css.declaration(f'spacing-{key}', t['rem'], comment=f'{t["px"]}px')
                for key, t in tokens.items()
            ],
        )
    ],
)

ts.write_module(
    TS_OUT,
    ts.banner(
        'Spacing tokens.',
        'GENERATED FROM FIGMA — DO NOT EDIT BY HAND.\n'
        'Run `pnpm generate:spacing-tokens` after re-exporting. Values match\n'
        'src/foundations/spacing/spacing.css exactly.',
        f"Values are the Figma px values divided by {parser.ROOT_FONT_SIZE}. Keys are Figma's step\n"
        "numbers, with '-' for the fractional part. See docs/Foundations.md.",
    ),
    [
        ts.const_object(
            'spacing',
            [f"  '{key}': '{t['rem']}'," for key, t in tokens.items()],
            docs='The spacing scale, keyed by Figma step number.',
        ),
        ts.const_object(
            'spacingSource',
            [
                f"  '{key}': {{ figmaName: '{t['figmaName']}', px: {t['px']}, step: {t['step']:g} }},"
                for key, t in tokens.items()
            ],
            docs='Original Figma name, pixel value and step for each token, for traceability.',
        ),
        ts.const_array(
            'spacingScale',
            tokens,
            docs=ts.doc_block(
                'Token keys in ascending scale order.',
                'Always iterate this rather than `Object.keys(spacing)`: JavaScript hoists\n'
                "integer-like keys ('4') above string keys ('0-5'), so object enumeration\n"
                'order does not match the scale.',
            ),
        ),
        ts.type_alias(
            'SpacingToken', 'keyof typeof spacing', docs='A spacing token key, e.g. `4` or `0-5`.'
        ),
        ts.arrow_const(
            'spacingVar',
            'token: SpacingToken',
            '`--spacing-${token}` as const',
            docs='The CSS custom property for a spacing token, e.g. `--spacing-4`.',
        ),
    ],
)

print(f'✅ {len(tokens)} spacing tokens')
print(f'   {CSS_OUT}')
print(f'   {TS_OUT}')
