"""Generate the primitive color foundation from the Figma token export.

Values are copied verbatim from Figma. Only token *names* are normalized:
  "gray-light mode"       -> gray-light
  "gray-dark mode"        -> gray-dark
  "gray-dark mode alpha"  -> gray-dark-alpha
  "off white"             -> off-white
"""

import pathlib

from common import css, parser, typescript as ts

SRC = pathlib.Path('figma/exports/primitives/colors.json')
CSS_OUT = pathlib.Path('src/foundations/colors/colors.css')
TS_OUT = pathlib.Path('src/tokens/colors/index.ts')

# Group and token renaming, and the hex/rgb() value format, live in
# common/parser.py so the semantic colour generator derives identical names and
# values when it aliases a primitive.

tokens = parser.collection(parser.load(SRC), 'Colors')

groups = {}
for path, node in tokens:
    group = parser.color_group(path[0])
    token = parser.color_token(path[1])
    groups.setdefault(group, {})[token] = parser.color_value(node['$value'])

# Preserve Figma's own group ordering for traceability.
order = parser.ordered_unique(parser.color_group(path[0]) for path, _ in tokens)


def steps(group):
    return sorted(groups[group], key=parser.step_sort)


css.write_stylesheet(
    CSS_OUT,
    css.block_comment(
        'Primitive color tokens.',
        'GENERATED FROM FIGMA — DO NOT EDIT BY HAND.\n'
        'Values are verbatim from the Figma Design System export; only names are\n'
        'normalized to kebab-case. To change a value, change it in Figma and\n'
        're-export. See docs/Foundations.md.',
        'Fully opaque tokens are emitted as hex. Tokens with alpha are emitted as\n'
        'rgb(r g b / a) so the alpha channel is preserved exactly.',
        '`static` forces every token into the output. Without it Tailwind tree-shakes\n'
        'theme variables that its own utilities do not reference, which would drop\n'
        'tokens consumers rely on from the published stylesheet.',
    ),
    [
        (group, [css.declaration(f'color-{group}-{name}', groups[group][name]) for name in steps(group)])
        for group in order
    ],
)

nested = []
for index, group in enumerate(order):
    if index:
        nested.append('')
    key = f"'{group}'" if '-' in group else group
    nested.append(f'  {key}: {{')
    for name in steps(group):
        bare = name if name.isdigit() else f"'{name}'"
        nested.append(f"    {bare}: '{groups[group][name]}',")
    nested.append('  },')

ts.write_module(
    TS_OUT,
    ts.banner(
        'Primitive color tokens.',
        'GENERATED FROM FIGMA — DO NOT EDIT BY HAND.\n'
        'Values are verbatim from the Figma Design System export and match\n'
        'src/foundations/colors/colors.css exactly. To change a value, change it in\n'
        'Figma and re-export. See docs/Foundations.md.',
    ),
    [
        ts.const_object('colors', nested),
        ts.const_object(
            'colorTokens',
            [
                f"  '{group}-{name}': '{groups[group][name]}',"
                for group in order
                for name in steps(group)
            ],
            docs='Flat lookup keyed by `<group>-<step>`, mirroring the CSS variable names.',
        ),
        ts.type_alias('ColorGroup', 'keyof typeof colors', docs='A primitive color group, e.g. `brand`.'),
        ts.type_alias(
            'ColorToken', 'keyof typeof colorTokens', docs='A flat token name, e.g. `brand-500`.'
        ),
        ts.type_alias(
            'ColorScaleStep',
            "keyof (typeof colors)['brand']",
            docs='Steps available on the 12-step ramps.',
        ),
        ts.arrow_const(
            'colorVar',
            'token: ColorToken',
            '`--color-${token}` as const',
            docs='The CSS custom property name for a token, e.g. `--color-brand-500`.',
        ),
    ],
)

total = sum(len(v) for v in groups.values())
print(f'✅ {total} tokens across {len(order)} groups')
print(f'   {CSS_OUT}')
print(f'   {TS_OUT}')
