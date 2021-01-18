import hyperactiv from 'hyperactiv'
import Alpine from '../alpine'
import bind from '../utils/bind'
import { evaluateSync, evaluator } from '../utils/evaluate'

Alpine.directive('bind', (el, value, modifiers, expression, effect) => {
    let attrName = value
    let evaluate = evaluator(el, expression)

    // Ignore :key bindings. (They are used by x-for)
    if (attrName === 'key') return;

    if (! el._x_bindings) {
        el._x_bindings = {}
    }

    el._x_bindings[attrName] = () => {
        let result

        evaluate()(value => result = value)

        return result
    }

    effect(() => evaluate()(value => {
        bind(el, attrName, value, modifiers)
    }))
})
