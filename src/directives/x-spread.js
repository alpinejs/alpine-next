import Alpine from '../alpine'
import { directives } from '../utils/directives'
import { evaluateSync } from '../utils/evaluate'

Alpine.directive('spread', (el, value, modifiers, expression, effect) => {
    let spreadObject = evaluateSync(el, expression)

    let rawAttributes = Object.entries(spreadObject).map(([name, value]) => ({ name, value }))

    let attributes = directives(el, rawAttributes)

    Alpine.init(el, attributes)
})
