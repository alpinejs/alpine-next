
window.Element.prototype.init = function() {
    if (this.hasAttribute('x-data')) {
        let expression = this.getAttribute('x-data')
        expression = expression === '' ? '{}' : expression

        let components = Alpine.clonedComponentAccessor()


        if (Object.keys(components).includes(expression)) {
            this._x_data = components[expression]
        } else {
            this._x_data = this._x_evaluate(expression)
        }

        this._x_$data = Alpine.observe(this._x_data)
        this._x_dataStack = new Set(this._x_closestDataStack())
        this._x_dataStack.add(this._x_$data)
    }

    let attrs = this._x_attributes()

    attrs.forEach(attr => {
        let noop = () => {}
        let run = Alpine.directives[attr.type] || noop

        run(this, attr.value, attr.modifiers, attr.expression, Alpine.effect)
    })
}

window.Element.prototype.initTree = function() {
    walk(this, el => el._x_init())
}

function walk(el, callback, forceFirst = true) {
    if (! forceFirst && (el.hasAttribute('x-data') || el.__x_for)) return

    callback(el)

    let node = el.firstElementChild

    while (node) {
        walk(node, callback, false)

        node = node.nextElementSibling
    }
}
