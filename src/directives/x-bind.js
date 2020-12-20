import hyperactiv from 'hyperactiv'
import Alpine from '../alpine'
import bind from '../utils/bind'
import { evaluator } from '../utils/evaluate'

Alpine.directive('bind', (el, value, modifiers, expression, effect) => {
    let attrName = value
    let evaluate = evaluator(el, expression)

    // Ignore :key bindings. (They are used by x-for)
    if (attrName === 'key') return;

    effect(() => evaluate()(value => {
        if (attrName === 'class' && typeof value === 'object') {
            console.warn(`Alpine Expression Error: Invalid class binding: "${expression}".\n\nArray and Object syntax for class bindings is no longer supported in version 3.0.0 and later.\n\n`, el)
        }

        bind(el, attrName, value, modifiers)
    }))
})
