# Class React

`mod.ts` provides a way to generate html or xml string from tsx. This is done by `class React`, and its `stringify` method.

`React.toString` is a shortcut to `React.stringify('html')`, to provide a default `toString` method.

## Example of overall usage

```tsx
#! /usr/bin/env deno run -A --unstable
import { React } from '<path to tsx-static/mod.ts>'
export const index = (
  <html>
    <head>
      <title>Index</title>
    </head>
    <body></body>
  </html>
)

Deno.mkdirSync('dist/', { recursive: true })
Deno.writeTextFileSync('dist/index.html', index.stringify('html'))
```

You can write your own build script, use the [`builder.ts`](./builder.md), or use (for example, even) a Makefile to automate the building task.

## Document Types

`React.stringify` can produce string for different document type, which is decided by the first parameter passed to it.

- HTML
  - This is to generate valid HTML document. HTML specified self-closing tags will be forced self-closing, and other tags will be forced non-self-closing, no matter they actually have children or not.
  - Self closing tags will be like `<br>` instead of `<br/>`
- XML
  - This is the stringify mode without any assumption. Tags will be self-closing as long as they have no children, the document will be in valid XML, therefore `<br/>` instead of `<br>`.
  - This mode will not automatically set `xmlns`.
- XHTML
  - This mode tries to generate document that is both valid XML and valid HTML, so that it becomes valid XHTML document.
  - Like HTML, only self-closing tags can be self-closing, and self-closing tags are forced to be self-closing.
  - Like XML, `<br/>` instead of `<br>`.
  - `xmlns` will be set for well-known tags, like `html`, `svg` and `math`.
  - To generate valid standalone `svg` image without assigning `xmlns` manually, this, instead of XML, is the preferred mode.
  - XHTML mode may result in slightly bigger document than HTML mode. For HTML document, mode HTML is usually preferred.

## Internal style sheet and inline style

- `React.stringify` will try to detect tag name `style` and attribute name `style`, even in XML mode.
- If the content of the tag or attribute is an object, the object will be parsed as a style sheet or style object.
- It will then be stringified by the specific routine for style sheets and styles, instead its own `toString` method.
- **The attribute names of the style object will not be in JavaScript way, and the names are stringified as is without translation. That is to say, you should use `background-color` instead of `backgroundColor`. This is different from how React (the real React) process things.**
- Examples of how to use inline style and internal style sheet:
  - inline style:
    ```jsx
    <div
      style={{
        'background-color': 'white'
      }}
    ></div>
    ```
  - style sheet:
    ```jsx
    <style>
      {{
        'html, body': {
          background: 'white'
        },
        'div#main': {
          display: 'block'
        }
      }}
    </style>
    ```
  - A style sheet entry can be an array. In that case, that entry is expanded to multiple sheets with the same selector. This can be useful for at-rules (like `@font-face`).
    ```jsx
    <style>
      {{
        'div#main p': [
          {
            background: 'white'
          },
          {
            display: 'block'
          }
        ]
      }}
    </style>
    ```
  - Nested style sheet is allowed since `1.1.0`. The following example should work exactly the same as above.
    ```jsx
    <style>
      {{
        'div#main': {
          p: [
            {
              background: 'white'
            },
            {
              display: 'block'
            }
          ]
        }
      }}
    </style>
    ```

## Inline script tag and inline event handler

- `React.stringify` will automatically translate function attributes into IIFE, with (hopefully) minification applied:
  ```jsx
  <button onclick={() => alert('1')}>click me!</button>
  ```
  will be translated into
  ```html
  <button onclick="(()=>alert('1'))()">click me!</button>
  ```
- **`onclick` instead of `onClick`, this is the same behavior as how we process style sheets, but different from how (the real) React works.**
- `<script>` tags has a compile-time only `IIFE` attribute, if it is set to `true`, all containing functions within this `<script>` tag will be translated into IIFE.

  ```jsx
  <div onclick={() => console.log(1)}>
    <script IIFE>
      {() => console.log(1)}
      {() => console.log(1)}
      {() => {
        console.log(1)
        console.log(1)
        console.log(1)
        console.log(1)
      }}
    </script>
  </div>
  ```

  will be translated into (the below html fragment is re-formatted for readability)

  ```html
  <div onclick="(() => console.log(1))()">
    <script>
      ;(() => console.log(1))()
      ;(() => console.log(1))()
      ;(() => {
        console.log(1)
        console.log(1)
        console.log(1)
        console.log(1)
      })()
    </script>
  </div>
  ```

- **There will be no bundler applied to `<script>` tags, and dependencies will not be resolved, since we make no pre-assumption for dependency resolution or bundling.**
  - If you want to bundle and import large pieces of script with complex dependencies, consider `script[src]` or `script[type="module"]` instead.
  - If bundling is not what you want, `script[IIFE]` might just serve your need.
