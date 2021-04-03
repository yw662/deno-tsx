import { assertEquals } from 'https://deno.land/std/testing/asserts.ts'
import { build, loaders } from '../mod.ts'

Deno.test('loaders.binary', async () => {
  assertEquals(
    await Deno.readFile('./tests/builder/index.tsx'),
    await loaders.binary('./tests/builder/index.tsx')
  )
})

Deno.test('loaders.text', async () => {
  assertEquals(
    await Deno.readTextFile('./tests/builder/index.tsx'),
    await loaders.text('./tests/builder/index.tsx')
  )
})

Deno.test('loaders.tsx', async () => {
  assertEquals(
    '<!DOCTYPE html><html><head><title>Index</title></head><body></body></html>',
    await loaders.tsx('html', './tests/builder/index.tsx')
  )
  assertEquals(
    '<html><head><title>Index</title></head><body/></html>',
    await loaders.tsx('xml', './tests/builder/index.tsx')
  )
  assertEquals(
    '<!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml"><head><title>Index</title></head><body></body></html>',
    await loaders.tsx('xhtml', './tests/builder/index.tsx')
  )
})

Deno.test('loaders.ts.asset', async () => {
  assertEquals('export default `qwerty`', await loaders.ts.asset('qwerty'))
})

Deno.test('loaders.ts.emit', async () => {
  assertEquals(
    '"use strict"; const a = `b`; const b = \'c\'; console.log(a, b);',
    await loaders.ts.emit('./tests/builder/index.ts', {
      '/tests/builder/a.ts': 'export const a = `b`',
      '/tests/builder/b.ts': { path: './tests/builder/b.ts' },
      '/tests/builder/c.ts': { path: './tests/builder/c.ts' }
    })
  )
})

Deno.test('build', async () => {
  const hashes = await build('./tests/builder/dist', {
    'index.html': loaders.tsx('html', './tests/builder/index.tsx'),
    'index.js': loaders.ts.emit('./tests/builder/index.ts', {
      '/tests/builder/a.ts': 'export const a = `b`',
      '/tests/builder/b.ts': { path: './tests/builder/b.ts' },
      '/tests/builder/c.ts': { path: './tests/builder/c.ts' }
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
      'index.html': 'JPhsllsXvVy7MreZnfileKm+SXU=',
      'index.js': '7ZmEoGoFXtIgozv9ZQ7ODGRrW2E=',
      'sth-else': 'QHOy5IVT+HKyPedj51PNrbUMYBM='
    },
    hashes
  )
  Deno.removeSync('./tests/builder/dist', { recursive: true })
})
