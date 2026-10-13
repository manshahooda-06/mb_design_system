"""Generate the semantic spacing collection from the Figma export.

A semantic layer over the primitive spacing foundation, which remains the source
of truth. No token here owns a value — each aliases a primitive spacing step and
is emitted as a `var()` reference so a change to the primitive propagates:

    spacing-md  ->  aliases Spacing/2 (8px)
                ->  --spacing-semantic-md: var(--spacing-2)

Like the container collection, this reads TWO exports: the semantic collection
and the primitives it aliases. Every alias is resolved against the real
primitive and the build fails if a target is missing or if a semantic token's
own `$value` disagrees with the primitive it claims to alias.

Namespace
---------
Tokens are emitted as `--spacing-semantic-<key>` via `css.semantic_name()`, the
shared convention every semantic collection uses.

The qualifier is not cosmetic. Tailwind's `--spacing-*` and `--container-*`
namespaces both feed `w-*`, `min-w-*`, `max-w-*` and `basis-*`, and spacing wins,
so emitting a bare `--spacing-md` would silently redefine `max-w-md` from 28rem
to 8px — 44 utilities across four families, for the 11 t-shirt names Tailwind
also ships as container sizes. `--spacing-semantic-md` cannot collide, because
Tailwind has no value named `semantic-md`.

The tokens still land in the spacing namespace, so they produce ordinary spacing
utilities: `gap-semantic-md`, `p-semantic-xl`, `mt-semantic-xs`.

Naming
------
The redundant `spacing-` prefix is stripped, matching the radius foundation and
the container collection:

    "spacing-md" -> key "md" -> --spacing-semantic-md -> semanticSpacing.md

TypeScript exports are prefixed `semanticSpacing*` rather than `spacing*` to
avoid colliding with the primitive foundation's own exports.
"""

import pathlib
import re

from common import css, parser, typescript as ts, validation

SRC = pathlib.Path('figma/exports/semantic/spacing.json')
PRIMITIVES = pathlib.Path('figma/exports/primitives/colors.json')
CSS_OUT = pathlib.Path('src/semantic/spacing/spacing.css')
TS_OUT = pathlib.Path('src/tokens/semantic/spacing/index.ts')

PREFIX = 'spacing-'
ALIAS_COLLECTION = 'Spacing'

ONE_DOT_LEADER = '․'
SPACING_NAME = re.compile(r'^([\d' + ONE_DOT_LEADER + r'.]+)\s*\((\d[\d,]*)px\)$')


def primitive_key(figma_name):
    """`0․5 (2px)` -> `0-5`, matching the spacing generator's own normalization."""
    match = SPACING_NAME.match(figma_name)
    validation.require(match, f'cannot derive a spacing key from {figma_name!r}')
    return match.group(1).replace(ONE_DOT_LEADER, '.').replace('.', '-')


raw = parser.load(SRC)
primitives = parser.load(PRIMITIVES)
validation.require(
    ALIAS_COLLECTION in primitives,
    f'{PRIMITIVES} has no {ALIAS_COLLECTION} collection to resolve aliases against',
)
spacing_primitives = primitives[ALIAS_COLLECTION]

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

    # A semantic token with no alias has nothing to be semantic *about*.
    alias = node.get('$extensions', {}).get('com.figma.aliasData')
    validation.require(
        alias, f'{figma_name!r}: no aliasData — a semantic token must reference a primitive'
    )

    collection, _, prim_name = alias['targetVariableName'].partition('/')
    validation.require(
        collection == ALIAS_COLLECTION,
        f'{figma_name!r}: aliases {collection!r}, but semantic spacing must alias '
        f'{ALIAS_COLLECTION!r}',
    )
    validation.require(
        prim_name in spacing_primitives,
        f'{figma_name!r}: aliases {alias["targetVariableName"]!r}, which does not exist '
        f'in {PRIMITIVES}',
    )

    prim_px = spacing_primitives[prim_name]['$value']
    semantic_px = node['$value']
    validation.require(
        prim_px == semantic_px,
        f'{figma_name!r}: $value is {semantic_px} but the primitive it aliases '
        f'({alias["targetVariableName"]}) is {prim_px} — the export contradicts itself',
    )

    key = figma_name[len(PREFIX) :]
    validation.require_unique(key, seen, 'semantic spacing')

    prim_key = primitive_key(prim_name)
    tokens[key] = {
        'figmaName': figma_name,
        'px': semantic_px,
        'resolved': parser.rem(prim_px),
        'aliasOf': alias['targetVariableName'],
        'primitiveToken': f'spacing.{prim_key}',
        'primitiveVar': f'--spacing-{prim_key}',
        'cssVar': f'--{css.semantic_name("spacing", key)}',
    }

css.write_stylesheet(
    CSS_OUT,
    css.block_comment(
        'Semantic spacing tokens.',
        'GENERATED FROM FIGMA — DO NOT EDIT BY HAND.\n'
        'Run `pnpm generate:semantic-spacing-tokens` after re-exporting. See\n'
        'docs/Semantic-Tokens.md for the full reference.',
        'Each token aliases a primitive spacing step rather than carrying its own\n'
        'value, and is emitted as a var() reference so a change to the primitive\n'
        'propagates automatically.',
        'Names are qualified --spacing-semantic-* so they cannot shadow Tailwind\n'
        'values in the same namespace. A bare --spacing-md would hijack max-w-md,\n'
        'w-md, min-w-md and basis-md, which read --container-* by default.',
        'They still live in the spacing namespace, so they produce ordinary spacing\n'
        'utilities: gap-semantic-md, p-semantic-xl, mt-semantic-xs.',
        'This scale is independent of the radius scale: a shared name such as `lg`\n'
        'or `2xl` may mean a different value in each. See docs/Semantic-Tokens.md.',
    ),
    [
        (
            None,
            [
                css.declaration(
                    t['cssVar'].removeprefix('--'),
                    f'var({t["primitiveVar"]})',
                    comment=f'{t["px"]}px via {t["aliasOf"]}',
                )
                for t in tokens.values()
            ],
        )
    ],
)

ts.write_module(
    TS_OUT,
    ts.banner(
        'Semantic spacing tokens.',
        'GENERATED FROM FIGMA — DO NOT EDIT BY HAND.\n'
        'Run `pnpm generate:semantic-spacing-tokens` after re-exporting. Values\n'
        'match src/semantic/spacing/spacing.css exactly.',
        'Exports are prefixed `semanticSpacing` to avoid colliding with the\n'
        'primitive spacing foundation, which exports `spacing`.',
    ),
    [
        ts.const_object(
            'semanticSpacing',
            [
                f"  {ts.quote_key(key)}: 'var({t['primitiveVar']})',"
                for key, t in tokens.items()
            ],
            docs=ts.doc_block(
                'Semantic spacing tokens, as emitted in CSS.',
                'Each value is a `var()` reference to the primitive spacing step it aliases,\n'
                'so a change to that primitive propagates here automatically. Use these in\n'
                'CSS contexts; for a concrete value use `semanticSpacingResolved`.',
            ),
        ),
        ts.const_object(
            'semanticSpacingResolved',
            [f"  {ts.quote_key(key)}: '{t['resolved']}'," for key, t in tokens.items()],
            docs='The literal value each alias resolves to, for code that needs a concrete value.',
        ),
        ts.const_object(
            'semanticSpacingSource',
            [
                f'  {ts.quote_key(key)}: {{\n'
                f"    figmaName: '{t['figmaName']}',\n"
                f'    px: {t["px"]},\n'
                f"    aliasOf: '{t['aliasOf']}',\n"
                f"    primitiveToken: '{t['primitiveToken']}',\n"
                f"    primitiveVar: '{t['primitiveVar']}',\n"
                f"    cssVar: '{t['cssVar']}',\n"
                f'  }},'
                for key, t in tokens.items()
            ],
            docs='Full provenance for each token: its Figma name, the primitive it aliases, and the CSS variable it is emitted as.',
        ),
        ts.const_array(
            'semanticSpacingScale',
            tokens,
            docs=ts.doc_block(
                'Token keys in ascending scale order.',
                'Iterate this rather than `Object.keys(semanticSpacing)`: JavaScript hoists\n'
                'integer-like keys above string keys, and while no key here is a canonical\n'
                'integer today, relying on object order for a scale is a hazard worth\n'
                'avoiding outright.',
            ),
        ),
        ts.type_alias(
            'SemanticSpacingToken',
            'keyof typeof semanticSpacing',
            docs='A semantic spacing token key, e.g. `md` or `2xl`.',
        ),
        ts.arrow_const(
            'semanticSpacingVar',
            'token: SemanticSpacingToken',
            'semanticSpacingSource[token].cssVar',
            docs='The CSS custom property a semantic spacing token is emitted as, e.g. `--spacing-md`.',
        ),
    ],
)

print(f'✅ {len(tokens)} semantic spacing tokens, all aliases resolved')
for key, t in tokens.items():
    print(f'   {key:6} {t["cssVar"]:18} -> var({t["primitiveVar"]}) = {t["resolved"]:>9}  ({t["px"]}px)')
print(f'   {CSS_OUT}')
print(f'   {TS_OUT}')
