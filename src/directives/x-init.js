import Alpine from '../alpine'

Alpine.directive('init', (el, value, modifiers, expression, react) => {
    el.__x__evaluate(expression, {}, false)
})
