import core from './core.js'
import { reactive, effect } from '@vue/reactivity'
window.reactive = reactive
window.effect = effect

let Alpine = {
    observe: reactive,

    effect: effect,

    directives: {},

    magics: {},

    components: {},

    directive(name, callback) {
        this.directives[name] = callback
    },

    magic(name, callback) {
        this.magics[name] = callback
    },

    component(name, callback) {
        this.components[name] = callback
    },

    injectMagics(obj, el) {
        Object.entries(this.magics).forEach(([name, callback]) => {
            Object.defineProperty(obj, `$${name}`, {
                get() { return callback(el) },
                enumerable: true,
            })
        })
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
        document.dispatchEvent(new CustomEvent('alpine:initializing'), { bubbles: true })

        this.listenForNewDomElementsToInitialize()

        let outNestedComponents = el => ! (el.parentElement || {_x_root() {}})._x_root()

        Array.from(document.querySelectorAll('[x-data]'))
            .filter(outNestedComponents)
            .forEach(el => this.initTree(el))

        document.dispatchEvent(new CustomEvent('alpine:initialized'), { bubbles: true })
    },

    initTree(root) {
        this.walk(root, el => this.init(el))

        core.runThrough()
    },

    init(el, attributes) {
        (attributes || el._x_attributes()).forEach(attr => {
            let noop = () => {}
            let run = Alpine.directives[attr.type] || noop

            // Run "x-ref/data/spread" on the initial sweep.
            let defer = run.runImmediately
                ? callback => callback()
                : core.defer.bind(core)

            defer(() => {
                run(el, attr.value, attr.modifiers, attr.expression, Alpine.effect)
            })
        })
    },

    listenForNewDomElementsToInitialize() {
        let observer = new MutationObserver(mutations => {
            console.log(mutations)
            for(let mutation of mutations) {
                if (mutation.type !== 'childList') continue

                for(let node of mutation.addedNodes) {
                    if (node.nodeType !== 1) continue

                    this.initTree(node)
                }
            }
        })

        observer.observe(document.querySelector('body'), { subtree: true, childList: true, deep: false })
    },

    walk(el, callback, forceFirst = true) {
        // if (! forceFirst && el.__x_for) return

        callback(el)

        let node = el.firstElementChild

        while (node) {
            this.walk(node, callback, false)

            node = node.nextElementSibling
        }
    },
}

export default Alpine
