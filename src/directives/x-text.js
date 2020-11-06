import Alpine from '../alpine'

Alpine.directive('text', (el, value, modifiers, expression, react) => {
    let evaluate = el.__x__getEvaluator(expression)

    react(() => {
        el.innerText = evaluate()
    })
})
