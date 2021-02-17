import { applyDirective, directives } from '../directives'
import { evaluateSync, evaluator } from '../evaluator'
import { effect } from '../reactivity'
import bind from '../utils/bind'

export default (el, { value, modifiers, expression }) => {
    if (! value) return applyBindingsObject(el, expression)

    if (value === 'key') return storeKeyForXFor(el, expression)

    let evaluate = evaluator(el, expression)

    effect(() => evaluate(result => {
        bind(el, value, result, modifiers)
    }))
}

function applyBindingsObject(el, expression) {
    let bindings = evaluateSync(el, expression)

    let attributes = Object.entries(bindings).map(([name, value]) => ({ name, value }))

    directives(el, attributes).forEach(directive => {
        applyDirective(el, directive)
    })
}

function storeKeyForXFor(el, expression) {
    el._x_key_expression = expression
}
