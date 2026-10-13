"""Shared building blocks for the token generators.

Each `scripts/generate-<foundation>-tokens.py` reads a Figma export and writes
two files: a Tailwind `@theme` stylesheet and a TypeScript token module. The
modules here hold the parts that are identical across foundations:

  parser      loading an export, flattening it, normalizing names and units
  validation  fail-fast guards, so a malformed export stops the build
  css         `/* ... */` banners and `@theme static` block emission
  typescript  banners, doc comments, `as const` blocks and type aliases

Anything genuinely specific to one foundation — how colors encode alpha, how
typography maps weight names, how spacing parses its embedded pixel values —
stays in that foundation's generator, where it is readable in context.
"""
