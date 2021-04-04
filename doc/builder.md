# builder

`builder.ts` provides several helper functions to use with `deno-tsx`.

## function build

`build` takes a target path, and a list of files to write. It will write all files to target path, and produce a hash list for each file written. The hash uses `sha-1`, which is **not cryptographically secure**, but usable both in deno and browsers. The hashes are provided mainly for caching purpose.

## loaders

`loaders` provide several functions to read and process source files.

- `loaders.tsx`
  - This function is used to read from `tsx` files, and get the html or xml string.
- `loaders.text` and `loaders.binary`
  - These two functions are for plain text or plain binary.
- `loaders.ts`

  - emit
    - this function is to use `Deno.emit` to produce standalone JavaScript file. It supports only ECMAScript Module because this is what `Deno.emit` supports.
    - `loaders.ts.emit` use the `double emit` technique to provide compiling and ESM bundling.
    - **It implements bundling, but the dependencies must be passed manually. It uses the `sources` option of `Deno.emit`, which means it will not use any external file not provided through `deps` parameter.**
      - A trivial dependency resolver for this particular usage is currently under consideration, since it is helpful and harmless. However, this resolver may not work will all npm modules.
  - asset

    - This function is to turn a string into TypeScript module.

      ```ts
      loaders.ts.asset('this is an asset string')
      ```

      will become

      ```ts
      export default 'this is an asset string'
      ```

      so that it can be used as a `dep` in `loaders.ts.emit`

## function emit

`function emit` is the underlying `double emit` technique used by `loaders.ts.emit`.

## Overall examples

```tsx
// this is pages/index.tsx
import { React } from '<path to tsx-static/mod.ts>'
export const index = (
  <html>
    <head>
      <title>Index</title>
    </head>
    <body>
      <script type="module" src=".esm/foo.js"></script>
    </body>
  </html>
)
```

```ts
// ./foo.js
import { window } from 'https://deno.land/x/tsx_static/dom.ts'
import * as asset from './include/asset.ts'
window.document.write(asset)
```

```ts
import { build, loaders } from '<deno_tsx/mod.ts>'
const some_other_list = something_else()
const hashes = await build('/dist', {
    'index.html': loaders.tsx('html', './pages/index.tsx'),
    'logo.svg': loaders.tsx('xhtml', './images/logo.tsx'),
    'font.woff': loaders.binary('./assets/font.woff'),
    'esm/foo.js': loaders.ts.emit(
        './foo.ts',
        {
            'https://deno.land/x/tsx_static/dom.ts': {
              path: 'https://deno.land/x/tsx_static/dom.ts'
            },
            '/include/asset.ts': loaders.ts.asset('some-asset-string'),
            '/template.tsx': loaders.ts.asset(loaders.tsx('html', './template.tsx'))
        }
    ),
    'sw.js': loaders.ts.emit('./sw.ts'),
    ...some_other_list
}
```
