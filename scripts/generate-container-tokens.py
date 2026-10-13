"""Generate the semantic container token collection from the Figma export.

This is the first *semantic* collection, not a primitive foundation. Semantic
tokens do not carry their own values — each one aliases a primitive, and the
generated CSS preserves that relationship as a `var()` reference rather than
copying the value:

    container-padding-mobile  ->  aliases Spacing/4 (16px)
                              ->  --spacing-container-padding-mobile: var(--spacing-4)

Copying `1rem` here instead would mean a future change to the spacing primitive
silently failed to reach the semantic layer. The reference propagates.

Because of that, this generator reads TWO exports: the semantic collection and
the primitives it aliases. Every alias is resolved against the real primitive
and the build fails if a target is missing, or if the semantic token's own
`$value` disagrees with the primitive it claims to alias.

Tailwind namespace mapping
--------------------------
Tailwind v4 owns `--container-*` (it drives `max-w-*`), so emitting every token
under a `--container-` prefix would produce nonsense utilities such as
`max-w-padding-mobile`. Instead each token is mapped explicitly to the namespace
that gives it real utilities: padding into `--spacing-*` (`p-*`, `px-*`, `gap-*`),
max-width into `--container-*` (`max-w-*`).

That mapping is a design decision that cannot be derived from the Figma name, so
it is declared in NAMESPACE below. A token missing from the map fails the build
rather than being guessed into a namespace.
"""

import pathlib
import re

from common import css, parser, typescript as ts, validation

SRC = pathlib.Path('figma/exports/semantic/container.json')
PRIMITIVES = pathlib.Path('figma/exports/primitives/colors.json')
CSS_OUT = pathlib.Path('src/semantic/container/container.css')
TS_OUT = pathlib.Path('src/tokens/semantic/container/index.ts')

PREFIX = 'container-'

#: figma name -> (tailwind namespace, variable name within it)
NAMESPACE = {
    'container-padding-mobile': ('spacing', 'container-padding-mobile'),
    'container-padding-desktop': ('spacing', 'container-padding-desktop'),
    # `--container-*` already means max-width in Tailwind, so the property name
    # would be redundant: `--container-desktop` yields `max-w-desktop`.
    'container-max-width-desktop': ('container', 'desktop'),
}

#: Which primitive collections semantic tokens may alias, and how to reach them.
ONE_DOT_LEADER = '․'
SPACING_NAME = re.compile(r'^([\d' + ONE_DOT_LEADER + r'.]+)\s*\((\d[\d,]*)px\)$')


def spacing_key(figma_name):
    """`4 (16px)` -> `4`, matching the spacing generator's own normalization."""
    match = SPACING_NAME.match(figma_name)
    validation.require(match, f'cannot derive a spacing key from {figma_name!r}')
    return match.group(1).replace(ONE_DOT_LEADER, '.').replace('.', '-')


# --- load both sides of the alias relationship -------------------------------
raw = parser.load(SRC)
primitives = parser.load(PRIMITIVES)
validation.require(
    'Spacing' in primitives, f'{PRIMITIVES} has no Spacing collection to resolve aliases against'
)
spacing_primitives = primitives['Spacing']

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
        figma_name.startswith(PREFIX),
        f'{figma_name!r}: does not start with the expected {PREFIX!r} prefix',
    )
    validation.require(
        figma_name in NAMESPACE,
        f'{figma_name!r}: no Tailwind namespace mapping declared. Add it to NAMESPACE in '
        f'{__file__} — a semantic token must not be guessed into a namespace.',
    )

    # A semantic token with no alias has nothing to be semantic *about*.
    alias = node.get('$extensions', {}).get('com.figma.aliasData')
    validation.require(
        alias, f'{figma_name!r}: no aliasData — a semantic token must reference a primitive'
    )

    collection, _, primitive_name = alias['targetVariableName'].partition('/')
    validation.require(
        collection == 'Spacing',
        f'{figma_name!r}: aliases {collection!r}, but only Spacing is supported so far',
    )
    validation.require(
        primitive_name in spacing_primitives,
        f'{figma_name!r}: aliases {alias["targetVariableName"]!r}, which does not exist '
        f'in {PRIMITIVES}',
    )

    primitive_px = spacing_primitives[primitive_name]['$value']
    semantic_px = node['$value']
    validation.require(
        primitive_px == semantic_px,
        f'{figma_name!r}: $value is {semantic_px} but the primitive it aliases '
        f'({alias["targetVariableName"]}) is {primitive_px} — the export contradicts itself',
    )

    namespace, var_name = NAMESPACE[figma_name]
    key = figma_name[len(PREFIX) :]
    validation.require_unique(key, seen, 'container')

    primitive_key = spacing_key(primitive_name)
    tokens[key] = {
        'figmaName': figma_name,
        'px': semantic_px,
        'resolved': parser.rem(primitive_px),
        'aliasOf': alias['targetVariableName'],
        'primitiveToken': f'spacing.{primitive_key}',
        'primitiveVar': f'--spacing-{primitive_key}',
        'cssVar': f'--{namespace}-{var_name}',
        'namespace': namespace,
    }

# --- CSS ---------------------------------------------------------------------
by_namespace = {}
for key, t in tokens.items():
    by_namespace.setdefault(t['namespace'], []).append((key, t))

LABEL = {
    'spacing': 'padding — in the spacing namespace, so p-* / px-* / gap-* utilities work',
    'container': 'max width — in the container namespace, so max-w-* works',
}

css.write_stylesheet(
    CSS_OUT,
    css.block_comment(
        'Semantic container tokens.',
        'GENERATED FROM FIGMA — DO NOT EDIT BY HAND.\n'
        'Run `pnpm generate:container-tokens` after re-exporting. See\n'
        'docs/Semantic-Tokens.md for the full reference.',
        'These are semantic tokens: each one aliases a primitive rather than\n'
        'carrying its own value, and is emitted as a var() reference so a change\n'
        'to the primitive propagates automatically.',
        'Tokens are grouped by Tailwind namespace rather than by Figma name, so\n'
        'each yields useful utilities. `--container-*` is Tailwind\'s max-width\n'
        'namespace, which is why the max-width token drops its property name.',
    ),
    [
        (
            LABEL[namespace],
            [
                css.declaration(
                    t['cssVar'].removeprefix('--'),
                    f'var({t["primitiveVar"]})',
                    comment=f'{t["px"]}px via {t["aliasOf"]}',
                )
                for _, t in entries
            ],
        )
        for namespace, entries in by_namespace.items()
    ],
)

# --- TypeScript --------------------------------------------------------------
ts.write_module(
    TS_OUT,
    ts.banner(
        'Semantic container tokens.',
        'GENERATED FROM FIGMA — DO NOT EDIT BY HAND.\n'
        'Run `pnpm generate:container-tokens` after re-exporting. Values match\n'
        'src/semantic/container/container.css exactly.',
        'Each token aliases a spacing primitive. `container` holds the var()\n'
        'reference as emitted in CSS; `containerResolved` holds the literal the\n'
        'alias resolves to, for code that needs a concrete value.',
    ),
    [
        ts.const_object(
            'container',
            [f"  {ts.quote_key(key)}: 'var({t['primitiveVar']})'," for key, t in tokens.items()],
            docs=ts.doc_block(
                'Semantic container tokens, as emitted in CSS.',
                'Each value is a `var()` reference to the primitive it aliases, so a change\n'
                'to that primitive propagates here automatically. Use these in CSS contexts;\n'
                'for a concrete value, use `containerResolved`.',
            ),
        ),
        ts.const_object(
            'containerResolved',
            [f"  {ts.quote_key(key)}: '{t['resolved']}'," for key, t in tokens.items()],
            docs='The literal value each alias resolves to, for code that needs a concrete value.',
        ),
        ts.const_object(
            'containerSource',
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
        ts.type_alias(
            'ContainerToken',
            'keyof typeof container',
            docs='A semantic container token key, e.g. `padding-mobile`.',
        ),
        ts.arrow_const(
            'containerVar',
            'token: ContainerToken',
            'containerSource[token].cssVar',
            docs=ts.doc_block(
                'The CSS custom property a container token is emitted as.',
                'A lookup rather than a template, because tokens live in different Tailwind\n'
                'namespaces depending on the property they represent.',
            ),
        ),
    ],
)

print(f'✅ {len(tokens)} semantic container tokens, all aliases resolved')
for key, t in tokens.items():
    print(f'   {key:20} {t["cssVar"]:42} -> var({t["primitiveVar"]}) = {t["resolved"]}')
print(f'   {CSS_OUT}')
print(f'   {TS_OUT}')
