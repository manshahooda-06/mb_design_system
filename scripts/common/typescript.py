"""Emitting TypeScript token modules."""

import pathlib
import re

from .css import block_comment

#: Re-exported so generators need only one import for their file banners.
banner = block_comment

_IDENTIFIER = re.compile(r'^[A-Za-z_$][A-Za-z0-9_$]*$')


def quote_key(key):
    """A TS/JS object key: bare if valid unquoted, quoted otherwise.

    A key is safe bare either as an identifier (`xxs`, `full`) or as a
    canonical numeric literal (`0`, `500` — used by ramp steps). Anything else
    needs quotes — notably a name like `2xl`, which is *not* a valid bare key:
    identifiers cannot start with a digit, even though `2xl` is not a pure
    number either. This was found while generating the radius foundation,
    whose scale (`xxs`, `2xl`, `full`, ...) is the first to mix the two shapes.
    """
    if _IDENTIFIER.match(key) or key.isdigit():
        return key
    return f"'{key}'"


def doc(text):
    """A one-line JSDoc comment."""
    return f'/** {text} */'


def doc_block(*paragraphs):
    """A multi-line JSDoc comment, blank-separated between paragraphs."""
    lines = ['/**']
    for index, paragraph in enumerate(paragraphs):
        if index:
            lines.append(' *')
        for line in paragraph.strip('\n').split('\n'):
            lines.append(f' * {line}' if line else ' *')
    lines.append(' */')
    return lines


def const_object(name, entries, docs=None):
    """`export const <name> = { <entries> } as const;`

    `entries` are emitted verbatim and must carry their own indentation — key
    quoting differs per foundation (colors leaves numeric ramp steps bare,
    spacing quotes everything), and forcing one policy here would be a leaky
    abstraction over a genuine difference.
    """
    return [*_docs(docs), f'export const {name} = {{', *entries, '} as const;']


def const_array(name, items, docs=None):
    """`export const <name> = [ <items> ] as const;` with one quoted item per line."""
    return [
        *_docs(docs),
        f'export const {name} = [',
        *(f"  '{item}'," for item in items),
        '] as const;',
    ]


def type_alias(name, rhs, docs=None):
    """`export type <name> = <rhs>;`"""
    return [*_docs(docs), f'export type {name} = {rhs};']


def arrow_const(name, params, body, docs=None):
    """`export const <name> = (<params>) => <body>;`"""
    return [*_docs(docs), f'export const {name} = ({params}) => {body};']


def write_module(path, file_banner, blocks):
    """Write a banner plus blank-line-separated blocks to `path`.

    Each block is a list of lines; blocks are joined by a single blank line.
    """
    path = pathlib.Path(path)
    lines = [file_banner]
    for index, block in enumerate(blocks):
        if index:
            lines.append('')
        lines.extend(block)
    path.write_text('\n'.join(lines) + '\n')
    return path


def _docs(docs):
    """Normalize the `docs` argument to a list of comment lines."""
    if docs is None:
        return []
    if isinstance(docs, str):
        return [doc(docs)]
    return list(docs)
