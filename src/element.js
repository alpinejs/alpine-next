import hyperactiv from 'hyperactiv'
import directives from './directives'

export function init() {
    let attrs = this.__x__getAttrs()

    attrs.forEach(attr => {
        let noop = () => {}
        let run = this.__x__directives[attr.type] || noop

        run(this, attr.value, attr.modifiers, attr.expression, hyperactiv.computed)
    })
}
