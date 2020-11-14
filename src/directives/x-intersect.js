import hyperactiv from 'hyperactiv'
import Alpine from '../alpine'

Alpine.directive('intersect', (el, value, modifiers, expression, effect) => {
    let evaluate = el._x_evaluator(expression, {}, false)

    if (value === 'leave') {
        el._x_intersect({ leave: evaluate })
    } else {
        el._x_intersect({ enter: evaluate })
    }
})
