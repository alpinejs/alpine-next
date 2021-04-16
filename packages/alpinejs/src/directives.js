
let prefixAsString = 'x-'

export function prefix(subject = '') {
    return prefixAsString + subject
}

export function setPrefix(newPrefix) {
    prefixAsString = newPrefix
}

let directiveHandlers = {}

export function directive(name, callback) {
    directiveHandlers[name] = callback
}

export function getDirectiveHandler(directive) {
    let noop = () => {}

    return directiveHandlers[directive.type] || noop
}

export function handleDirective(el, directive, domSideEffectsOnly) {
    let handler = getDirectiveHandler(directive)

    handler.inline && handler.inline(el, directive)

    handler(el, directive)
}

export function directives(el, alternativeAttributes, domEffectsOnly) {
    return Array.from(alternativeAttributes || el.attributes)
        .map(toTransformedAttributes)
        .filter(outNonAlpineAttributes)
        .map(toParsedDirectives)
        .sort(byPriority)
}

export let startingWith = (subject, replacement) => ({ name, value }) => {
    if (name.startsWith(subject)) name = name.replace(subject, replacement)

    return { name, value }
}

export let into = i => i

function toTransformedAttributes({ name, value }) {
    return attributeTransformers.reduce((carry, transform) => {
        return transform(carry)
    }, { name, value })
}

let attributeTransformers = []

export function mapAttributes(callback) {
    attributeTransformers.push(callback)
}

function outNonAlpineAttributes({ name }) {
    return alpineAttributeRegex().test(name)
}

function outNonDomEffectDirectives({ name }) {

}

let alpineAttributeRegex = () => (new RegExp(`^${prefixAsString}([^:^.]+)\\b`))

function toParsedDirectives({ name, value }) {
    let typeMatch = name.match(alpineAttributeRegex())
    let valueMatch = name.match(/:([a-zA-Z0-9\-:]+)/)
    let modifiers = name.match(/\.[^.\]]+(?=[^\]]*$)/g) || []

    return {
        type: typeMatch ? typeMatch[1] : null,
        value: valueMatch ? valueMatch[1] : null,
        modifiers: modifiers.map(i => i.replace('.', '')),
        expression: value,
    }
}

const DEFAULT = 'DEFAULT'

let directiveOrder = [
    'ignore',
    'data',
    'bind',
    'ref',
    'init',
    'for',
    'model',
    'transition',
    'show',
    'if',
    DEFAULT,
    'element',
]

function byPriority(a, b) {
    let typeA = directiveOrder.indexOf(a.type) === -1 ? DEFAULT : a.type
    let typeB = directiveOrder.indexOf(b.type) === -1 ? DEFAULT : b.type

    return directiveOrder.indexOf(typeA) - directiveOrder.indexOf(typeB)
}
