import { closestRoot } from '../lifecycle'
import { directive } from '../directives'

function handler () {}

handler.inline = (el, { expression }) => {
    let root = closestRoot(el)

    if (! root._x_refs) root._x_refs = {}

    root._x_refs[expression] = el
}

directive('ref', handler)
