import Alpine from '../alpine'
import { evaluator } from '../evaluator'

Alpine.directive('text', (el, value, modifiers, expression, effect) => {
    let evaluate = evaluator(el, expression)

    effect(() => {
        evaluate()(value => {
            el.textContent = value
        })
    })
})
