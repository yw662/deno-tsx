import { a } from './a.ts'
export { aa } from './aa.ts'
import { window } from '../../dom.ts'
import { b } from './b.ts'
import './b.ts'
window.console.log(a, b)
