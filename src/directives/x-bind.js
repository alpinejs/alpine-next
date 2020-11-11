import hyperactiv from 'hyperactiv'
import Alpine from '../alpine'

Alpine.directive('bind', (el, value, modifiers, expression, effect) => {
    let attrName = value
    let evaluate = el._x_evaluator(expression)

    effect(() => {
        let value = evaluate()

        el._x_bind(attrName, value, modifiers)
    })
})
