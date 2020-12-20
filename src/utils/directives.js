import Alpine from '../alpine.js'

export function directives(el, attributes) {
    let attributeNamesAndValues = attributes || Array.from(el.attributes).map(attr => ({name: attr.name, value: attr.value}))

    attributeNamesAndValues = attributeNamesAndValues.map(({name, value}) => interceptNameAndValue({ name, value}))

    let directives = attributeNamesAndValues.filter(isXAttr).map(parseHtmlAttribute)

    return sortDirectives(directives)
}

export function directivesByType(el, type) {
    return directives(el).filter(attribute => attribute.type === type)
}

export function directiveByType(el, type) {
    return directivesByType(el, type)[0]
}

let xAttrRE = /^x-([^:^.]+)\b/

function isXAttr({ name, value }) {
    return xAttrRE.test(name)
}

function sortDirectives(directives) {
    let directiveOrder = ['data', 'spread', 'ref', 'init', 'bind', 'for', 'model', 'transition', 'show', 'catch-all']

    return directives.sort((a, b) => {
        let typeA = directiveOrder.indexOf(a.type) === -1 ? 'catch-all' : a.type
        let typeB = directiveOrder.indexOf(b.type) === -1 ? 'catch-all' : b.type

        return directiveOrder.indexOf(typeA) - directiveOrder.indexOf(typeB)
    })
}

function parseHtmlAttribute({ name, value }) {
    const typeMatch = name.match(xAttrRE)
    const valueMatch = name.match(/:([a-zA-Z0-9\-:]+)/)
    const modifiers = name.match(/\.[^.\]]+(?=[^\]]*$)/g) || []

    return {
        type: typeMatch ? typeMatch[1] : null,
        value: valueMatch ? valueMatch[1] : null,
        modifiers: modifiers.map(i => i.replace('.', '')),
        expression: value,
    }
}

function interceptNameAndValue({ name, value }, addAttributes) {
    Alpine.intercept(({ name, value }) => {
        if (name.startsWith('@')) name = name.replace('@', 'x-on:')

        return { name, value }
    })

    Alpine.intercept(({ name, value }) => {
        if (name.startsWith(':')) name = name.replace(':', 'x-bind:')

        return { name,  value }
    })

    return Alpine.interceptors.reduce((carry, interceptor) => {
        return interceptor(carry, addAttributes)
    }, { name, value })
}
