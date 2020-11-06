import directives from './directives'
import magics from './magics'
import hyperactiv from 'hyperactiv'
import { getAttrs } from './attrs'
import { init } from './element'
import { bind } from './directives/x-bind'
import { on } from './directives/x-on'

/**
 * Extend DOM with Alpine functionality.
 */
window.Element.prototype.__x__on = on
window.Element.prototype.__x__bind = bind
window.Element.prototype.__x__getAttrs = getAttrs
window.Element.prototype.__x__init = init
window.Element.prototype.__x__initChunk = function () {
    walk(this, el => {
        el.__x__init()
    })
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
};

window.Element.prototype.__x__getEvaluator = function (expression) {
    let farExtras = Alpine.getElementMagics(this)
    let dataStack = this.__x__closestDataStack()
    let closeExtras = {}
    let reversedDataStack = [farExtras].concat(Array.from(dataStack).concat([closeExtras])).reverse()

    if (typeof expression === 'function') {
        let mergedObject = mergeProxies(...reversedDataStack)
        return expression.bind(mergedObject)
    }

    let names = reversedDataStack.map((data, index) => `$data${index}`)

    let namesWithPlaceholder = ['$dataPlaceholder'].concat(names)

    let withExpression = namesWithPlaceholder.reduce((carry, current) => { return `with (${current}) { ${carry} }` }, `__x__result = ${expression}`)

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

window.Element.prototype.__x__evaluate = function (expression, extras = {}) {
    return this.__x__getEvaluator(expression)(extras)
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

/**
 * Define Alpine boot logic.
 */
let Alpine = {
    observe: hyperactiv.observe,

    react: hyperactiv.computed,

    directives: {},

    magics: {},

    components: {},

    directive(name, callback) {
        this.directives[name] = callback
    },

    magic(name, callback) {
        this.magics[name] = callback
    },

    getElementMagics(el) {
        let magics = {}

        Object.entries(this.magics).forEach(([name, callback]) => {
            Object.defineProperty(magics, `$${name}`, {
                get() { return callback(el) },
                enumerable: true,
            })
        })

        return magics
    },

    component(name, callback) {
        this.components[name] = callback
    },

    clonedComponentAccessor() {
        let components = {}

        Object.entries(this.components).forEach(([name, componentObject]) => {
            Object.defineProperty(components, name, {
                get() { return {...componentObject} },
                enumerable: true,
            })
        })

        return components
    },

    start() {
        Object.entries(directives).forEach(([name, callback]) => this.directive(name, callback))
        Object.entries(magics).forEach(([name, callback]) => this.magic(name, callback))

        document.querySelectorAll('[x-data]').forEach(el => {
            el.__x__initChunk()
        })

        let observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type !== 'childList') return

                Array.from(mutation.addedNodes).forEach(node => {
                    // Discard non-element nodes (like line-breaks)
                    if (node.nodeType !== 1 || node.__x__skip_mutation_observer) return

                    node.__x__initChunk()
                })
            })
        })

        observer.observe(document.querySelector('body'), { subtree: true, childList: true })
    }
}

window.Alpine = Alpine

window.dispatchEvent(new CustomEvent('alpine:loading'), {bubbles: true})

if (window.deferLoadingAlpine) {
    window.deferLoadingAlpine(() => {
        Alpine.start()
    })
} else {
    Alpine.start()
}

export default Alpine
