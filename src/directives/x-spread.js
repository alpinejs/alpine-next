
import Alpine from '../alpine'

Alpine.directive('spread', (el, value, modifiers, expression, effect) => {
    let spreadObject = el._x_evaluateSync(expression)

    let rawAttributes = Object.entries(spreadObject).map(([name, value]) => ({ name, value }))

    let attributes = el._x_attributes(rawAttributes)

    Alpine.init(el, attributes)
})
