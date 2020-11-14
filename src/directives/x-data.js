
import Alpine from '../alpine'

Alpine.directive('data', (el, value, modifiers, expression, effect) => {
    expression = expression === '' ? '{}' : expression

    let components = Alpine.clonedComponentAccessor()

    if (Object.keys(components).includes(expression)) {
        el._x_data = components[expression]
    } else {
        el._x_data = el._x_evaluate(expression)
    }

    el._x_$data = Alpine.observe(el._x_data)
    el._x_dataStack = new Set(el._x_closestDataStack())
    el._x_dataStack.add(el._x_$data)
})
