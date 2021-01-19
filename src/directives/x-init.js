import Alpine from '../alpine'
import { evaluate } from '../utils/evaluate'

Alpine.directive('init', (el, value, modifiers, expression, effect) => {
    evaluate(el, expression, {}, false)
})
