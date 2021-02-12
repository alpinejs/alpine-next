import Alpine from '../alpine'
import { evaluator } from '../evaluator'
import on from '../utils/on'

Alpine.directive('on', (el, value, modifiers, expression) => {
    let evaluate = evaluator(el, expression, {}, false)

    let removeListener = on(el, value, modifiers, e => {
        evaluate({ '$event': e })
    })

    Alpine.addDestroyCallback(el, removeListener)
})
