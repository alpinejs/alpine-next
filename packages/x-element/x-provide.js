import { evaluateLaterSync } from "../evaluator"
import { directive } from "../directives"

directive('provide', (el, { expression }) => {
    let evaluate = evaluatorSync(el, expression)

    let root = closestCustomElementRoot(el)

    if (! root._x_provides) root._x_provides = {}

    Object.defineProperty(root._x_provides, expression, {
        get() { return evaluate() }
    })
})

function closestCustomElementRoot(el) {
    if (el._x_customElementRoot) return el

    return closestCustomElementRoot(el.parentNode)
}
