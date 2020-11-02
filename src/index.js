import directives from './directives'
import { getAttrs } from './attrs'
import { init } from './element'
import { bind } from './directives/x-bind'
import { on } from './directives/x-on'
import { show, hide } from './transitions'

/**
 * Extend DOM with Alpine functionality.
 */
window.Element.prototype.__x__directives = directives
window.Element.prototype.__x__getAttrs = getAttrs
window.Element.prototype.__x__init = init
window.Element.prototype.__x__bind = bind
window.Element.prototype.__x__on = on
window.Element.prototype.__x__show = show
window.Element.prototype.__x__hide = hide
window.Element.prototype.__x__initChunk = function () {
    walk(this, el => {
        el.__x__init()
    })
}

window.Element.prototype.__x__getEvaluator = function (expression) {
    let dataStack = this.__x__closestDataStack()
    let reversedDataStack = Array.from(dataStack).concat([{'$el': this}]).reverse()

    let names = reversedDataStack.map((data, index) => `$data${index}`)

    let namesWithPlaceholder = ['$dataPlaceholder'].concat(names)

    let withExpression = namesWithPlaceholder.reduce((carry, current) => { return `with (${current}) { ${carry} }` }, `__x__result = ${expression}`)

    let namesWithPlaceholderAndDefault = names.concat(['$dataPlaceholder = {}'])

    let evaluator = new Function(namesWithPlaceholderAndDefault, `var __x__result; ${withExpression}; return __x__result`)

    return evaluator.bind(null, ...reversedDataStack)
}

window.Element.prototype.__x__evaluate = function (expression, extras = {}) {
    return this.__x__getEvaluator(expression)(extras)
}

window.Element.prototype.__x__closestDataStack = function () {
    if (this.__x__dataStack) return this.__x__dataStack

    if (! this.parentElement) return new Set

    return this.parentElement.__x__closestDataStack()
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

/**
 * Define Alpine boot logic.
 */
function start() {
    document.querySelectorAll('[x-data]').forEach(el => {
        el.__x__initChunk()
    })
}

/**
 * Boot Alpine (or defer).
 */
if (window.deferLoadingAlpine) {
    window.deferLoadingAlpine(() => {
        start()
    })
} else {
    start()
}
