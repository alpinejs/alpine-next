import hyperactiv from 'hyperactiv'

export default (el, value, modifiers, expression) => {
    expression = expression === '' ? '{}' : expression

    el.__x__data = el.__x__evaluate(expression)
    el.__x__$data = hyperactiv.observe(el.__x__data)
    el.__x__dataStack = new Set(el.__x__closestDataStack())
    el.__x__dataStack.add(el.__x__$data)
}
