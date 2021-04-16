import { directive, directives, handleDirective, into, mapAttributes, prefix, startingWith } from '.'
import { evaluate, evaluateLater } from '../evaluator'
import { effect } from '../reactivity'
import bind from '../utils/bind'

mapAttributes(startingWith(':', into(prefix('bind:'))))

directive('bind', (el, { value, modifiers, expression }) => {
    if (! value) return applyBindingsObject(el, expression)

    if (value === 'key') return storeKeyForXFor(el, expression)

    let evaluate =evaluateLater(el, expression)

    effect(() => evaluate(result => {
        bind(el, value, result, modifiers)
    }))
})

function applyBindingsObject(el, expression) {
    let bindings = evaluate(el, expression)

    let attributes = Object.entries(bindings).map(([name, value]) => ({ name, value }))

    directives(el, attributes).forEach(directive => {
        handleDirective(el, directive)
    })
}

function storeKeyForXFor(el, expression) {
    el._x_key_expression = expression
}
