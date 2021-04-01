# types.dom.d.ts

`types.dom.d.ts` contains type declarations for `DOM API`. This is mainly used to let frontend JavaScript pass type check.

To write inline JavaScript(TypeScript) within tsx, it can be used as such:

```tsx
/// <reference path="path to types.dom.d.ts" />
import { React } from '<path to tsx-static/mod.ts>'

declare const document: Document

export const index = (
  <html>
    <head>
      <title>Index</title>
    </head>
    <body>
      <script IIFE>{() => document.write('IIFE executed')}</script>
    </body>
  </html>
)
```

which will produce:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Index</title>
  </head>
  <body>
    <script>
      ;(() => document.write('IIFE executed'))()
    </script>
  </body>
</html>
```

This is also useful for frontend TypeScript with `Deno.emit`. More detailed description on this can be found [here](./builder.md).
