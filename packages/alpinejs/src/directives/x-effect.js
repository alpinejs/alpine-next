import { directive } from '../directives'
import { evaluateLater } from '../evaluator'
import { effect } from '../reactivity'

directive('effect', (el, { expression }) => effect(evaluateLater(el, expression)))
