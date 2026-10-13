"""Generate the radius foundation from the Figma token export.

Unlike colors, typography and spacing, this export has no wrapping collection
name — every top-level key (aside from the Figma `$extensions` metadata block)
is already a complete token: `radius-xxs`, `radius-full`, and so on.

Values are copied verbatim from Figma and converted px -> rem, exactly like
every other numeric token so far. `radius-full` (9999) is put through the same
pipeline as every other step — no special-casing — because 9999 / 16 is an
exact, terminating rem value (624.9375rem), so nothing is lost or reinterpreted
by treating it uniformly. The original Figma name and pixel value are kept in
`radiusSource` for traceability.

Only the redundant `radius-` prefix is stripped from each key, to match the
sibling foundations (colors, typography, spacing), none of which repeat the
category name inside the bare token key:

    "radius-xxs" -> token key "xxs" -> CSS `--radius-xxs` -> TS `radius.xxs`
"""

import pathlib

from common import css, parser, typescript as ts, validation

SRC = pathlib.Path('figma/exports/primitives/radius.json')
CSS_OUT = pathlib.Path('src/foundations/radius/radius.css')
TS_OUT = pathlib.Path('src/tokens/radius/index.ts')

PREFIX = 'radius-'

raw = parser.load(SRC)

tokens = {}
seen = set()
for figma_name, node in raw.items():
    if figma_name.startswith('$'):
        continue  # Figma metadata (e.g. $extensions.modeName), not a token.

    validation.require(
        isinstance(node, dict) and '$value' in node,
        f'{figma_name!r}: expected a token with $value, this export is assumed flat',
    )
    validation.require(
        node.get('$type') == 'number',
        f'{figma_name!r}: expected $type "number", got {node.get("$type")!r}',
    )
    validation.require(
        figma_name.startswith(PREFIX),
        f'{figma_name!r}: does not start with the expected {PREFIX!r} prefix',
    )

    key = figma_name[len(PREFIX) :]
    validation.require_unique(key, seen, 'radius')

    px = node['$value']
    tokens[key] = {'rem': parser.rem(px), 'px': px, 'figmaName': figma_name}

css.write_stylesheet(
    CSS_OUT,
    css.block_comment(
        'Radius tokens.',
        'GENERATED FROM FIGMA — DO NOT EDIT BY HAND.\n'
        'Run `pnpm generate:radius-tokens` after re-exporting. See\n'
        'docs/Foundations.md for the full reference.',
        f'Values are the Figma px values divided by {parser.ROOT_FONT_SIZE}, matching typography\n'
        'and spacing. `full` goes through the same conversion as every other step —\n'
        'it is not a special case.',
        '`static` forces every token into the output; without it Tailwind tree-shakes\n'
        'theme variables its own utilities do not reference.',
    ),
    [(None, [css.declaration(f'radius-{key}', t['rem'], comment=f'{t["px"]}px') for key, t in tokens.items()])],
)

ts.write_module(
    TS_OUT,
    ts.banner(
        'Radius tokens.',
        'GENERATED FROM FIGMA — DO NOT EDIT BY HAND.\n'
        'Run `pnpm generate:radius-tokens` after re-exporting. Values match\n'
        'src/foundations/radius/radius.css exactly.',
        f'Values are the Figma px values divided by {parser.ROOT_FONT_SIZE}. See docs/Foundations.md.',
    ),
    [
        ts.const_object(
            'radius',
            [f"  {ts.quote_key(key)}: '{t['rem']}'," for key, t in tokens.items()],
            docs='The radius scale, keyed by Figma name with the `radius-` prefix removed.',
        ),
        ts.const_object(
            'radiusSource',
            [
                f"  {ts.quote_key(key)}: {{ figmaName: '{t['figmaName']}', px: {t['px']} }},"
                for key, t in tokens.items()
            ],
            docs='Original Figma name and pixel value for each token, for traceability.',
        ),
        ts.type_alias('RadiusToken', 'keyof typeof radius', docs='A radius token key, e.g. `md` or `full`.'),
        ts.arrow_const(
            'radiusVar',
            'token: RadiusToken',
            '`--radius-${token}` as const',
            docs='The CSS custom property for a radius token, e.g. `--radius-md`.',
        ),
    ],
)

print(f'✅ {len(tokens)} radius tokens')
print(f'   {CSS_OUT}')
print(f'   {TS_OUT}')
