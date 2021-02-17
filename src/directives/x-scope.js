import scheduler from '../scheduler'
import { closestDataStack } from '../utils/closest'

export default (el, { value, modifiers, expression }) => {
    console.log('scope')
    // })
}

function closestCustomElementRoot(el) {
    if (el.host) return el.host

    return closestCustomElementRoot(el.parentNode)
}
