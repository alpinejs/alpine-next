import Alpine from '../alpine'
import bind from '../utils/bind'
import { directives } from '../utils/directives'
import { evaluateSync, evaluator } from '../evaluator'

Alpine.directive('bind', (el, value, modifiers, expression, effect) => {
    if (! value) {
        let bindings = evaluateSync(el, expression)

        let rawAttributes = Object.entries(bindings).map(([name, value]) => ({ name, value }))

        let attributes = directives(el, rawAttributes)

        Alpine.init(el, attributes)

        return
    }

    let evaluate = evaluator(el, expression)

    // Ignore x-bind:key. (x-for will handle that)
    if (value === 'key') return

    effect(() => evaluate()(result => {
        bind(el, value, result, modifiers)
    }))
})
