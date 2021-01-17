import Alpine from '../alpine'
import scheduler from '../scheduler'
import { evaluateSync } from '../utils/evaluate'

Alpine.directive('provide', (el, value, modifiers, expression) => {
    let root = closestCustomElementRoot(el)

    if (! root._x_provides) {
        root._x_provides = {}
    }

    Object.defineProperty(root._x_provides, expression, {
        get() {
            return evaluateSync(el, expression)
        }
    })
})

function closestCustomElementRoot(el) {
    if (el.host) return el.host

    return closestCustomElementRoot(el.parentNode)
}
