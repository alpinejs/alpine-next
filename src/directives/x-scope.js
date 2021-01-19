import Alpine from '../alpine'
import scheduler from '../scheduler'
import { closestDataStack } from '../utils/closest'
import { evaluateSync, evaluator } from '../utils/evaluate'

Alpine.directive('scope', (el, value, modifiers, expression) => {
    console.log('scope')
    // })
})

function closestCustomElementRoot(el) {
    if (el.host) return el.host

    return closestCustomElementRoot(el.parentNode)
}
