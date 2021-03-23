import { minify } from 'https://deno.land/x/minifier/mod.ts'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any
    }
  }
}

export class StyleSheet {
  readonly sheets: { [selector: string]: Style | Style[] }
  constructor(sheets: any) {
    this.sheets = {}
    Object.keys(sheets).map(selector => {
      const sheet = sheets[selector]
      if (sheet instanceof Array) {
        this.sheets[selector] = sheet.map(s => new Style(s))
      } else {
        this.sheets[selector] = new Style(sheets[selector])
      }
    })
  }
  toSingleSelectorString(selector: string, sheet: any | Array<any>): string {
    if (sheet instanceof Array)
      return sheet
        .map(s => this.toSingleSheetString(selector, new Style(s)))
        .join('')
    else return this.toSingleSheetString(selector, new Style(sheet))
  }
  toSingleSheetString(selector: string, sheet: Style) {
    const parts: string[] = []
    const { str, rem } = sheet.toSheetString()
    if (str) parts.push(`${selector}{${str}}`)
    parts.push(
      ...rem.map(nested =>
        this.toSingleSelectorString(
          `${selector} ${nested.selector}`,
          nested.sheet
        )
      )
    )
    return parts.join('')
  }
  toString() {
    return Object.keys(this.sheets)
      .map(s => {
        return this.toSingleSelectorString(s, this.sheets[s])
      })
      .join('')
  }
}

export class Style {
  styles: { [index: string]: any } | string
  constructor(styles: { [index: string]: any } | string | Style) {
    if (styles instanceof Style) {
      this.styles = styles.styles
    } else {
      this.styles = styles
    }
  }
  toString() {
    const styles = this.styles
    if (typeof styles === 'string') return styles
    return Object.keys(styles)
      .map(k => (styles[k] instanceof Object ? '' : `${k}:${styles[k]}`))
      .filter(Boolean)
      .join(';')
  }
  toSheetString() {
    const styles = this.styles
    if (typeof styles === 'string') return { str: styles, rem: [] }
    const rem: { selector: string; sheet: any }[] = []
    const str = Object.keys(styles)
      .map(k => {
        if (styles[k] instanceof Object) {
          rem.push({ selector: k, sheet: styles[k] })
        } else {
          return `${k}:${styles[k]}`
        }
      })
      .filter(Boolean)
      .join(';')
    return { str, rem }
  }
}

export type DocType = 'xml' | 'html' | 'xhtml'
export class React {
  static xmlns: { [type: string]: string } = {
    html: 'http://www.w3.org/1999/xhtml',
    svg: 'http://www.w3.org/2000/svg',
    math: 'http://www.w3.org/1998/Math/MathML'
  }
  static readonly self_closing = [
    'area',
    'base',
    'br',
    'col',
    'command',
    'embed',
    'hr',
    'img',
    'input',
    'keygen',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr'
  ]
  readonly tag: string
  readonly props: { [index: string]: string | object }
  readonly children: unknown[]
  constructor(
    tag: string,
    props?: { [index: string]: string | object },
    ...children: unknown[]
  ) {
    this.tag = tag
    this.props = props ?? {}
    this.children =
      this.tag === 'style' ? [new StyleSheet(children[0])] : children
  }

  props_string() {
    return Object.keys(this.props)
      .filter(
        this.tag === 'script'
          ? k =>
              this.props[k] !== undefined &&
              this.props[k] !== null &&
              k !== 'IIFE'
          : k => this.props[k] !== undefined && this.props[k] !== null
      )
      .map(
        k =>
          ` ${k}="${
            k === 'style'
              ? new Style(this.props[k]).toString()
              : this.props[k] instanceof Function
              ? minify('js', `(${this.props[k].toString()})()`)
              : this.props[k].toString()
          }"`
      )
      .join('')
  }
  children_string(type: DocType, children: any[] = this.children): string {
    return children
      .map(c =>
        typeof c === 'string'
          ? c
          : c instanceof React
          ? c.stringify(type)
          : c instanceof Array
          ? this.children_string(type, c)
          : this.tag === 'script' && this.props['IIFE'] && c instanceof Function
          ? minify('js', `\n(${c})();\n`)
          : c.toString()
      )
      .join('')
  }

  isHTML(type: DocType) {
    return (type == 'html' || type === 'xhtml') && this.tag === 'html'
  }
  isXML(type: DocType) {
    return type === 'xml' || type === 'xhtml'
  }
  isSelfClosing(type: DocType) {
    if (type === 'html' || type === 'xhtml') {
      return React.self_closing.includes(this.tag)
    } else {
      return this.children.length < 1
    }
  }

  assignXMLNS(type: DocType) {
    if (type !== 'xhtml') return
    if (Object.keys(React.xmlns).includes(this.tag) && !this.props.xmlns) {
      this.props.xmlns = React.xmlns[this.tag]
    }
  }

  stringify_selfClosing(type: DocType): string {
    if (this.children.length > 0) {
      console.warn(`Self-closing <${this.tag}> but child list non-empty`)
    }
    return `<${this.tag}${this.props_string()}${this.isXML(type) ? '/' : ''}>`
  }
  stringify_nonSelfClosing(type: DocType): string {
    return `<${this.tag}${this.props_string()}>${this.children_string(
      ['svg', 'math'].includes(this.tag) ? 'xml' : type
    )}</${this.tag}>`
  }

  stringify(type: DocType = 'html'): string {
    this.assignXMLNS(type)
    return (
      (this.isHTML(type) ? '<!DOCTYPE html>' : '') +
      (this.isSelfClosing(type)
        ? this.stringify_selfClosing(type)
        : this.stringify_nonSelfClosing(type))
    )
  }
  toString() {
    return this.stringify('html')
  }
  static createElement(
    tag:
      | string
      | ((
          props?: { [index: string]: string | object },
          ...children: unknown[]
        ) => React),
    props?: { [index: string]: string | object },
    ...children: unknown[]
  ): React {
    if (tag instanceof Function) {
      return tag(props, ...children)
    } else {
      return new React(tag, props, ...children)
    }
  }
}
