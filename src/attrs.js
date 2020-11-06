
export function getAttrs() {
    let directives = Array.from(this.attributes).filter(isXAttr).map(parseHtmlAttribute)

    let spreadDirective = directives.filter(directive => directive.type === 'spread')[0]

    if (spreadDirective) {
        let data = this.__x__closestDataProxy()

        let spreadObject = data[spreadDirective.expression] || this.__x__evaluate(spreadDirective.expression)

        directives = directives.concat(Object.entries(spreadObject).map(([name, value]) => parseHtmlAttribute({ name, value })))
    }

    return sortDirectives(directives)
}

let xAttrRE = /^x-([^:]+)\b/

function isXAttr(attr) {
    const name = replaceAtAndColonWithStandardSyntax(attr.name)

    return xAttrRE.test(name)
}

function sortDirectives(directives) {
    let directiveOrder = ['ref', 'data', 'init', 'for', 'bind', 'model', 'transition', 'show', 'catch-all']

    return directives.sort((a, b) => {
        let typeA = directiveOrder.indexOf(a.type) === -1 ? 'catch-all' : a.type
        let typeB = directiveOrder.indexOf(b.type) === -1 ? 'catch-all' : b.type

        return directiveOrder.indexOf(typeA) - directiveOrder.indexOf(typeB)
    })
}

function parseHtmlAttribute({ name, value }) {
    const normalizedName = replaceAtAndColonWithStandardSyntax(name)

    const typeMatch = normalizedName.match(xAttrRE)
    const valueMatch = normalizedName.match(/:([a-zA-Z0-9\-:]+)/)
    const modifiers = normalizedName.match(/\.[^.\]]+(?=[^\]]*$)/g) || []

    return {
        type: typeMatch ? typeMatch[1] : null,
        value: valueMatch ? valueMatch[1] : null,
        modifiers: modifiers.map(i => i.replace('.', '')),
        expression: value,
    }
}

function replaceAtAndColonWithStandardSyntax(name) {
    if (name.startsWith('@')) {
        return name.replace('@', 'x-on:')
    } else if (name.startsWith(':')) {
        return name.replace(':', 'x-bind:')
    }

    return name
}
