import Alpine from '../alpine'

Alpine.directive('on', (el, value, modifiers, expression) => {
    let evaluate = el._x_evaluator(expression, {}, false)

    el._x_on(el, value, modifiers, e => {
        evaluate({ '$event': e })
    })
})
