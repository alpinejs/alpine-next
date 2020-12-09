import scheduler from './scheduler.js'
import { reactive, effect } from '@vue/reactivity'
window.reactive = reactive
window.effect = effect

let Alpine = {
    observe: reactive,

    get effect() {
        return callback => {
            return effect(() => {
                callback()
            }, {
                scheduler(run) {
                    scheduler.task(run)
                }
            })
        }
    },

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

    copyTree(originalEl, newEl) {
        newEl._x_data = originalEl._x_data
        newEl._x_$data = originalEl._x_$data
        newEl._x_dataStack = originalEl._x_dataStack

        let root = true

        this.walk(newEl, (el, skipSubTree) => {
            if (! root && !! el._x_attributeByType('data')) return skipSubTree()

            root = false

            this.init(el, false, (attr, handler) => handler.initOnly)
        })

        scheduler.flushImmediately()
    },

    initTree(root) {
        this.walk(root, el => this.init(el))

        scheduler.flush()
    },

    init(el, attributes, exceptAttribute = () => false) {
        (attributes || el._x_attributes()).forEach(attr => {
            let noop = () => {}
            let handler = Alpine.directives[attr.type] || noop

            if (exceptAttribute(attr, handler)) return

            // Run "x-ref/data/spread" on the initial sweep.
            let task = handler.immediate
                ? callback => callback()
                : scheduler.task.bind(scheduler)

            task(() => {
                handler(el, attr.value, attr.modifiers, attr.expression, Alpine.effect)
            })
        })
    },

    listenForNewDomElementsToInitialize() {
        let observer = new MutationObserver(mutations => {
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

    walk(el, callback) {
        let skip = false
        callback(el, () => skip = true)
        if (skip) return

        let node = el.firstElementChild

        while (node) {
            this.walk(node, callback, false)

            node = node.nextElementSibling
        }
    },
}

export default Alpine
