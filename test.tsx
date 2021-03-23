import { assertEquals } from 'https://deno.land/std/testing/asserts.ts'
import { React, DocType, Style } from './mod.ts'

const testers: {
  [entry: string]: {
    test: () => React
    expect: { [entry in DocType]?: string }
  }
} = {
  html: {
    test: () => <html></html>,
    expect: {
      html: '<!DOCTYPE html><html></html>',
      xhtml:
        '<!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml"></html>',
      xml: '<html/>'
    }
  },
  svg: {
    test: () => <svg></svg>,
    expect: {
      html: '<svg></svg>',
      xhtml: '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
      xml: '<svg/>'
    }
  },
  'self-closing': {
    test: () => (
      <div>
        <br>
          <div></div>
        </br>
        <div></div>
      </div>
    ),
    expect: {
      html: '<div><br><div></div></div>',
      xhtml: '<div><br/><div></div></div>',
      xml: '<div><br><div/></br><div/></div>'
    }
  },
  attributes: {
    test: () => (
      <div
        str="a"
        num={1 + 1}
        tr={true}
        fs={false}
        tr_impl
        toStr={{ toString: () => 'Hello, World' }}
        ud={undefined}
        nl={null}
      ></div>
    ),
    expect: {
      html:
        '<div str="a" num="2" tr="true" fs="false" tr_impl="true" toStr="Hello, World"></div>'
    }
  },
  style: {
    test: () => (
      <div
        style={{
          toString: () => 'I am not a style',
          'background-color': 'white',
          opacity: 0
        }}
      ></div>
    ),
    expect: {
      html: `<div style="background-color:white;opacity:0"></div>`
    }
  },
  'style-string': {
    test: () => <div style={'background-color: white'}></div>,
    expect: {
      html: `<div style="background-color: white"></div>`
    }
  },
  sheet: {
    test: () => (
      <style>
        {{
          sth: {
            foo: 'bar',
            bar: 'baz'
          },
          'sth else': {
            bar: 'foo'
          },
          else: new Style({ a: 'b' }),
          toString: () => 'this is not a sheet'
        }}
      </style>
    ),
    expect: {
      html: '<style>sth{foo:bar;bar:baz}sth else{bar:foo}else{a:b}</style>'
    }
  },
  'sheet-nested': {
    test: () => (
      <style>
        {{
          sth: {
            foo: 'bar',
            bar: 'baz',
            '>sth-else': {
              baz: 'bar',
              else: {
                foo: 'bar'
              }
            }
          }
        }}
      </style>
    ),
    expect: {
      html:
        '<style>sth{foo:bar;bar:baz}sth>sth-else{baz:bar}sth>sth-else else{foo:bar}</style>'
    }
  },
  'sheet-nested-parent': {
    test: () => (
      <style>
        {{
          sth: {
            foo: 'bar',
            bar: 'baz',
            '&.sth-else': {
              baz: 'bar',
              else: {
                foo: 'bar'
              }
            }
          }
        }}
      </style>
    ),
    expect: {
      html:
        '<style>sth{foo:bar;bar:baz}sth.sth-else{baz:bar}sth.sth-else else{foo:bar}</style>'
    }
  },
  'sheet-array': {
    test: () => (
      <style>
        {{
          sth: [
            {
              foo: 'bar',
              bar: 'baz'
            },
            {
              foo: 'bar',
              bar: 'baz'
            }
          ]
        }}
      </style>
    ),
    expect: {
      html: '<style>sth{foo:bar;bar:baz}sth{foo:bar;bar:baz}</style>'
    }
  },
  'sheet-nested-array': {
    test: () => (
      <style>
        {{
          parent: {
            child: [
              {
                foo: 'bar',
                bar: 'baz'
              },
              {
                foo: 'bar',
                bar: 'baz'
              }
            ]
          }
        }}
      </style>
    ),
    expect: {
      html:
        '<style>parent child{foo:bar;bar:baz}parent child{foo:bar;bar:baz}</style>'
    }
  },
  IIFE: {
    test: () => (
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
    ),
    expect: {
      html:
        '<div onclick="(() => console.log(1))()"><script>(() => console.log(1))();(() => console.log(1))();(() => { console.log(1); console.log(1); console.log(1); console.log(1); })();</script></div>'
    }
  },
  functional: {
    test: () => {
      const A = (props: { [index: string]: any }, ...children: any[]) => (
        <div>{children}</div>
      )
      return (
        <A>
          <A>a</A>
          <A>
            b
            <A>
              <A>c</A>
            </A>
            d
          </A>
          <A></A>
        </A>
      )
    },
    expect: {
      html:
        '<div><div>a</div><div>b<div><div>c</div></div>d</div><div></div></div>'
    }
  }
}

for (const entry of Object.keys(testers)) {
  const tester = testers[entry]
  for (const type of Object.keys(tester.expect) as DocType[]) {
    Deno.test(`${entry} type ${type}`, () => {
      assertEquals(tester.test().stringify(type), tester.expect[type])
    })
    if (type === 'html') {
      Deno.test(`${entry} toString`, () => {
        assertEquals(tester.test().toString(), tester.expect[type])
      })
    }
  }
}
