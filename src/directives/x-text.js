import Alpine from '../alpine'

Alpine.directive('text', (el, value, modifiers, expression, effect) => {
    let evaluate = el._x_evaluator(expression)

    effect(() => {
        el.textContent = evaluate()
    })
})
