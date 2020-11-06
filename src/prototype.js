import { getAttrs } from './attrs'
import { bind } from './directives/x-bind'
import { on } from './directives/x-on'

window.Element.prototype.__x__on = on
window.Element.prototype.__x__bind = bind
window.Element.prototype.__x__getAttrs = getAttrs

window.Element.prototype.__x__init = function () {
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

window.Element.prototype.__x__dispatch = function (event, detail = {}) {
    this.dispatchEvent(new CustomEvent(event, {
        detail,
        bubbles: true,
    }))
}

window.Element.prototype.__x__initChunk = function () {
    walk(this, el => el.__x__init())
}

window.Element.prototype.__x__addClasses = function (classString) {
    let split = classString => classString.split(' ').filter(Boolean)

    let missingClasses = classString => classString.split(' ').filter(i => ! this.classList.contains(i)).filter(Boolean)

    let addClassesAndReturnUndo = classes => {
        this.classList.add(...classes)

        return () => { this.classList.remove(...classes) }
    }

    return addClassesAndReturnUndo(missingClasses(classString))
}

let mergeProxies = (...objects) => {
    return new Proxy({}, {
        get: (target, name) => {
            return (objects.find(object => Object.keys(object).includes(name)) || {})[name];
        },

        set: (target, name, value) => {
            (objects.find(object => Object.keys(object).includes(name)) || {})[name] = value;

            return true
        },
    })
}

window.Element.prototype.__x__getEvaluator = function (expression, extras = {}, returns = true) {
    let farExtras = Alpine.getElementMagics(this)
    let dataStack = this.__x__closestDataStack()
    let closeExtras = extras
    let reversedDataStack = [farExtras].concat(Array.from(dataStack).concat([closeExtras])).reverse()

    if (typeof expression === 'function') {
        let mergedObject = mergeProxies(...reversedDataStack)
        return expression.bind(mergedObject)
    }

    let names = reversedDataStack.map((data, index) => `$data${index}`)

    let namesWithPlaceholder = ['$dataPlaceholder'].concat(names)

    let assignmentPrefix = returns ? '__x__result = ' : ''

    let withExpression = namesWithPlaceholder.reduce((carry, current) => { return `with (${current}) { ${carry} }` }, `${assignmentPrefix}${expression}`)

    let namesWithPlaceholderAndDefault = names.concat(['$dataPlaceholder = {}'])

    let evaluator = () => {}

    evaluator = tryCatch(this, () => {
        return new Function(namesWithPlaceholderAndDefault, `var __x__result; ${withExpression}; return __x__result;`)
    })

    let boundEvaluator = evaluator.bind(null, ...reversedDataStack)

    return tryCatch.bind(null, this, boundEvaluator)
}

function tryCatch(el, callback, ...args) {
    try {
        return callback(...args)
    } catch (e) {
        console.warn('Alpine Expression Error: '+e.message, el)

        throw e
    }
}

window.Element.prototype.__x__evaluate = function (expression, extras = {}, returns = true) {
    return this.__x__getEvaluator(expression, extras, returns)()
}

window.Element.prototype.__x__closestDataStack = function () {
    if (this.__x__dataStack) return this.__x__dataStack

    if (! this.parentElement) return new Set

    return this.parentElement.__x__closestDataStack()
}

window.Element.prototype.__x__closestRoot = function () {
    if (this.hasAttribute('x-data')) return this

    return this.parentElement.__x__closestRoot()
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
