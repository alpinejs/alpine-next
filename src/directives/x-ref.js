export default (el, value, modifiers, expression, react) => {
    let root = el.__x__closestRoot()

    if (! root.__x__$refs) root.__x__$refs = {}

    root.__x__$refs[expression] = el
}
