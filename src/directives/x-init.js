import Alpine from '../alpine'
import { evaluate } from '../evaluator'

Alpine.directive('init', (el, value, modifiers, expression, effect) => {
    evaluate(el, expression, {}, false)
})
