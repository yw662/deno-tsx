import { React, window } from '../../mod.ts'
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
