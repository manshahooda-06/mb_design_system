"""Emitting Tailwind v4 `@theme` stylesheets."""

import pathlib


def block_comment(*paragraphs):
    """Render a `/* ... */` banner, blank-separated between paragraphs.

    Also used by `typescript.py` — both languages take the same C-style block
    comment, so the formatter lives once, here.

    Returns a string with a trailing newline, so joining it ahead of body lines
    leaves exactly one blank line between banner and body.
    """
    lines = ['/*']
    for index, paragraph in enumerate(paragraphs):
        if index:
            lines.append(' *')
        for line in paragraph.strip('\n').split('\n'):
            lines.append(f' * {line}' if line else ' *')
    lines.append(' */')
    return '\n'.join(lines) + '\n'


def theme_block(sections):
    """Render `@theme static { ... }` from `[(label | None, [declarations])]`.

    `static` is required: without it Tailwind tree-shakes theme variables its own
    utilities do not reference, which for a token library would drop most of the
    scale from the published stylesheet.

    Sections are separated by a blank line. A label becomes a `/* label */`
    comment above its declarations.
    """
    lines = ['@theme static {']
    for index, (label, declarations) in enumerate(sections):
        if index:
            lines.append('')
        if label:
            lines.append(f'  /* {label} */')
        lines.extend(f'  {declaration}' for declaration in declarations)
    lines.append('}')
    return lines


def declaration(name, value, comment=None):
    """`--name: value;` with an optional trailing `/* comment */`."""
    text = f'--{name}: {value};'
    return f'{text} /* {comment} */' if comment else text


#: Inserted between a Tailwind namespace and a semantic token's own name.
SEMANTIC_QUALIFIER = 'semantic'

#: Tailwind namespaces read by more than one utility family, where an unqualified
#: token name can silently shadow another namespace's values. `--spacing-*` and
#: `--container-*` both feed `w-*`, `min-w-*`, `max-w-*` and `basis-*`, and
#: spacing wins — so a bare `--spacing-md` hijacks `max-w-md`. Qualifying every
#: semantic token makes that structurally impossible.
OVERLOADED_NAMESPACES = {'spacing': 'container', 'container': 'spacing'}


def semantic_name(namespace, token, qualifier=SEMANTIC_QUALIFIER):
    """Build a semantic token's variable name: `<namespace>-<qualifier>-<token>`.

    Returns the name without the leading `--`, ready for `declaration()`.

    Every semantic collection uses this so its tokens can never collide with a
    primitive scale or with Tailwind's own values in the same namespace:

        semantic_name('spacing', 'md')  -> 'spacing-semantic-md'
        semantic_name('container', 'desktop') -> 'container-semantic-desktop'

    The qualifier is what makes the convention safe. Emitting `--spacing-md`
    directly would shadow Tailwind's `--container-md` for `max-w-md` and friends;
    `--spacing-semantic-md` cannot, because no Tailwind value is named
    `semantic-md`.
    """
    return f'{namespace}-{qualifier}-{token}'


def scoped_block(selector, declarations, label=None):
    """Render `<selector> { ... }` — a plain rule, not a `@theme` block.

    Used for theme overrides. Tailwind reads `@theme` to decide which utilities
    exist, so a mode's variables belong there exactly once (the default mode);
    every other mode re-declares the same variables inside a selector, which
    overrides them at runtime without generating a second set of utilities.
    """
    lines = [f'{selector} {{']
    if label:
        lines.append(f'  /* {label} */')
    lines.extend(f'  {declaration}' for declaration in declarations)
    lines.append('}')
    return lines


def write_stylesheet(path, banner, sections, extra_blocks=()):
    """Write a banner, one `@theme static` block, then any extra rule blocks.

    `extra_blocks` is a sequence of already-rendered line lists — typically from
    `scoped_block()` — appended after the theme block, blank-line separated.
    """
    path = pathlib.Path(path)
    lines = [banner, *theme_block(sections)]
    for block in extra_blocks:
        lines.append('')
        lines.extend(block)
    path.write_text('\n'.join(lines) + '\n')
    return path
