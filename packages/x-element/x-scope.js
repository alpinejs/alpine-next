import { directive } from '../directives'
import scheduler from '../scheduler'
import { closestDataStack } from '../utils/closest'

directive('scope', (el, { value, modifiers, expression }) => {
    console.log('scope')
})

function closestCustomElementRoot(el) {
    if (el.host) return el.host

    return closestCustomElementRoot(el.parentNode)
}
