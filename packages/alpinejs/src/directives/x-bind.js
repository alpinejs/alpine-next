import { directive, directives, into, mapAttributes, prefix, startingWith } from '../directives'
import { evaluate, evaluateLater } from '../evaluator'
import bind from '../utils/bind'

mapAttributes(startingWith(':', into(prefix('bind:'))))

directive('bind', (el, { value, modifiers, expression, original }, { effect }) => {
    if (! value) return applyBindingsObject(el, expression, original)

    if (value === 'key') return storeKeyForXFor(el, expression)

    let evaluate = evaluateLater(el, expression)

    effect(() => evaluate(result => {
        bind(el, value, result, modifiers)
    }))
})

function applyBindingsObject(el, expression, original) {
    let bindings = evaluate(el, expression)

    let attributes = Object.entries(bindings).map(([name, value]) => ({ name, value }))

    directives(el, attributes, original).forEach(handle => handle())
}

function storeKeyForXFor(el, expression) {
    el._x_key_expression = expression
}
