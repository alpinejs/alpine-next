import Alpine from '../alpine'
import { evaluate } from '../utils/evaluate'

let handler = (el, value, modifiers, expression, effect) => {
    evaluate(el, expression, {}, false)
}

handler.initOnly = true

Alpine.directive('init', handler)
