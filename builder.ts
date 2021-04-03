type Async<T> = T | PromiseLike<T>

import * as path from 'https://deno.land/std/path/mod.ts'
import { createHash } from 'https://deno.land/std/hash/mod.ts'
import { React, DocType } from './react.ts'
import { minify } from 'https://deno.land/x/minifier/mod.ts'

export function emit(sources: { [index: string]: string }, entry: string) {
  return Deno.emit(entry, {
    bundle: 'esm',
    sources
  })
    .then(result =>
      Deno.emit('/src.js', {
        sources: {
          '/src.js': result.files['deno:///bundle.js']
        }
      })
    )
    .then(result => result.files['file:///src.js.js'])
    .then(src => minify('js', src))
}

export const loaders = {
  tsx: (type: DocType, src: string) =>
    import(path.join(Deno.cwd(), src)).then((module: { default: React }) =>
      module.default.stringify(type)
    ),
  text: (src: string) => Deno.readTextFile(src),
  binary: (src: string) => Deno.readFile(src),
  ts: {
    emit: async (
      src: string,
      deps: { [index: string]: { path: string; then?: never } | Async<string> }
    ) => {
      const entry = Deno.readTextFile(src)
      // TODO: recursively automatically resolve dependency
      const dep = Promise.all(
        Object.keys(deps).map(async target => {
          const src = deps[target]
          const content = await (typeof src === 'string' || src.then
            ? src
            : Deno.readTextFile(src.path))
          return { [target]: content }
        })
      ).then(deps => Object.assign({}, ...deps))
      return emit(
        {
          [path.join('/', src)]: await entry,
          ...(await dep)
        },
        path.join('/', src)
      )
    },
    asset: async (asset: Async<string>) => `export default \`${await asset}\``
  }
}

const hashing = (data: string | ArrayBuffer) => {
  const hasher = createHash('sha1')
  hasher.update(data)
  return btoa(
    Array.from(new Uint8Array(hasher.digest()), n =>
      String.fromCharCode(n)
    ).join('')
  )
}

export const build = async (
  target: string,
  files: {
    [path: string]: Async<Uint8Array | string>
  }
) => {
  await Deno.mkdir(target, { recursive: true })
  return await Promise.all(
    Object.keys(files).map(async p => {
      const location = `${target}/${p}`
      await Deno.mkdir(path.dirname(location), { recursive: true })
      const content = await files[p]
      content instanceof Uint8Array
        ? Deno.writeFile(location, content)
        : Deno.writeTextFile(location, content)
      return { [p]: hashing(content) }
    })
  ).then(hashes => hashes.reduce((r, c) => ({ ...r, ...c })))
}
