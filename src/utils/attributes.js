
window.Element.prototype._x_attributes = function(attributes) {
    let directives = Array.from(attributes || this.attributes).filter(isXAttr).map(parseHtmlAttribute)

    return sortDirectives(directives)
}

window.Element.prototype._x_attributesByType = function(type) {
    return this._x_attributes().filter(attribute => attribute.type === type)
}

window.Element.prototype._x_attributeByType = function(type) {
    return this._x_attributesByType(type)[0]
}

let xAttrRE = /^x-([^:^.]+)\b/

function isXAttr(attr) {
    const name = replaceAtAndColonWithStandardSyntax(attr.name)

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
