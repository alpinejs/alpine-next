import Alpine from '../alpine'
import { evaluator } from '../utils/evaluate'
import on from '../utils/on'

Alpine.directive('on', (el, value, modifiers, expression) => {
    let evaluate = evaluator(el, expression, {}, false)

    on(el, value, modifiers, e => {
        evaluate({ '$event': e })
    })
})
