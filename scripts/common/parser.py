"""Reading and normalizing Figma token exports."""

import json
import pathlib

from . import validation

#: Browser default root font size. px / this = rem.
ROOT_FONT_SIZE = 16


def load(path):
    """Parse a Figma export, failing clearly if it is missing or malformed."""
    path = pathlib.Path(path)
    if not path.exists():
        validation.fail(f'Figma export not found: {path}')
    try:
        return json.loads(path.read_text())
    except json.JSONDecodeError as error:
        validation.fail(f'{path} is not valid JSON: {error}')


def leaves(node, path=()):
    """Flatten a token tree to `[(path, node)]` pairs.

    A node is a leaf when it carries `$value`; Figma nests arbitrarily deep, so
    depth is never assumed.
    """
    out = []
    if isinstance(node, dict):
        if '$value' in node:
            return [(path, node)]
        for key, value in node.items():
            out += leaves(value, path + (key,))
    return out


def collection(raw, name):
    """Flatten one named collection, failing if the export does not contain it."""
    if name not in raw:
        available = ', '.join(k for k in raw if not k.startswith('$')) or 'none'
        validation.fail(f'export has no {name!r} collection (found: {available})')
    return leaves(raw[name])


def rem(px, root=ROOT_FONT_SIZE):
    """px -> rem string with trailing zeros stripped (14 -> '0.875rem', 0 -> '0rem')."""
    text = f'{px / root:.6f}'.rstrip('0').rstrip('.')
    return f'{text}rem'


def kebab(text):
    """Normalize a Figma name fragment: '/' and spaces become '-', lowercased."""
    return text.replace('/', '-').replace(' ', '-').lower()


def step_sort(name):
    """Sort key placing numeric steps in numeric order ahead of named ones."""
    return (0, int(name)) if name.isdigit() else (1, name)


def ordered_unique(items):
    """Deduplicate while preserving first-seen order, so Figma's own ordering survives."""
    out, seen = [], set()
    for item in items:
        if item not in seen:
            seen.add(item)
            out.append(item)
    return out


# --- primitive colour naming -------------------------------------------------
# Shared by the primitive colour generator and by any semantic collection that
# aliases a colour primitive, so both derive the same variable name from the same
# Figma group. Kept here rather than duplicated: a mismatch would produce a
# `var()` pointing at a variable that does not exist.

COLOR_GROUP_RENAME = {
    'gray-light mode': 'gray-light',
    'gray-dark mode': 'gray-dark',
    'gray-dark mode alpha': 'gray-dark-alpha',
}
COLOR_TOKEN_RENAME = {'off white': 'off-white'}


def color_group(group):
    """Figma colour group -> normalized group name."""
    return COLOR_GROUP_RENAME.get(group, group)


def color_token(token):
    """Figma colour token -> normalized token name."""
    return COLOR_TOKEN_RENAME.get(token, token)


def color_var(group, token):
    """The CSS custom property a primitive colour is emitted as."""
    return f'--color-{color_group(group)}-{color_token(token)}'


def color_value(val):
    """A Figma colour `$value` -> a CSS colour string.

    Hex when fully opaque; `rgb(r g b / a)` when not, because 8-bit hex would
    either lose the alpha channel or distort it through rounding. Hex is
    lowercased — a formatting choice, not a value change — so generated CSS
    matches what Prettier produces and stays in sync with the TypeScript layer.
    """
    alpha = val.get('alpha', 1)
    if alpha == 1:
        return val['hex'].lower()
    r, g, b = (round(c * 255) for c in val['components'])
    a = round(alpha, 4)
    a = int(a) if a == int(a) else a
    return f'rgb({r} {g} {b} / {a})'


#: A DTCG alias, e.g. `{Component colors.Utility.Pink ✅.utility-pink-600}` — a
#: reference to another token in the same export, left unresolved by Figma.
def dtcg_ref(value):
    """Return the referenced dot-path if `value` is a DTCG alias, else None."""
    if isinstance(value, str) and value.startswith('{') and value.endswith('}'):
        return value[1:-1]
    return None
