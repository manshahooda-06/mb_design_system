"""Actionable diagnostics for generators that can partially succeed.

Most generators are all-or-nothing: the export is well-formed or the build stops.
A semantic collection that aliases primitives is different — one alias can be
unresolvable while every other token is perfectly valid. Aborting on the first
failure would hide the rest and leave nothing to review.

So those generators follow:

    parse -> resolve -> collect diagnostics -> emit valid artifacts -> report

The report is written as JSON for a verification step to read. The build still
fails when anything is unresolved, but it fails *after* producing reviewable
output and a complete list of what to fix.

A token whose alias cannot be resolved is **withheld**, never degraded to a
literal. Emitting the resolved value Figma happens to ship alongside the alias
would silently duplicate a primitive and stop propagating; emitting a dangling
`var()` would render as nothing. Withholding neither invents nor hides.

Grouping by root cause
----------------------
A list of 146 unresolved aliases is data, not information — the same handful of
Figma problems produces most of them. So failures are grouped by **root cause**,
each carrying a suggestion naming the action that fixes the whole group, with the
affected tokens and references nested underneath. The flat list is still emitted
for completeness, but the grouped view is what a reader acts on.
"""

import json
import pathlib


class Report:
    """Collects resolution outcomes and writes a deterministic JSON report.

    Root causes are declared by the generator via `define()`, so this module
    stays free of any one collection's vocabulary.
    """

    def __init__(self):
        self.resolved = 0
        self._causes = {}
        self._failures = []
        self._groups = {}
        self._withheld = {}
        self._cycles = []

    # --- declaration ---------------------------------------------------------
    def define(self, name, *, title, suggestion):
        """Declare a root cause, its human title, and the action that fixes it."""
        self._causes[name] = {'title': title, 'suggestion': suggestion}

    # --- recording -----------------------------------------------------------
    def ok(self, count=1):
        """Record `count` successfully resolved tokens."""
        self.resolved += count

    def fail(self, *, token, mode, reference, cause, group=None, display=None, status=None):
        """Record one token that could not be resolved in one mode, and why.

        `group` is the *raw* Figma name and is the key, because two distinct
        groups can normalize to the same display name — `Green ✅` and `green❌`
        both become `green`. Keying by display name would let one overwrite the
        other and collapse exactly the approved/deprecated distinction the report
        exists to draw.
        """
        assert cause in self._causes, f'undeclared root cause {cause!r}'
        self._failures.append(
            {'semanticToken': token, 'reference': reference, 'mode': mode, 'rootCause': cause}
        )
        if group is not None:
            self._groups[group] = (display or group, status)

    def cycle(self, *, path, mode, cause):
        """Record an alias cycle. `path` starts and ends on the same token."""
        assert cause in self._causes, f'undeclared root cause {cause!r}'
        self._cycles.append({'mode': mode, 'cycle': list(path)})
        for token in dict.fromkeys(path[:-1]):
            self.fail(
                token=token, mode=mode, reference=' -> '.join(path), cause=cause
            )

    def withhold(self, token, *, causes, modes, figma_path=None):
        """Record that a token was withheld, with every root cause implicating it."""
        self._withheld[token] = {
            'token': token,
            **({'figmaPath': figma_path} if figma_path else {}),
            'rootCauses': sorted(causes),
            'failedModes': sorted(modes),
        }

    # --- queries -------------------------------------------------------------
    @property
    def unresolved_count(self):
        return len(self._failures)

    @property
    def withheld_count(self):
        return len(self._withheld)

    def groups(self, status):
        """Display names of referenced groups with the given status, sorted."""
        return sorted({display for display, s in self._groups.values() if s == status})

    def has_cause(self, name):
        return any(f['rootCause'] == name for f in self._failures)

    # --- assembly ------------------------------------------------------------
    def _grouped(self):
        """Failures grouped by root cause, each with its suggestion and evidence."""
        out = []
        for name, meta in self._causes.items():
            mine = [f for f in self._failures if f['rootCause'] == name]
            if not mine:
                continue
            by_reference = {}
            for f in mine:
                entry = by_reference.setdefault(
                    f['reference'], {'reference': f['reference'], 'modes': set(), 'tokens': set()}
                )
                entry['modes'].add(f['mode'])
                entry['tokens'].add(f['semanticToken'])
            references = sorted(
                (
                    {
                        'reference': e['reference'],
                        'modes': sorted(e['modes']),
                        'affectedTokenCount': len(e['tokens']),
                        'affectedTokens': sorted(e['tokens']),
                    }
                    for e in by_reference.values()
                ),
                key=lambda e: (-e['affectedTokenCount'], e['reference']),
            )
            out.append(
                {
                    'rootCause': name,
                    'title': meta['title'],
                    'suggestion': meta['suggestion'],
                    'unresolvedAliases': len(mine),
                    'affectedTokenCount': len({f['semanticToken'] for f in mine}),
                    'affectedTokens': sorted({f['semanticToken'] for f in mine}),
                    'references': references,
                }
            )
        return out

    def build(self, **extra):
        """Assemble the report. Every list is sorted so the output is byte-stable."""
        grouped = self._grouped()
        return {
            'resolved': self.resolved,
            'unresolved': self.unresolved_count,
            'withheld': self.withheld_count,
            **extra,
            'summary': {
                'byRootCause': {g['rootCause']: g['affectedTokenCount'] for g in grouped},
                'rootCauseCount': len(grouped),
                'cycles': len(self._cycles),
            },
            'failuresByRootCause': grouped,
            'missingPrimitiveGroups': self.groups('missing'),
            'deprecatedPrimitiveGroups': self.groups('deprecated'),
            'cycles': sorted(self._cycles, key=lambda c: (c['mode'], c['cycle'])),
            'withheldTokens': [self._withheld[k] for k in sorted(self._withheld)],
            'unresolvedAliases': sorted(
                self._failures, key=lambda d: (d['semanticToken'], d['mode'], d['reference'])
            ),
        }

    def write(self, path, **extra):
        """Write the report to `path`, returning it."""
        path = pathlib.Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        report = self.build(**extra)
        path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
        return report

    def summarize(self, *, report=None, indent='   '):
        """Human-readable lines for the generator's stdout."""
        report = report or self.build()
        lines = [
            f'{self.unresolved_count} unresolved alias(es) across '
            f'{self.withheld_count} withheld token(s), '
            f'{report["summary"]["rootCauseCount"]} root cause(s):'
        ]
        for group in report['failuresByRootCause']:
            lines.append(
                f'{indent}{group["affectedTokenCount"]:>3} tokens  {group["rootCause"]}'
                f' — {group["suggestion"]}'
            )
        for cycle in report['cycles']:
            lines.append(f'{indent}cycle ({cycle["mode"]}): {" -> ".join(cycle["cycle"])}')
        return lines
