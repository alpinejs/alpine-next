import hyperactiv from 'hyperactiv'
import Alpine from '../alpine'

Alpine.directive('bind', (el, value, modifiers, expression, effect) => {
    let attrName = value
    let evaluate = el._x_evaluator(expression)

    // Ignore :key bindings. (They are used by x-for)
    if (attrName === 'key') return;

    effect(() => evaluate()(value => {
        if (attrName === 'class' && typeof value === 'object') {
            console.warn(`Alpine Expression Error: Invalid class binding: "${expression}".\n\nArray and Object syntax for class bindings is no longer supported in version 3.0.0 and later.\n\n`, el)
        }

        el._x_bind(attrName, value, modifiers)
    }))
})
