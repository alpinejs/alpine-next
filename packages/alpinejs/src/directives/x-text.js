import { directive } from '../directives'
import { evaluateLater } from '../evaluator'
import { effect } from '../reactivity'

directive('text', (el, { expression }) => {
    let evaluate =evaluateLater(el, expression)

    effect(() => evaluate(value => el.textContent = value))
})
