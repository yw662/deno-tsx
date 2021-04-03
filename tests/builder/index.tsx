import { React, window, Window } from '../../mod.ts'
declare const document: Window.Document
export default (
  <html>
    <head>
      <title>Index</title>
    </head>
    <body>
      <script IIFE>
        {() => window.document.write('IIFE executed')}
        {() => document.write('IIFE executed')}
      </script>
    </body>
  </html>
)
