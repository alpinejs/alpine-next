import Alpine from '../alpine'
import { evaluate } from '../utils/evaluate'

Alpine.directive('destroy', (el, value, modifiers, expression) => {
    Alpine.addDestroyCallback(el, () => evaluate(el, expression, {}, false))
})
