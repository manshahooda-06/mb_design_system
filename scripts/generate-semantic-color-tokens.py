"""Generate the semantic colour collection from the Figma light/dark exports.

A semantic layer over the primitive colour foundation, which remains the source
of truth. Two modes, one token set: Figma exports the same 395 token paths in
both `Light mode` and `Dark mode`, and almost all of them differ between the two.

Alias mechanisms
----------------
Unlike every previous collection, this export uses **two** alias mechanisms, and
54 tokens switch between them depending on the mode:

  1. `com.figma.aliasData`   -> aliases a colour primitive. Figma also ships the
                               resolved value, which we deliberately ignore in
                               favour of a `var()` reference to the primitive.
  2. DTCG reference string   -> `$value: "{Component colors.Utility.Pink ✅....}"`
                               aliases another token *in this same export*, left
                               unresolved by Figma. Emitted as a `var()` to that
                               token's own semantic variable, preserving the chain.

Anything else is a literal Figma exported as a literal, emitted as-is.

Unresolvable aliases
--------------------
Some aliases target primitive groups absent from the primitives export. Those
tokens are **withheld**, never degraded to a literal: emitting Figma's resolved
value would silently duplicate a primitive and stop propagating, and emitting a
dangling `var()` would render as nothing.

A token is emitted only when it resolves in **both** modes. Emitting a
light-only token would leave dark mode silently inheriting the light colour.

Generation does not abort on the first failure — it collects diagnostics, emits
every valid token, and writes a report for the verification step to fail on.
See scripts/common/diagnostics.py.

Theming
-------
Light lands in `@theme static` (so Tailwind generates the utilities), dark
re-declares the same variables under `.dark`, which the `@custom-variant dark`
in src/index.css matches. No `prefers-color-scheme`.
"""

import pathlib
import re

from common import css, diagnostics, parser, typescript as ts, validation

LIGHT = pathlib.Path('figma/exports/semantic/colors-light.json')
DARK = pathlib.Path('figma/exports/semantic/colors-dark.json')
PRIMITIVES = pathlib.Path('figma/exports/primitives/colors.json')
CSS_OUT = pathlib.Path('src/semantic/colors/colors.css')
TS_OUT = pathlib.Path('src/tokens/semantic/colors/index.ts')
REPORT_OUT = pathlib.Path('diagnostics/semantic-colors.json')

NAMESPACE = 'color'
DARK_SELECTOR = '.dark'

#: Figma marks group status with emoji: ✅ approved, ❌ deprecated, 📌 pinned,
#: ⚠️ caution (plus U+FE0F variation selectors). They carry no naming meaning.
STATUS_MARKS = re.compile('[✅❌⚠️\U0001f4cc]')

#: A group name ending in ❌ is deprecated in Figma; ✅ is approved.
DEPRECATED_MARK = '❌'


def display_name(segment):
    """Strip status emoji but keep Figma's own casing, so two groups that differ
    only by marker — `Green ✅` (approved) vs `green❌` (deprecated) — remain
    distinguishable in the diagnostics report."""
    return re.sub(r'\s+', ' ', STATUS_MARKS.sub('', segment)).strip()


def normalize(segment):
    """Derive a token name segment mechanically from a Figma name.

    Strips status emoji and any parenthesised step, lowercases, and reduces
    everything else to single hyphens:

        "Text ✅"              -> "text"
        "text-primary (900)"   -> "text-primary"
        "Alpha 📌"             -> "alpha"
    """
    text = STATUS_MARKS.sub('', segment)
    text = re.sub(r'\s*\([^)]*\)\s*', '', text)
    return re.sub(r'[^a-z0-9]+', '-', text.strip().lower()).strip('-')


def load_mode(path):
    """Flatten one mode export to `{dot-path: node}`, keeping collection order."""
    raw = parser.load(path)
    collections = [k for k in raw if not k.startswith('$')]
    validation.require(collections, f'{path} contains no token collections')
    out = {}
    for collection in collections:
        for token_path, node in parser.leaves(raw[collection]):
            out['.'.join((collection,) + token_path)] = node
    return out


light = load_mode(LIGHT)
dark = load_mode(DARK)
primitives = parser.load(PRIMITIVES)
validation.require('Colors' in primitives, f'{PRIMITIVES} has no Colors collection')
primitive_colors = primitives['Colors']

# Figma exports the same token set per mode; anything else means the modes have
# drifted apart and pairing them would be guesswork.
validation.require(
    set(light) == set(dark),
    'light and dark exports contain different token sets — '
    f'light-only={sorted(set(light) - set(dark))[:3]} '
    f'dark-only={sorted(set(dark) - set(light))[:3]}',
)

# Leaf names are globally unique, so a token's key is its leaf alone. Verified
# rather than assumed: a collision would silently drop a token.
keys = {}
for path in light:
    key = normalize(path.split('.')[-1])
    validation.require(
        key not in keys,
        f'token key {key!r} derived from two different Figma paths: {keys.get(key)!r} and {path!r}',
    )
    keys[key] = path

keys_by_path = {path: key for key, path in keys.items()}
MODES = ('light', 'dark')
SOURCES = {'light': light, 'dark': dark}

report = diagnostics.Report()

# Root causes are declared up front with the action that fixes each one, so the
# report groups failures by cause rather than listing 146 individually.
report.define(
    'missing-primitive',
    title='Alias targets an approved primitive absent from the primitives export',
    suggestion=(
        'Re-export the Figma primitives collection including these groups. They are '
        'marked approved (✅) in Figma, so their absence is an incomplete export '
        'rather than a design decision.'
    ),
)
report.define(
    'deprecated-primitive',
    title='Alias targets a primitive group Figma marks deprecated (❌)',
    suggestion=(
        'A design decision, not an export problem. In Figma either repoint these '
        'semantic tokens at the approved equivalent — e.g. replace green❌ with '
        'Green ✅ — or restore the group as approved if it is still in use.'
    ),
)
report.define(
    'dtcg-reference-not-found',
    title='DTCG reference names a token that does not exist in this export',
    suggestion=(
        'The referenced token was renamed or deleted while the referring token kept '
        'pointing at the old name. Fix the reference in Figma, or re-export both '
        'modes together so they agree.'
    ),
)
report.define(
    'upstream-alias-unresolved',
    title='Alias resolves to another semantic token that is itself unresolved',
    suggestion=(
        'Nothing to fix here — the failure is upstream. These recover automatically '
        'once the root cause they depend on is resolved, so fix the other causes '
        'first and re-generate.'
    ),
)
report.define(
    'circular-alias',
    title='Alias chain forms a cycle and can never resolve to a value',
    suggestion=(
        'Break the cycle in Figma so at least one token in it points at a primitive '
        'or holds a literal. A cycle in CSS custom properties is invalid at '
        'computed-value time, so these can never be emitted.'
    ),
)
report.define(
    'unsupported-alias-shape',
    title='Alias target is not a `Colors/<group>/<step>` primitive path',
    suggestion=(
        'The generator only resolves primitive aliases into the Colors collection. '
        'If this collection legitimately aliases something else, extend the '
        'generator rather than loosening the check.'
    ),
)
report.define(
    'mode-asymmetry',
    title='Token resolves in one mode but not the other',
    suggestion=(
        'Create the missing counterpart in Figma so the token has a value in both '
        'modes. A token emitted for one mode only would silently inherit the other '
        "mode's colour, which is worse than withholding it."
    ),
)


def classify(key, node, mode):
    """Classify one token in one mode, without following any chain.

    Returns one of:
      ('value', css)   resolves outright — a primitive alias or a literal
      ('ref', target)  depends on another token in this export
      ('fail', cause)  cannot resolve; a diagnostic has been recorded
    """
    value = node['$value']

    reference = parser.dtcg_ref(value)
    if reference is not None:
        target = keys_by_path.get(reference)
        if target is None:
            report.fail(
                token=key, mode=mode, reference=reference, cause='dtcg-reference-not-found'
            )
            return 'fail', 'dtcg-reference-not-found'
        return 'ref', target

    alias = node.get('$extensions', {}).get('com.figma.aliasData')
    if alias:
        target = alias['targetVariableName']
        parts = target.split('/')
        if len(parts) != 3 or parts[0] != 'Colors':
            report.fail(token=key, mode=mode, reference=target, cause='unsupported-alias-shape')
            return 'fail', 'unsupported-alias-shape'
        _, group, step = parts
        if group not in primitive_colors or step not in primitive_colors[group]:
            cause = 'deprecated-primitive' if DEPRECATED_MARK in group else 'missing-primitive'
            report.fail(
                token=key,
                mode=mode,
                reference=target,
                cause=cause,
                group=group,
                display=display_name(group),
                status='deprecated' if cause == 'deprecated-primitive' else 'missing',
            )
            return 'fail', cause
        # Figma also ships a resolved value here; the var() reference is used
        # instead so a change to the primitive propagates.
        return 'value', f'var({parser.color_var(group, step)})'

    validation.require(
        isinstance(value, dict) and 'hex' in value,
        f'{key!r} ({mode}): $value is neither an alias nor a colour object',
    )
    return 'value', parser.color_value(value)


# --- Pass 1: classify every token in every mode, following nothing -----------
classified = {
    key: {mode: classify(key, SOURCES[mode][path], mode) for mode in MODES}
    for key, path in keys.items()
}


# --- Pass 2: detect cycles ---------------------------------------------------
# Each token has at most one outgoing reference per mode, so per mode the graph is
# functional and a cycle is found by walking forward until a node repeats. This
# must run before the fixpoint: a cycle is not a cascade, and left undetected it
# would emit mutually-referencing var()s that CSS discards at computed-value time.
def find_cycles(mode):
    successor = {
        key: modes[mode][1] if modes[mode][0] == 'ref' else None
        for key, modes in classified.items()
    }
    settled, found = set(), []
    for start in successor:
        if start in settled:
            continue
        walk, seen = [], {}
        node = start
        while node is not None and node not in settled and node not in seen:
            seen[node] = len(walk)
            walk.append(node)
            node = successor.get(node)
        if node is not None and node in seen:
            found.append([*walk[seen[node] :], node])
        settled.update(walk)
    return found


in_cycle = set()
for mode in MODES:
    for path in find_cycles(mode):
        report.cycle(path=path, mode=mode, cause='circular-alias')
        in_cycle.update(path)


# --- Pass 3: withhold to a fixpoint -----------------------------------------
# A token referencing another token can only be emitted if that target is
# emitted; otherwise its var() would point at a variable that was never declared
# and silently render as nothing. Withholding therefore cascades.
#
# Termination is bounded: each round withholds at least one token and never
# releases one, so at most len(keys) rounds are possible. The bound is asserted
# rather than assumed, so a future change cannot introduce an infinite loop.
withheld = {
    key for key, modes in classified.items() if any(modes[m][0] == 'fail' for m in MODES)
} | in_cycle

for round_number in range(len(keys) + 1):
    cascaded = {
        key
        for key, modes in classified.items()
        if key not in withheld
        and any(modes[m][0] == 'ref' and modes[m][1] in withheld for m in MODES)
    }
    if not cascaded:
        break
    for key in sorted(cascaded):
        for mode in MODES:
            kind, target = classified[key][mode]
            if kind == 'ref' and target in withheld:
                report.fail(
                    token=key,
                    mode=mode,
                    reference=keys[target],
                    cause='upstream-alias-unresolved',
                )
    withheld |= cascaded
else:
    validation.fail(
        f'alias withholding did not converge after {len(keys)} rounds — '
        'this indicates a bug in cycle detection, not a data problem'
    )


# --- Pass 4: record why each withheld token was withheld ---------------------
for key in sorted(withheld):
    causes, failed_modes = set(), set()
    for mode in MODES:
        kind, payload = classified[key][mode]
        if kind == 'fail':
            causes.add(payload)
            failed_modes.add(mode)
        elif kind == 'ref' and payload in withheld:
            causes.add('upstream-alias-unresolved')
            failed_modes.add(mode)
    if key in in_cycle:
        causes.add('circular-alias')
        failed_modes.update(MODES)
    # A token failing in only one mode is withheld for the other mode's sake:
    # emitting it would leave that mode silently inheriting the wrong colour.
    if len(failed_modes) == 1:
        causes.add('mode-asymmetry')
        only = next(iter(failed_modes))
        report.fail(
            token=key,
            mode=only,
            reference=f'no resolvable {only} counterpart',
            cause='mode-asymmetry',
        )
    report.withhold(key, causes=causes, modes=failed_modes, figma_path=keys[key])


# --- Pass 5: emit -----------------------------------------------------------
def resolve_terminal(key, mode):
    """Follow the chain to the single concrete value it ends on.

    Returns `(terminal, hops)`. The graph is functional and acyclic by this
    point, so a walk from any token reaches exactly one terminal — a primitive
    `var()` or a literal. Guarded against a cycle anyway: reaching one here would
    mean pass 2 missed it, and an infinite walk is a worse failure than an error.
    """
    seen, hops, current = {key}, 0, key
    while True:
        kind, payload = classified[current][mode]
        if kind == 'value':
            return payload, hops
        validation.require(
            payload not in seen,
            f'{key} ({mode}): cycle reached at {payload} while resolving a terminal — '
            'cycle detection in pass 2 failed',
        )
        seen.add(payload)
        current, hops = payload, hops + 1


def emitted_value(key, mode):
    kind, payload = classified[key][mode]
    return payload if kind == 'value' else f'var(--{css.semantic_name(NAMESPACE, payload)})'


def provenance(key, mode):
    node = SOURCES[mode][keys[key]]
    reference = parser.dtcg_ref(node['$value'])
    alias = node.get('$extensions', {}).get('com.figma.aliasData')
    terminal, hops = resolve_terminal(key, mode)
    common = {'terminal': terminal, 'hops': hops}
    if reference is not None:
        return {'kind': 'semantic-alias', 'aliasOf': reference, **common}
    if alias:
        return {'kind': 'primitive-alias', 'aliasOf': alias['targetVariableName'], **common}
    return {'kind': 'literal', 'aliasOf': None, **common}


tokens = {}
for key, path in keys.items():
    if key in withheld:
        continue
    tokens[key] = {
        'figmaPath': path,
        'light': emitted_value(key, 'light'),
        'dark': emitted_value(key, 'dark'),
        'lightSource': provenance(key, 'light'),
        'darkSource': provenance(key, 'dark'),
        'cssVar': f'--{css.semantic_name(NAMESPACE, key)}',
    }
    report.ok()

# Nothing emitted may reference a variable that was not emitted. This is the
# invariant the fixpoint exists to guarantee; asserting it here means a bug
# surfaces as a build failure rather than a colour that silently renders as
# nothing in the browser.
emitted_vars = {t['cssVar'] for t in tokens.values()}
TERMINAL = re.compile(r'^(var\(--color-(?!semantic-)[a-z0-9-]+\)|#[0-9a-f]{6}|rgb\([^)]+\))$')
for key, token in tokens.items():
    for mode in MODES:
        value = token[mode]
        if value.startswith('var(--color-semantic-'):
            target = value[len('var(') : -1]
            validation.require(
                target in emitted_vars,
                f'{key} ({mode}) references {target}, which was not emitted — '
                'the withholding fixpoint failed to cascade',
            )
        # Every emitted token must resolve to exactly one terminal: a primitive
        # reference or a literal. A chain ending anywhere else — or not ending —
        # would leave the token with no usable value at runtime.
        terminal = token[f'{mode}Source']['terminal']
        validation.require(
            TERMINAL.match(terminal),
            f'{key} ({mode}) resolves to {terminal!r}, which is neither a primitive '
            'reference nor a literal colour',
        )

report_data = report.write(
    REPORT_OUT,
    totalTokensPerMode=len(keys),
    emitted=len(tokens),
    withheld=len(keys) - len(tokens),
    modes=['light', 'dark'],
)

# --- CSS ---------------------------------------------------------------------
css.write_stylesheet(
    CSS_OUT,
    css.block_comment(
        'Semantic colour tokens.',
        'GENERATED FROM FIGMA — DO NOT EDIT BY HAND.\n'
        'Run `pnpm generate:semantic-color-tokens` after re-exporting. See\n'
        'docs/Semantic-Tokens.md for the full reference.',
        'Each token aliases either a colour primitive or another semantic colour,\n'
        'and is emitted as a var() reference so the alias chain is preserved and a\n'
        'change to the primitive propagates. Literals appear only where Figma\n'
        'itself exported a literal.',
        'Light mode is declared in @theme so Tailwind generates the utilities;\n'
        f'dark mode re-declares the same variables under {DARK_SELECTOR}, matched by the\n'
        '@custom-variant dark in src/index.css. No prefers-color-scheme.',
        f'{len(tokens)} of {len(keys)} exported tokens are emitted. The remainder alias\n'
        'primitives absent from the primitives export and are withheld rather than\n'
        f'degraded to literals — see {REPORT_OUT}.',
    ),
    [(None, [css.declaration(t['cssVar'].removeprefix('--'), t['light']) for t in tokens.values()])],
    extra_blocks=[
        css.scoped_block(
            DARK_SELECTOR,
            [css.declaration(t['cssVar'].removeprefix('--'), t['dark']) for t in tokens.values()],
            label='dark mode overrides',
        )
    ],
)

# --- TypeScript --------------------------------------------------------------
def mode_entries(mode):
    return [f"  {ts.quote_key(key)}: '{token[mode]}'," for key, token in tokens.items()]


def mode_source(token, mode):
    """One mode's provenance object, including the terminal its chain ends on."""
    source = token[f'{mode}Source']
    alias = f"'{source['aliasOf']}'" if source['aliasOf'] else 'null'
    return (
        f"{{ kind: '{source['kind']}', aliasOf: {alias}, "
        f"terminal: '{source['terminal']}', hops: {source['hops']} }}"
    )


def mode_source_entry(key, token):
    return (
        f'  {ts.quote_key(key)}: {{\n'
        f"    figmaPath: '{token['figmaPath']}',\n"
        f"    cssVar: '{token['cssVar']}',\n"
        f'    light: {mode_source(token, "light")},\n'
        f'    dark: {mode_source(token, "dark")},\n'
        f'  }},'
    )


ts.write_module(
    TS_OUT,
    ts.banner(
        'Semantic colour tokens.',
        'GENERATED FROM FIGMA — DO NOT EDIT BY HAND.\n'
        'Run `pnpm generate:semantic-color-tokens` after re-exporting. Values match\n'
        'src/semantic/colors/colors.css exactly.',
        'Every token has a value per mode. `semanticColors` holds the CSS-facing\n'
        'form — a var() reference wherever Figma expressed an alias — and\n'
        '`semanticColorsResolved` holds the same keyed by mode for code that needs\n'
        'to read a specific theme.',
    ),
    [
        ts.const_object(
            'semanticColors',
            mode_entries('light'),
            docs=ts.doc_block(
                'Semantic colour tokens as emitted for light mode.',
                'Values are `var()` references wherever Figma expressed an alias, so the\n'
                'chain to the primitive is preserved. Dark mode overrides the same custom\n'
                'properties under `.dark`, so these work unchanged in either theme; use\n'
                '`semanticColorsResolved` when a specific mode is needed.',
            ),
        ),
        ts.const_object(
            'semanticColorsResolved',
            [
                '  light: {',
                *(f'  {line}' for line in mode_entries('light')),
                '  },',
                '  dark: {',
                *(f'  {line}' for line in mode_entries('dark')),
                '  },',
            ],
            docs='Both modes, keyed by mode name.',
        ),
        ts.const_object(
            'semanticColorsSource',
            [
                mode_source_entry(key, token)
                for key, token in tokens.items()
            ],
            docs='Provenance per token: its Figma path, the variable it is emitted as, and how each mode was resolved.',
        ),
        ts.type_alias(
            'SemanticColorToken',
            'keyof typeof semanticColors',
            docs='A semantic colour token key, e.g. `text-primary`.',
        ),
        ts.type_alias('ColorMode', "'light' | 'dark'", docs='A supported colour mode.'),
        ts.arrow_const(
            'semanticColorsVar',
            'token: SemanticColorToken',
            'semanticColorsSource[token].cssVar',
            docs='The CSS custom property a semantic colour is emitted as, e.g. `--color-semantic-text-primary`.',
        ),
    ],
)

print(f'✅ {len(tokens)} of {len(keys)} semantic colour tokens emitted (light + dark)')
kinds = {}
for token in tokens.values():
    for mode in ('lightSource', 'darkSource'):
        kinds[token[mode]['kind']] = kinds.get(token[mode]['kind'], 0) + 1
print(f'   alias kinds across both modes: {kinds}')
print(f'   {CSS_OUT}')
print(f'   {TS_OUT}')
if report_data['unresolved']:
    print()
    print(f'⚠️  {report.summarize(report=report_data)[0]}')
    for line in report.summarize(report=report_data)[1:]:
        print(line)
    if report_data['missingPrimitiveGroups']:
        print(f'   missing approved groups:  {report_data["missingPrimitiveGroups"]}')
    if report_data['deprecatedPrimitiveGroups']:
        print(f'   deprecated groups in use: {report_data["deprecatedPrimitiveGroups"]}')
    print(f'   full report: {REPORT_OUT}')
    print('   the verification step will fail until these are resolved in Figma')
