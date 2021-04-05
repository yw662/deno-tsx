import * as path from 'https://deno.land/std/path/mod.ts'
import { assertEquals } from 'https://deno.land/std/testing/asserts.ts'
import { build, loaders } from '../mod.ts'

Deno.test('loaders.binary', async () => {
  assertEquals(
    await Deno.readFile('./tests/builder/index.tsx'),
    await loaders.binary('./tests/builder/index.tsx')
  )
  assertEquals(
    await Deno.readFile('./tests/builder/index.tsx'),
    // But Deno don't allow file:// in fetch
    await loaders.binary(
      'https://deno.land/x/tsx_static/tests/builder/index.tsx'
    )
  )
})

Deno.test('loaders.text', async () => {
  assertEquals(
    await Deno.readTextFile('./tests/builder/index.tsx'),
    await loaders.text('./tests/builder/index.tsx')
  )
  assertEquals(
    await Deno.readTextFile('./tests/builder/index.tsx'),
    // But Deno don't allow file:// in fetch
    await loaders.text('https://deno.land/x/tsx_static/tests/builder/index.tsx')
  )
})

Deno.test('loaders.tsx', async () => {
  assertEquals(
    "<!DOCTYPE html><html><head><title>Index</title></head><body><script>(() => window.document.write('IIFE executed'))();(() => document.write('IIFE executed'))();</script></body></html>",
    await loaders.tsx('html', './tests/builder/index.tsx')
  )
  // But Deno don't allow file:// in fetch
  assertEquals(
    "<!DOCTYPE html><html><head><title>Index</title></head><body><script>(() => window.document.write('IIFE executed'))();(() => document.write('IIFE executed'))();</script></body></html>",
    await loaders.tsx(
      'html',
      'https://deno.land/x/tsx_static/tests/builder/index.tsx'
    )
  )
  assertEquals(
    "<html><head><title>Index</title></head><body><script>(() => window.document.write('IIFE executed'))();(() => document.write('IIFE executed'))();</script></body></html>",
    await loaders.tsx('xml', './tests/builder/index.tsx')
  )
  assertEquals(
    "<!DOCTYPE html><html xmlns=\"http://www.w3.org/1999/xhtml\"><head><title>Index</title></head><body><script>(() => window.document.write('IIFE executed'))();(() => document.write('IIFE executed'))();</script></body></html>",
    await loaders.tsx('xhtml', './tests/builder/index.tsx')
  )
})

Deno.test('loaders.ts.asset', async () => {
  assertEquals('export default `qwerty`', await loaders.ts.asset('qwerty'))
})

Deno.test('loaders.ts.emit', async () => {
  assertEquals(
    "const a = `b`; const window = self; const c = 'd'; const aa1 = `b`; export { aa1 as aa }; window.console.log(a, c);",
    await loaders.ts.emit('./tests/builder/index.ts', {
      '/tests/builder/a.ts': 'export const a = `b`',
      '/tests/builder/aa.ts': 'export const aa = `b`'
    })
  )
  assertEquals(
    "const a = `b`; const window = self; const c = 'd'; const aa1 = `b`; export { aa1 as aa }; window.console.log(a, c);",
    await loaders.ts.emit(path.resolve('./tests/builder/index.ts'), {
      [path.resolve('./tests/builder/a.ts')]: 'export const a = `b`',
      [path.resolve('./tests/builder/aa.ts')]: 'export const aa = `b`'
    })
  )
  assertEquals(
    "const a = `b`; const window = self; const c = 'd'; const aa1 = `b`; export { aa1 as aa }; window.console.log(a, c);",
    await loaders.ts.emit(
      'https://deno.land/x/tsx_static/tests/builder/index.ts',
      {
        'https://deno.land/x/tsx_static/tests/builder/a.ts':
          'export const a = `b`',
        'https://deno.land/x/tsx_static/tests/builder/aa.ts':
          'export const aa = `b`'
      }
    )
  )
})

Deno.test('build', async () => {
  const hashes = await build('./tests/builder/dist', {
    'index.html': loaders.tsx('xhtml', './tests/builder/index.tsx'),
    'index.js': loaders.ts.emit('./tests/builder/index.ts', {
      '/tests/builder/a.ts': 'export const a = `b`',
      '/tests/builder/aa.ts': 'export const aa = `b`'
    }),
    'sth-else': loaders.binary('./tests/builder/index.tsx')
  })
  // So that the files are actually written
  await new Promise(resolve => setTimeout(resolve, 1000))
  assertEquals(
    [
      {
        name: 'index.html',
        isFile: true,
        isDirectory: false,
        isSymlink: false
      },
      { name: 'index.js', isFile: true, isDirectory: false, isSymlink: false },
      { name: 'sth-else', isFile: true, isDirectory: false, isSymlink: false }
    ],
    Array.from(Deno.readDirSync('./tests/builder/dist')).sort((a, b) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : 0
    )
  )
  assertEquals(
    {
      'index.html': 'wGIELclieG2kfOoRoA6Epc0sTUI=',
      'index.js': 'U9v8k1KVSwNRGJUGUvTtgm/a0b8=',
      'sth-else': '+u56Xz58e81hIkJb9TTZ17ylnZA='
    },
    hashes
  )
  Deno.removeSync('./tests/builder/dist', { recursive: true })
})
