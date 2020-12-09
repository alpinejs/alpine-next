
import Alpine from '../alpine'

let handler = (el, value, modifiers, expression, effect) => {
    expression = expression === '' ? '{}' : expression

    let components = Alpine.clonedComponentAccessor()
    let data

    if (Object.keys(components).includes(expression)) {
        data = components[expression]
        data._x_canonical = true
    } else {
        data = el._x_evaluateSync(expression)
    }

    Alpine.injectMagics(data, el)

    el._x_data = data
    el._x_$data = Alpine.observe(el._x_data)
    el._x_dataStack = new Set(el._x_closestDataStack())
    el._x_dataStack.add(el._x_$data)

    if (data['init']) {
        el._x_evaluateSync(data['init'])
    }
}

handler.initOnly = true

Alpine.directive('data', handler)
