import Alpine from '../alpine'

let handler = (el, value, modifiers, expression, effect) => {
    el._x_evaluate(expression, {}, false)
}

handler.initOnly = true

Alpine.directive('init', handler)
