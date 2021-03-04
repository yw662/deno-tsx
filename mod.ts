import { minify } from 'https://deno.land/x/minifier/mod.ts'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any
    }
  }
}

export class StyleSheet {
  readonly sheets: { [selector: string]: Style }
  constructor(sheets: any) {
    this.sheets = {}
    Object.keys(sheets).map(
      selector => (this.sheets[selector] = new Style(sheets[selector]))
    )
  }
  toString() {
    return Object.keys(this.sheets)
      .map(selector => `${selector}{${this.sheets[selector]}}`)
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
    return typeof styles === 'string'
      ? styles
      : Object.keys(styles)
          .map(k => `${k}:${styles[k]}`)
          .join(';')
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
          ? k => this.props[k] !== undefined && k !== 'IIFE'
          : k => this.props[k] !== undefined
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
          ? minify('js', `\n(${c})()\n`)
          : c.toString()
      )
      .join('')
  }
  stringify(type: DocType = 'html'): string {
    if (type === 'xhtml') {
      if (Object.keys(React.xmlns).includes(this.tag) && !this.props.xmlns) {
        this.props.xmlns = React.xmlns[this.tag]
      }
    }
    if (
      this.children.length > 0 &&
      React.self_closing.includes(this.tag) &&
      type !== 'xml'
    ) {
      console.warn(
        `DOCTYPE ${type}: self closing tag <${this.tag}>, ignoring children`
      )
    }
    return (
      (type !== 'xml' && this.tag === 'html' ? '<!DOCTYPE html>' : '') +
      ((type === 'xml' && this.children.length < 1) ||
      ((type === 'html' || type === 'xhtml') &&
        React.self_closing.includes(this.tag))
        ? `<${this.tag}${this.props_string()}${type === 'html' ? '' : '/'}>`
        : `<${this.tag}${this.props_string()}>${this.children_string(
            ['svg', 'math'].includes(this.tag) ? 'xml' : type
          )}</${this.tag}>`)
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
