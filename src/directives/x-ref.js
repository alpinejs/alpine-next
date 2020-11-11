import Alpine from '../alpine'

Alpine.directive('ref', (el, value, modifiers, expression, effect) => {
    let root = el._x_root()

    if (! root._x_$refs) root._x_$refs = {}

    root._x_$refs[expression] = el
})
