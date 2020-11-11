import Alpine from '../alpine'

Alpine.directive('init', (el, value, modifiers, expression, effect) => {
    el._x_evaluate(expression, {}, false)
})
