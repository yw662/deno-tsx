[![Deno](https://github.com/yw662/deno-tsx/actions/workflows/deno.yml/badge.svg)](https://github.com/yw662/deno-tsx/actions/workflows/deno.yml)
[![codecov](https://codecov.io/gh/yw662/deno-tsx/branch/main/graph/badge.svg?token=1AFX2FSKF9)](https://codecov.io/gh/yw662/deno-tsx)

# TSX-static

This is a minimal library for tsx pre-rendering or static site generation.

## Usage

- `mod.ts`: Import React from mod.ts, Write tsx DOM as in React, and use `React.stringify` or `React.toString` to generate string from the DOM.
- `types.dom.d.ts`: This `d.ts` contains additional type declarations not provided by deno, so that frontend code can survive type check.

  - It is of no use if you are not writing frontend JavaScript inside tsx.
  - Notice: `types.dom.d.ts` contains only type declarations but no constant declarations. You need sth. like

    ```ts
    declare const document: Document
    ```

    or

    ```ts
    declare const HTMLElement: {
      prototype: HTMLElement
      new (): HTMLElement
    }
    ```

  to use them.

## About `React.stringify`

### Document Types

`React.stringify` allow passing a parameter `DocType`, which specify what kind of document it is producing.

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

### Special treatments for style sheet and inline styles

- This behavior may change in future versions.

- `React.stringify` will try to detect tag name `style` and attribute name `style`, even in XML mode.
- If the content of the tag or attribute is an object, the object will be parsed as a style sheet or style object.
- It will then be stringified by the specific routine for style sheets and styles, instead its own `toString` method.
- However the attribute names of the style object will not be in JavaScript way, and the names are stringified as is without translation. That is to say, you should use `background-color` instead of `backgroundColor`.
- style example:
  ```js
  {
    'background-color': 'white'
  }
  ```
- inline style example:
  ```jsx
  <div
    style={{
      'background-color': 'white'
    }}
  ></div>
  ```
- style sheet example:
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
- A style sheet entry can be an array. In that case, that entry is expanded to multiple sheets with the same selector. This can be useful for at-rules.
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

### Special treatment for script tag and inline event handlers

- `React.stringify` will automatically translate function attributes into IIFE, and minification will be applied after that.
- This is to say,
  ```jsx
  <button onclick={() => alert('1')}>click me!</button>
  ```
  will be translated into
  ```html
  <button onclick="(()=>alert('1'))()">click me!</button>
  ```
- Notice: `onclick` instead of `onClick`.
- `<script>` tags are given a compile-time only `IIFE` attributes, if it is set to `true`, all containing functions within this `<script>` tag will be translated into IIFE.
- There will be no bundler applied to `<script>` tags, and dependencies will not be resolved. If you want to import large pieces of script with complex dependencies, please use `script[src]` or `script[type="module"]` instead.

# Example: How to create a tsx page, render it with tsx-static, and write it into `dist/index.html`

```ts
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

You can write your own build script or use (for example, even) a Makefile to automate the later part.

# Why this project, and what it plans to be

There are already some SSG and pre-rendering libraries, but most of them are not "fully" static. This library will stringify the whole document so that **there will be no client-side jsx presence by default**, and therefore **there will be no server-side rendering**.

Another good thing about this project, is that it won't get in your way. Unlike frameworks like preact and next.js, this project only helps you deal with tsx and will do nothing else:

- It won't assume how you resolve dependencies.
- It won't assume how you bundle things.
- It won't assume how `dist/` (or `public/`) should looks like.
- And, it won't assume there should be a webpack.

It gives the control, from `webpack` or `create-whatever-app`, back to you.
