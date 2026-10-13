"""Generate the typography foundation from the Figma token export.

Values are copied verbatim from Figma. Two transformations are applied, both
approved and documented in docs/Foundations.md:

  1. px -> rem (divided by 16) so type scales with the user's browser setting.
  2. Weight names -> CSS numerics using the standard OpenType mapping
     (Light 300, Regular 400, Medium 500, Semibold 600, Bold 700, Extrabold 800).

Names are normalized to kebab-case. Nothing else is changed.

Deliberately omitted, because the export carries no information in them:
  - Letter Spacing     0 on all 118 styles
  - Paragraph spacing  0 on all 118 styles
  - Mobile/Caption-lg-{Light,Regular,Medium,Semibold}, which contain only
    `Paragraph spacing` and no size, weight or line height.
"""

import pathlib

from common import css, parser, typescript as ts, validation

SRC = pathlib.Path('figma/exports/primitives/typography.json')
CSS_OUT = pathlib.Path('src/foundations/typography/typography.css')
TS_OUT = pathlib.Path('src/tokens/typography/index.ts')

WEIGHT_SCALE = {
    'Light': 300,
    'Regular': 400,
    'Medium': 500,
    'Semibold': 600,
    'Bold': 700,
    'Extrabold': 800,
}

REQUIRED = {'Size', 'Line Height', 'Weight'}

raw = parser.load(SRC)

# --- font families -----------------------------------------------------------
families = {}
for path, node in parser.collection(raw, 'Font Family'):
    # "Font Family Body" -> "body"
    families[parser.kebab(path[-1].replace('Font Family', '').strip())] = node['$value']

# --- composite text styles ---------------------------------------------------
styles = {}
for path, node in parser.collection(raw, 'Group'):
    styles.setdefault((path[0], '/'.join(path[1:-1])), {})[path[-1]] = node['$value']

complete = {k: v for k, v in styles.items() if REQUIRED <= set(v)}

# Parse "[Banner/]Category-scale-Weight" and preserve Figma's ordering.
ramps = {}  # slot -> {'size', 'lineHeight'}
text_styles = {}  # full token name -> {...}
ramp_order, style_order = [], []

for (breakpoint, name), value in complete.items():
    base = f'banner-{name[len("Banner/"):]}' if name.startswith('Banner/') else name
    category, scale, weight = base.rsplit('-', 2)
    validation.require(
        weight in WEIGHT_SCALE, f'unrecognized weight {weight!r} in {breakpoint}/{name}'
    )
    # The weight is taken from the style name, so cross-check it against the
    # Weight property. They agree throughout the current export; if a future one
    # disagrees, that is a Figma authoring error and must not be papered over.
    validation.require(
        value['Weight'] == weight,
        f'{breakpoint}/{name}: name says weight {weight!r} '
        f'but the Weight property says {value["Weight"]!r}',
    )

    slot = parser.kebab(f'{breakpoint}-{category}-{scale}')
    entry = {'size': parser.rem(value['Size']), 'lineHeight': parser.rem(value['Line Height'])}
    validation.require(
        ramps.get(slot, entry) == entry, f'conflicting size/line-height for ramp {slot}'
    )
    if slot not in ramps:
        ramp_order.append(slot)
    ramps[slot] = entry

    token = parser.kebab(f'{breakpoint}-{base}')
    text_styles[token] = {**entry, 'weight': WEIGHT_SCALE[weight]}
    style_order.append(token)

used_weights = {s['weight'] for s in text_styles.values()}
weights = {k.lower(): v for k, v in WEIGHT_SCALE.items() if v in used_weights}

SHARED_NOTE = (
    f'Sizes and line heights are the Figma px values divided by {parser.ROOT_FONT_SIZE}, so type\n'
    "respects the reader's browser font-size setting. Weight names are mapped to\n"
    'their standard CSS numeric equivalents.'
)

# Group the size slots by breakpoint so each gets its own labelled section.
breakpoints = parser.ordered_unique(slot.split('-', 1)[0] for slot in ramp_order)
size_sections = [
    (
        f'{breakpoint} — font size and line height',
        [
            line
            for slot in ramp_order
            if slot.split('-', 1)[0] == breakpoint
            for line in (
                css.declaration(f'text-{slot}', ramps[slot]['size']),
                css.declaration(f'text-{slot}--line-height', ramps[slot]['lineHeight']),
            )
        ],
    )
    for breakpoint in breakpoints
]

css.write_stylesheet(
    CSS_OUT,
    css.block_comment(
        'Typography tokens.',
        'GENERATED FROM FIGMA — DO NOT EDIT BY HAND.\n'
        'Run `pnpm generate:typography-tokens` after re-exporting. See\n'
        'docs/Foundations.md for the full reference and rationale.',
        SHARED_NOTE,
        '`static` forces every token into the output; without it Tailwind tree-shakes\n'
        'theme variables its own utilities do not reference.',
    ),
    [
        ('font family', [css.declaration(f'font-{name}', f"'{value}'") for name, value in families.items()]),
        ('font weight', [css.declaration(f'font-weight-{name}', value) for name, value in weights.items()]),
        *size_sections,
    ],
)


def bare_or_quoted(key):
    """Figma family and weight names are bare unless they contain a hyphen."""
    return f"'{key}'" if '-' in key else key


ts.write_module(
    TS_OUT,
    ts.banner(
        'Typography tokens.',
        'GENERATED FROM FIGMA — DO NOT EDIT BY HAND.\n'
        'Run `pnpm generate:typography-tokens` after re-exporting. Values match\n'
        'src/foundations/typography/typography.css exactly.',
        f'Sizes and line heights are the Figma px values divided by {parser.ROOT_FONT_SIZE}. Weight names\n'
        'are mapped to their standard CSS numeric equivalents. See docs/Foundations.md.',
    ),
    [
        ts.const_object(
            'fontFamily',
            [f"  {bare_or_quoted(name)}: '{value}'," for name, value in families.items()],
            docs='Font families, keyed by role.',
        ),
        ts.const_object(
            'fontWeight',
            [f'  {bare_or_quoted(name)}: {value},' for name, value in weights.items()],
            docs='Weight scale, mapped from the Figma weight names.',
        ),
        ts.const_object(
            'fontSize',
            [
                f"  '{slot}': {{ size: '{ramps[slot]['size']}', "
                f"lineHeight: '{ramps[slot]['lineHeight']}' }},"
                for slot in ramp_order
            ],
            docs='Size and line-height pairs, keyed by `<breakpoint>-<category>-<scale>`.',
        ),
        ts.const_object(
            'textStyles',
            [
                f"  '{token}': {{ fontSize: '{text_styles[token]['size']}', "
                f"lineHeight: '{text_styles[token]['lineHeight']}', "
                f"fontWeight: {text_styles[token]['weight']} }},"
                for token in style_order
            ],
            docs='Every composite text style, keyed by `<breakpoint>-<category>-<scale>-<weight>`.',
        ),
        ts.type_alias('FontFamily', 'keyof typeof fontFamily', docs='A font family role, e.g. `body`.'),
        ts.type_alias('FontWeight', 'keyof typeof fontWeight', docs='A weight name, e.g. `semibold`.'),
        ts.type_alias(
            'FontSizeToken', 'keyof typeof fontSize', docs='A size slot, e.g. `mobile-body-md`.'
        ),
        ts.type_alias(
            'TextStyleToken',
            'keyof typeof textStyles',
            docs='A composite text style, e.g. `mobile-body-md-regular`.',
        ),
        ts.arrow_const(
            'textVar',
            'token: FontSizeToken',
            '`--text-${token}` as const',
            docs='The CSS custom property for a size slot, e.g. `--text-mobile-body-md`.',
        ),
    ],
)

skipped = len(styles) - len(complete)
print(
    f'✅ {len(families)} families, {len(weights)} weights, '
    f'{len(ramps)} size slots, {len(text_styles)} text styles'
)
print(f'   skipped {skipped} incomplete style(s) from the export')
print(f'   {CSS_OUT}')
print(f'   {TS_OUT}')
