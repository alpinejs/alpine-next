import Alpine from './index'

export function init() {
    if (this.hasAttribute('x-data')) {
        let expression = this.getAttribute('x-data')
        expression = expression === '' ? '{}' : expression

        this.__x__data = this.__x__evaluate(expression, Alpine.clonedComponentAccessor())
        this.__x__$data = Alpine.observe(this.__x__data)
        this.__x__dataStack = new Set(this.__x__closestDataStack())
        this.__x__dataStack.add(this.__x__$data)
    }

    let attrs = this.__x__getAttrs()

    attrs.forEach(attr => {
        let noop = () => {}
        let run = Alpine.directives[attr.type] || noop

        run(this, attr.value, attr.modifiers, attr.expression, Alpine.react)
    })
}
