# dom.ts

`dom.ts` contains only type declarations for `DOM API`. This is mainly used to let frontend JavaScript pass type check.

To write inline JavaScript(TypeScript) within tsx, it can be used as such:

```tsx
import { React, window } from '<path to tsx-static/mod.ts>'

export default (
  <html>
    <head>
      <title>Index</title>
    </head>
    <body>
      <script IIFE>{() => window.document.write('IIFE executed')}</script>
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
      ;(() => window.document.write('IIFE executed'))()
    </script>
  </body>
</html>
```

It also works like this:

```tsx
import { React, window } from '<path to tsx-static/mod.ts>'
```

This is also useful for frontend TypeScript with `Deno.emit`. More detailed description on this can be found [here](./builder.md).
