[![Deno](https://github.com/yw662/deno-tsx/actions/workflows/deno.yml/badge.svg)](https://github.com/yw662/deno-tsx/actions/workflows/deno.yml)
[![codecov](https://codecov.io/gh/yw662/deno-tsx/branch/main/graph/badge.svg?token=1AFX2FSKF9)](https://codecov.io/gh/yw662/deno-tsx)

# TSX-static

This is a minimal library for tsx pre-rendering or static site generation.

## Usage

- [`react.ts`](./doc/react.md): This file provides tsx rendering functionality. `React`, `StyleSheet`, `Style`, `DocType`, and `JSX` global namespace declaration are from `react.ts`.

  - More detailed description [here](./doc/react.md).

- [`builder.ts`](./doc/builder.md): This provides several helpers functions to build a static site (as well as the scripts it uses) using deno-tsx (and other tools, like `Deno.emit`). `emit`,`loaders`, and `build` are from `builder.ts`.

  - More detailed description [here](./doc/builder.md).

- [`types.dom.d.ts`](./doc/dom.d.md): This `d.ts` contains additional type declarations as in `DOM API`, but not provided by deno. This is useful for frontend JavaScript to pass type check.

  - More detailed description [here](./doc/dom.d.md).
