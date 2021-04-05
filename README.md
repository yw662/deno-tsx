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

## Known Issues

- Dependency resolver for `loaders.ts.emit` does not work with multi-line import statements.
  - It can be solved by a better import statement parser, however a full TypeScript parser (which we don't have on Deno) is always welcomed.
- `namespace WebAssembly` is not shipped with `dom.ts`. This issue should be addressed soon. Here is how `namespace WebAssembly` should look like if you need it (it is short):

  ```ts
  namespace WebAssembly {
    interface CompileError {}

    var CompileError: {
      prototype: CompileError
      new (): CompileError
    }

    interface Global {
      value: any
      valueOf(): any
    }

    var Global: {
      prototype: Global
      new (descriptor: GlobalDescriptor, v?: any): Global
    }

    interface Instance {
      readonly exports: Exports
    }

    var Instance: {
      prototype: Instance
      new (module: Module, importObject?: Imports): Instance
    }

    interface LinkError {}

    var LinkError: {
      prototype: LinkError
      new (): LinkError
    }

    interface Memory {
      readonly buffer: ArrayBuffer
      grow(delta: number): number
    }

    var Memory: {
      prototype: Memory
      new (descriptor: MemoryDescriptor): Memory
    }

    interface Module {}

    var Module: {
      prototype: Module
      new (bytes: BufferSource): Module
      customSections(moduleObject: Module, sectionName: string): ArrayBuffer[]
      exports(moduleObject: Module): ModuleExportDescriptor[]
      imports(moduleObject: Module): ModuleImportDescriptor[]
    }

    interface RuntimeError {}

    var RuntimeError: {
      prototype: RuntimeError
      new (): RuntimeError
    }

    interface Table {
      readonly length: number
      get(index: number): Function | null
      grow(delta: number): number
      set(index: number, value: Function | null): void
    }

    var Table: {
      prototype: Table
      new (descriptor: TableDescriptor): Table
    }

    interface GlobalDescriptor {
      mutable?: boolean
      value: ValueType
    }

    interface MemoryDescriptor {
      initial: number
      maximum?: number
    }

    interface ModuleExportDescriptor {
      kind: ImportExportKind
      name: string
    }

    interface ModuleImportDescriptor {
      kind: ImportExportKind
      module: string
      name: string
    }

    interface TableDescriptor {
      element: TableKind
      initial: number
      maximum?: number
    }

    interface WebAssemblyInstantiatedSource {
      instance: Instance
      module: Module
    }

    type ImportExportKind = 'function' | 'global' | 'memory' | 'table'
    type TableKind = 'anyfunc'
    type ValueType = 'f32' | 'f64' | 'i32' | 'i64'
    type ExportValue = Function | Global | Memory | Table
    type Exports = Record<string, ExportValue>
    type ImportValue = ExportValue | number
    type ModuleImports = Record<string, ImportValue>
    type Imports = Record<string, ModuleImports>
    function compile(bytes: BufferSource): Promise<Module>
    function compileStreaming(
      source: Response | Promise<Response>
    ): Promise<Module>
    function instantiate(
      bytes: BufferSource,
      importObject?: Imports
    ): Promise<WebAssemblyInstantiatedSource>
    function instantiate(
      moduleObject: Module,
      importObject?: Imports
    ): Promise<Instance>
    function instantiateStreaming(
      response: Response | PromiseLike<Response>,
      importObject?: Imports
    ): Promise<WebAssemblyInstantiatedSource>
    function validate(bytes: BufferSource): boolean
  }
  ```
