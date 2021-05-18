type Async<T> = T | PromiseLike<T>

import * as path from 'https://deno.land/std/path/mod.ts'
import { createHash } from 'https://deno.land/std/hash/mod.ts'
import { React, DocType } from './react.ts'
import { minify } from 'https://deno.land/x/minifier/mod.ts'

function parseString(literal: string) {
  literal = literal.trim()
  const quote = literal[0]
  const right = literal.lastIndexOf(quote)
  return literal.slice(1, right)
}

function parseDependency(line: string) {
  const isImport = line.startsWith('import ')
  const isExport = line.startsWith('export ')
  if (!isImport && !isExport) return undefined
  const from = line.indexOf('from ')
  if (from !== -1) return parseString(line.slice(from + 5))
  if (isExport) return undefined
  return parseString(line.slice(7))
}

function lookupDependency(file: string, cwd: string) {
  // TODO: It may not be necessary to check every lines
  return file
    .split('\n')
    .map(parseDependency)
    .filter((v): v is string => v !== undefined)
    .map(dep => {
      if (isURL(dep)) return dep
      if (isURL(cwd)) {
        const ret = new URL(cwd)
        ret.pathname = path.join(ret.pathname, dep)
        return ret.toString()
      }
      return path.join(cwd, dep)
    })
}

function isURL(target: string) {
  try {
    new URL(target)
    return true
  } catch (e) {
    return false
  }
}

export function emit(sources: { [index: string]: string }, entry: string) {
  return Deno.emit(entry, {
    bundle: 'module',
    sources
  })
    .then(result =>
      Deno.emit('/src.js', {
        sources: {
          '/src.js': result.files['deno:///bundle.js']
        },
        compilerOptions: {
          target: 'es2020'
        }
      })
    )
    .then(result => result.files['file:///src.js.js'])
    .then(src => minify('js', src))
}

export const loaders = {
  tsx: (type: DocType, src: string) =>
    import(isURL(src) ? src : `file://${path.join(Deno.cwd(), src)}`).then(
      (module: { default: React }) => module.default.stringify(type)
    ),
  text: (src: string) =>
    isURL(src) ? fetch(src).then(resp => resp.text()) : Deno.readTextFile(src),
  binary: (src: string) =>
    isURL(src)
      ? fetch(src)
          .then(resp => resp.arrayBuffer())
          .then(buffer => new Uint8Array(buffer))
      : Deno.readFile(src),
  ts: {
    emit: async (
      src: string,
      dependencies?: { [index: string]: Async<string> }
    ) => {
      const cwd = isURL(src) ? '' : src[0] === '/' ? '/' : './'
      const src_entry = isURL(src) ? src : path.join('/', src)
      let deps = dependencies
        ? await Promise.all(
            Object.keys(dependencies).map(async dep => ({
              [dep]: await dependencies[dep]
            }))
          ).then(deps => deps.reduce((c, v) => ({ ...c, ...v }), {}))
        : {}
      if (!deps[src_entry]) deps[src_entry] = await loaders.text(src)

      // resolving additional dependencies
      let additional = Object.keys(deps)
        .map(dep => lookupDependency(deps[dep], path.dirname(dep)))
        .flat()

      const addToDeps = async (dep: string) => {
        const entry = isURL(dep) ? dep : path.join('/', dep)
        if (deps[entry]) return []
        const content = await loaders.text(
          isURL(dep) ? dep : path.join(cwd, dep)
        )
        deps[entry] = content
        return lookupDependency(content, path.dirname(dep))
      }
      while (additional.length > 0) {
        additional = (await Promise.all(additional.map(addToDeps))).flat()
      }
      return emit(deps, src_entry)
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
