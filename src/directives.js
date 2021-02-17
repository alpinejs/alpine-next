import { effect } from "./reactivity"

let directiveHandlers = {}

export function directive(name, callback) {
    directiveHandlers[name] = callback
}

export function applyDirective(el, directive) {
    let noop = () => {}

    let handler = directiveHandlers[directive.type] || noop

    handler(el, directive)
}

export function directives(el, alternativeAttributes) {
    mapAttributes(startingWith('@', into('x-on:')))
    mapAttributes(startingWith(':', into('x-bind:')))

    return Array.from(alternativeAttributes || el.attributes)
        .map(intoTransformedAttributes)
        .filter(outNonAlpineAttributes)
        .map(intoParsedDirectives)
        .sort(byPriority)
}

let startingWith = (subject, replacement) => ({ name, value }) => {
    if (name.startsWith(subject)) name = name.replace(subject, replacement)

    return { name, value }
}

let into = i => i

function intoTransformedAttributes({ name, value }) {
    return attributeTransformers.reduce((carry, transform) => {
        return transform(carry)
    }, { name, value })
}

let attributeTransformers = []

export function mapAttributes(callback) {
    attributeTransformers.push(callback)
}

function outNonAlpineAttributes({ name }) {
    return alpineAttributeRegex.test(name)
}

let alpineAttributeRegex = /^x-([^:^.]+)\b/

function intoParsedDirectives({ name, value }) {
    let typeMatch = name.match(alpineAttributeRegex)
    let valueMatch = name.match(/:([a-zA-Z0-9\-:]+)/)
    let modifiers = name.match(/\.[^.\]]+(?=[^\]]*$)/g) || []

    return {
        type: typeMatch ? typeMatch[1] : null,
        value: valueMatch ? valueMatch[1] : null,
        modifiers: modifiers.map(i => i.replace('.', '')),
        expression: value,
    }
}

let directiveOrder = ['data', 'bind', 'ref', 'init', 'for', 'model', 'transition', 'show', 'if', 'catch-all', 'element']

function byPriority(a, b) {
    let typeA = directiveOrder.indexOf(a.type) === -1 ? 'catch-all' : a.type
    let typeB = directiveOrder.indexOf(b.type) === -1 ? 'catch-all' : b.type

    return directiveOrder.indexOf(typeA) - directiveOrder.indexOf(typeB)
}
