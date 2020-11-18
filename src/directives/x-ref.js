import Alpine from '../alpine'

let refHandler = function (el, value, modifiers, expression, effect, before) {
    let root = el._x_root()

    if (! root._x_$refs) root._x_$refs = {}

    root._x_$refs[expression] = el
}

refHandler.runImmediately = true

Alpine.directive('ref', refHandler)
