import Alpine from '../alpine'
import { evaluate } from '../evaluator'

Alpine.directive('destroy', (el, value, modifiers, expression) => {
    Alpine.addDestroyCallback(el, () => evaluate(el, expression, {}, false))
})
