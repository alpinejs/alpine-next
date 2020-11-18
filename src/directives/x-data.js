
import Alpine from '../alpine'

Alpine.directive('data', (el, value, modifiers, expression, effect) => {
    // Skip if already initialized
    if (el._x_dataStack) return

    expression = expression === '' ? '{}' : expression

    let components = Alpine.clonedComponentAccessor()
    let data

    if (Object.keys(components).includes(expression)) {
        data = components[expression]
    } else {
        data = el._x_evaluate(expression)
    }

    Alpine.injectMagics(data, el)

    el._x_data = data
    el._x_$data = Alpine.observe(el._x_data)
    el._x_dataStack = new Set(el._x_closestDataStack())
    el._x_dataStack.add(el._x_$data)
})
