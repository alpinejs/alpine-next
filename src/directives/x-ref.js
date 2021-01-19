import Alpine from '../alpine'
import { root } from '../utils/root'

let handler = function (el, value, modifiers, expression, effect, before) {
    let theRoot = root(el)

    if (! theRoot._x_refs) theRoot._x_refs = {}

    theRoot._x_refs[expression] = el
}

handler.immediate = true

Alpine.directive('ref', handler)
