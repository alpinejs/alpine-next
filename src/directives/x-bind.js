import Alpine from '../alpine'
import bind from '../utils/bind'
import { evaluator } from '../utils/evaluate'

Alpine.directive('bind', (el, value, modifiers, expression, effect) => {
    let evaluate = evaluator(el, expression)

    // Ignore x-bind:key. (x-for will handle that)
    if (value === 'key') return

    effect(() => evaluate()(result => {
        bind(el, value, result, modifiers)
    }))
})
