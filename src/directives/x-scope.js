import Alpine from '../alpine'
import scheduler from '../scheduler'
import { closestDataStack } from '../utils/closest'
import { evaluateSync, evaluator } from '../utils/evaluate'

Alpine.directive('scope', (el, value, modifiers, expression) => {
    let slot = el.firstElementChild.assignedSlot
    // let root = closestCustomElementRoot(el)

    let object = evaluateSync(el, expression)

    let reactiveRoot = {

    }

    Object.entries(object).forEach(([name, defaultValue]) => {
        let getter = evaluator(el)

        Object.defineProperty(reactiveRoot, name, {
            get() {
                console.log('get')
                return slot._x_bindings[name]()
            }
        })
    })


    el._x_dataStack = new Set(closestDataStack(el))
    el._x_dataStack.add(Alpine.reactive(reactiveRoot))

    // Object.defineProperty(root._x_provides, expression, {
    //     get() {
    //         return evaluateSync(el, expression)
    //     }
    // })
})

function closestCustomElementRoot(el) {
    if (el.host) return el.host

    return closestCustomElementRoot(el.parentNode)
}
