import { directive } from '../directives'
import { evaluate } from '../evaluator'
import { store } from '../store'

directive('store', (el, { value, expression }) => store(value, evaluate(el, expression)))
