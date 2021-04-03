[![Deno](https://github.com/yw662/deno-tsx/actions/workflows/deno.yml/badge.svg)](https://github.com/yw662/deno-tsx/actions/workflows/deno.yml)
[![codecov](https://codecov.io/gh/yw662/deno-tsx/branch/main/graph/badge.svg?token=1AFX2FSKF9)](https://codecov.io/gh/yw662/deno-tsx)

# TSX-static

`tsx-static` is a minimal library for tsx pre-rendering or static site generation.

## Usage

`mod.ts` of `tsx-static` re-export functions, classes and declarations from these files:

- [`react.ts`](./doc/react.md): Providing class `React`, `StyleSheet`, `Style`, type `DocType`, as well as `JSX` global namespace declaration (so that TypeScript can process tsx).

  `react.ts` provides core functionality for tsx rendering, through `React.stringify`, and `React.toString`.

  - [More detail](./doc/react.md).

- [`builder.ts`](./doc/builder.md): Providing function `build` and `emit`, and const `loaders`.

  `builder.ts` provides helper functions to build static sites and scripts, using `tsx-static` and `Deno.emit`.

  - [More detail](./doc/builder.md).

- [`dom.ts`](./doc/dom.md): Providing declaration for `const window` from DOM API.

  This module is for type checking and auto-completing frontend code using Deno. The exported const `window` provides the same type declarations as in `lib.dom.d.ts`.

  - [More detail](./doc/dom.md).
