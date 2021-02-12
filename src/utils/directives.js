
export function directivesByType(el, type) {
    return directives(el).filter(attribute => attribute.type === type)
}

export function directives(el, attributes) {
    let attributeNamesAndValues = attributes || Array.from(el.attributes).map(attr => ({name: attr.name, value: attr.value}))

    attributeNamesAndValues = attributeNamesAndValues.map(({name, value}) => interceptNameAndValue({ name, value}))

    let directives = attributeNamesAndValues.filter(isXAttr).map(parseHtmlAttribute)

    return sortDirectives(directives)
}

function isXAttr({ name }) {
    return xAttrRE.test(name)
}

let xAttrRE = /^x-([^:^.]+)\b/

function sortDirectives(directives) {
    let directiveOrder = ['data', 'bind', 'ref', 'init', 'for', 'model', 'transition', 'show', 'if', 'catch-all', 'element']

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

let interceptors = []

function interceptNameAndValue({ name, value }, addAttributes) {
    let intercept = (subject, replacement) => {
        interceptors.push(({ name, value }) => {
            if (name.startsWith(subject)) name = name.replace(subject, replacement)

            return { name, value }
        })
    }

    intercept('@', 'x-on:')
    intercept(':', 'x-bind:')

    // @depricated
    intercept('x-spread', 'x-bind')

    return interceptors.reduce((carry, interceptor) => {
        return interceptor(carry, addAttributes)
    }, { name, value })
}
