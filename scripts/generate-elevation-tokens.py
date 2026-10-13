"""Generate the elevation foundation from the Figma shadow export.

Like radius, this export is flat: every top-level key aside from Figma metadata
is already a complete token (`shadow-elevation-1`, `shadow-elevation-4-up`).

Unlike every other foundation, elevation is a **composite** token — each one is a
list of shadow layers rather than a single scalar — so nothing is converted to
rem. Shadow geometry is specified in absolute pixels in Figma and stays in pixels
here: a shadow that rescaled with the root font size would change the surface's
apparent height, which is the one thing an elevation scale exists to hold fixed.

Only the redundant `shadow-` prefix is stripped, matching the sibling foundations,
none of which repeat the category name inside the bare token key:

    "shadow-elevation-1" -> key "elevation-1" -> CSS `--shadow-elevation-1`

That lands the tokens in Tailwind's `--shadow-*` namespace, so each one produces a
`shadow-elevation-N` utility with no further configuration.

Layers are emitted in the order the export lists them, which is CSS paint order —
front first. Figma's own effect panel shows the reverse. See the export's
`$transcription` block for why that file is transcribed rather than exported.
"""

import pathlib

from common import css, parser, typescript as ts, validation

SRC = pathlib.Path('figma/exports/primitives/elevation.json')
CSS_OUT = pathlib.Path('src/foundations/elevation/elevation.css')
TS_OUT = pathlib.Path('src/tokens/elevation/index.ts')

PREFIX = 'shadow-'

#: Every Figma layer measured on this scale has these, so a change is a re-export
#: that this generator has not been taught to read rather than a new value.
EXPECTED_X = '0px'
EXPECTED_SPREAD = '0px'

raw = parser.load(SRC)

tokens = {}
seen = set()
for figma_name, node in raw.items():
    if figma_name.startswith('$'):
        continue  # Figma metadata, or this export's transcription note.

    validation.require(
        isinstance(node, dict) and '$value' in node,
        f'{figma_name!r}: expected a token with $value, this export is assumed flat',
    )
    validation.require(
        node.get('$type') == 'shadow',
        f'{figma_name!r}: expected $type "shadow", got {node.get("$type")!r}',
    )
    validation.require(
        figma_name.startswith(PREFIX),
        f'{figma_name!r}: does not start with the expected {PREFIX!r} prefix',
    )

    layers = node['$value']
    validation.require(
        isinstance(layers, list) and len(layers) > 0,
        f'{figma_name!r}: expected a non-empty list of shadow layers',
    )

    rendered = []
    for index, layer in enumerate(layers):
        for field in ('color', 'offsetX', 'offsetY', 'blur', 'spread'):
            validation.require(
                field in layer,
                f'{figma_name!r} layer {index}: missing {field!r}',
            )
        # Asserted rather than assumed: if a future re-export introduces an x
        # offset or a spread, this fails loudly instead of silently dropping it.
        validation.require(
            layer['offsetX'] == EXPECTED_X,
            f'{figma_name!r} layer {index}: x offset is {layer["offsetX"]!r}, '
            f'expected {EXPECTED_X!r} — every measured layer on this scale is vertical only',
        )
        validation.require(
            layer['spread'] == EXPECTED_SPREAD,
            f'{figma_name!r} layer {index}: spread is {layer["spread"]!r}, '
            f'expected {EXPECTED_SPREAD!r} — no layer on this scale spreads',
        )
        rendered.append(
            f'{layer["offsetX"]} {layer["offsetY"]} {layer["blur"]} {layer["spread"]} {layer["color"]}'
        )

    key = figma_name[len(PREFIX) :]
    validation.require_unique(key, seen, 'elevation')
    tokens[key] = {
        'css': ', '.join(rendered),
        'layers': layers,
        'figmaName': figma_name,
    }

validation.require(len(tokens) > 0, f'{SRC}: no elevation tokens found')

css.write_stylesheet(
    CSS_OUT,
    css.block_comment(
        'Elevation tokens.',
        'GENERATED FROM FIGMA — DO NOT EDIT BY HAND.\n'
        'Run `pnpm generate:elevation-tokens` after re-exporting. See\n'
        'docs/Foundations.md for the full reference.',
        'Each token is a two-layer drop shadow, in CSS paint order — front first.\n'
        "Figma's effect panel lists them the other way round.",
        'Values stay in pixels. Shadow geometry is absolute in Figma, and a shadow\n'
        'that rescaled with the root font size would change how high the surface\n'
        'looks — the one thing an elevation scale exists to hold fixed.',
        'Colours are pure black with an alpha, carried as the 8-digit hex Figma\n'
        'reports. They are deliberately not aliased to the semantic shadow colours:\n'
        'all 21 of those are rgb(23 27 34 / a), a different scale, so pointing at\n'
        'one would change the colour. See docs/Foundations.md.',
        '`static` forces every token into the output; without it Tailwind tree-shakes\n'
        'theme variables its own utilities do not reference.',
    ),
    [
        (
            None,
            [
                css.declaration(f'shadow-{key}', t['css'], comment=f'{len(t["layers"])} layers')
                for key, t in tokens.items()
            ],
        )
    ],
)

ts.write_module(
    TS_OUT,
    ts.banner(
        'Elevation tokens.',
        'GENERATED FROM FIGMA — DO NOT EDIT BY HAND.\n'
        'Run `pnpm generate:elevation-tokens` after re-exporting. Values match\n'
        'src/foundations/elevation/elevation.css exactly.',
        'Composite tokens: each value is a full CSS box-shadow list, in paint order.\n'
        'See docs/Foundations.md.',
    ),
    [
        ts.const_object(
            'elevation',
            [f"  {ts.quote_key(key)}: '{t['css']}'," for key, t in tokens.items()],
            docs='The elevation scale, keyed by Figma name with the `shadow-` prefix removed.',
        ),
        ts.const_object(
            'elevationSource',
            [
                f"  {ts.quote_key(key)}: {{ figmaName: '{t['figmaName']}', "
                f'layers: {len(t["layers"])} }},'
                for key, t in tokens.items()
            ],
            docs='Original Figma name and layer count for each token, for traceability.',
        ),
        ts.type_alias(
            'ElevationToken',
            'keyof typeof elevation',
            docs='An elevation token key, e.g. `elevation-1` or `elevation-4-up`.',
        ),
        ts.arrow_const(
            'elevationVar',
            'token: ElevationToken',
            '`--shadow-${token}` as const',
            docs='The CSS custom property for an elevation token, e.g. `--shadow-elevation-4`.',
        ),
    ],
)

print(f'✅ {len(tokens)} elevation tokens')
print(f'   {CSS_OUT}')
print(f'   {TS_OUT}')
