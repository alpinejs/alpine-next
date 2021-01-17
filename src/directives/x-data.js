
import Alpine from '../alpine'
import { closestDataStack } from '../utils/closest'
import { evaluate, evaluateSync } from '../utils/evaluate'

let handler = (el, value, modifiers, expression, effect) => {
    expression = expression === '' ? '{}' : expression

    let components = Alpine.components
    let data

    if (Object.keys(components).includes(expression)) {
        data = components[expression]()
        data._x_canonical = true
    } else {
        data = evaluateSync(el, expression)
    }

    Alpine.injectMagics(data, el)

    el._x_data = data

    el._x_$data = Alpine.reactive(el._x_data)
    el._x_dataStack = new Set(closestDataStack(el))
    el._x_dataStack.add(el._x_$data)

    el.dispatchEvent(new CustomEvent('alpine:initializingComponent', { detail: el._x_$data, bubbles: true }))

    if (data['init']) {
        evaluateSync(el, data['init'].bind(data))
    }

    if (data['destroy']) {
        Alpine.addDestroyCallback(el, () => {
            evaluate(el, data['destroy'].bind(data))
        })
    }
}

handler.initOnly = true

Alpine.directive('data', handler)
