"""Scaffolding helpers for generators that create authored files.

Distinct from `typescript.write_module` on purpose, and the distinction matters.

Token modules are *owned* by their generator: every run overwrites them, and
hand-editing one is a defect because the next run silently discards it. Component
files are the opposite — the generator writes a skeleton once and a person then
implements it. Overwriting that would destroy work.

So these helpers never clobber. `write_once` reports what it did instead, which is
what makes re-running a component generator a safe no-op rather than a rollback.
"""

import pathlib


def pascal(name):
    """'button' / 'icon-button' / 'IconButton' -> 'IconButton'."""
    parts = [p for p in name.replace('_', '-').replace(' ', '-').split('-') if p]
    return ''.join(p[:1].upper() + p[1:] for p in parts)


def camel(name):
    """'IconButton' -> 'iconButton'."""
    pascal_name = pascal(name)
    return pascal_name[:1].lower() + pascal_name[1:]


def kebab(name):
    """'IconButton' -> 'icon-button'."""
    out = []
    for index, char in enumerate(pascal(name)):
        if char.isupper() and index:
            out.append('-')
        out.append(char.lower())
    return ''.join(out)


def render(template, **values):
    """Substitute `__NAME__`-style placeholders.

    Placeholder substitution rather than `str.format` because these templates are
    full of TypeScript and JSX braces, and escaping every one of them makes the
    template unreadable and the escaping itself a source of bugs.
    """
    out = template
    for key, value in values.items():
        out = out.replace(f'__{key.upper()}__', value)
    return out


def write_once(path, content):
    """Write `content` unless the file exists. Returns 'created' or 'skipped'."""
    path = pathlib.Path(path)
    if path.exists():
        return 'skipped'
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content)
    return 'created'


def rewrite(path, content):
    """Overwrite unconditionally. Returns 'unchanged' or 'written'.

    For files the generator does own — a barrel that must list exactly the
    components that exist. Reports 'unchanged' so a no-op run is visible as one.
    """
    path = pathlib.Path(path)
    if path.exists() and path.read_text() == content:
        return 'unchanged'
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content)
    return 'written'


def report(results):
    """Print one line per file, then a summary. Returns the number created."""
    for path, outcome in results:
        marker = {'created': '+', 'skipped': '=', 'written': '~', 'unchanged': '='}[outcome]
        print(f'  {marker} {path}')
    created = sum(1 for _, outcome in results if outcome in ('created', 'written'))
    print(f'{created} file(s) written, {len(results) - created} already present')
    return created
