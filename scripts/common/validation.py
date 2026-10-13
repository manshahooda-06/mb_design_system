"""Fail-fast guards.

A generator must never guess. If an export is malformed, contradicts itself, or
contains something the generator was not written to handle, the build stops with
a message naming the offending token — rather than emitting a plausible-looking
value nobody asked for.
"""

import sys


def fail(message):
    """Abort generation with a consistent, greppable prefix."""
    raise SystemExit(f'token generator error: {message}')


def require(condition, message):
    """Abort unless `condition` holds."""
    if not condition:
        fail(message)


def require_unique(key, seen, what='token'):
    """Abort if `key` has already been emitted; otherwise record it."""
    if key in seen:
        fail(f'duplicate {what} key {key!r}')
    seen.add(key)


def require_int_ratio(label, value, expected, what):
    """Abort unless `value` rounds to `expected` — used for step x 4 = px checks."""
    if round(value) != expected:
        fail(f'{label}: {what} ({value}) does not match {expected}')


def warn(message):
    """Print a non-fatal note to stderr, so it is visible but not mistaken for output."""
    print(f'warning: {message}', file=sys.stderr)
