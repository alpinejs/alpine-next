import scheduler from './scheduler.js'
import { readonly, reactive, effect, markRaw, toRaw, pauseTracking, enableTracking, resetTracking } from '@vue/reactivity'
import { directiveByType, directives } from './utils/directives'
import { root } from './utils/root.js'
import { closestDataStack } from './utils/closest.js'

let Alpine = {
    reactive,
    syncEffect: effect,

    markRaw,
    toRaw,

    interceptors: [],

    scheduler,

    get effect() {
        if (this.skipEffects) return () => {}

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

    get effectSync() {
        if (this.skipEffects) return () => {}

        return callback => {
            return effect(() => {
                callback()
            })
        }
    },

    directives: {},

    magics: {},

    components: {},

    stores: {},

    directive(name, callback) {
        this.directives[name] = callback
    },

    magic(name, callback) {
        this.magics[name] = callback
    },

    component(name, callback) {
        this.components[name] = callback
    },

    intercept(callback) {
        this.interceptors.push(callback)
    },

    store(name, object) {
        this.stores[name] = this.reactive(object)
    },

    getStore(name) {
        return this.stores[name]
    },

    injectMagics(obj, el) {
        Object.entries(this.magics).forEach(([name, callback]) => {
            Object.defineProperty(obj, `$${name}`, {
                get() { return callback(el) },
                enumerable: true,
            })
        })
    },

    start() {
        document.dispatchEvent(new CustomEvent('alpine:initializing'), { bubbles: true })

        this.listenForAndReactToDomManipulations(document.querySelector('body'))

        let outNestedComponents = el => ! root(el.parentNode || root(el))

        Array.from(document.querySelectorAll('[x-data], [x-data\\.append]'))
            .filter(outNestedComponents)
            .forEach(el => this.initTree(el))

        document.dispatchEvent(new CustomEvent('alpine:initialized'), { bubbles: true })
    },

    copyTree(originalEl, newEl) {
        newEl._x_data = originalEl._x_data
        newEl._x_$data = this.reactive(originalEl._x_data)
        newEl._x_dataStack = originalEl._x_dataStack
        newEl._x_dataStack = new Set(closestDataStack(originalEl))
        newEl._x_dataStack.add(newEl._x_$data)

        let root = true

        this.walk(newEl, (el, skipSubTree) => {
            if (! root && !! directiveByType(el, 'data')) return skipSubTree()

            root = false

            this.init(el, false, (attr, handler) => handler.initOnly)
        })

        // @todo: why is this here, why does this break Livewire reactivity?
        // this.skipEffects = true
        this.scheduler.flushImmediately()
        // delete this.skipEffects
    },

    initTree(root) {
        if (root instanceof ShadowRoot) {
            Array.from(root.children).forEach(child => this.walk(child, el => this.init(el)))
        } else {
            this.walk(root, el => this.init(el))
        }

        this.scheduler.flush()
    },

    init(el, attributes, exceptAttribute = () => false) {
        (attributes || directives(el)).forEach(attr => {
            let noop = () => {}
            let handler = Alpine.directives[attr.type] || noop

            if (exceptAttribute(attr, handler)) return

            // Run "x-ref/data/spread" on the initial sweep.
            let task = handler.immediate
                ? callback => callback()
                : this.scheduler.task.bind(this.scheduler)

            task(() => {
                handler(el, attr.value, attr.modifiers, attr.expression, Alpine.effect)
            })
        })
    },

    destroyCallbacks: new WeakMap,

    addDestroyCallback(el, callback) {
        if (! this.destroyCallbacks.get(el)) {
            this.destroyCallbacks.set(el, [])
        }

        this.destroyCallbacks.get(el).push(callback)
    },

    destroyTree(root) {
        this.walk(root, el => this.destroy(el))

        this.scheduler.flush()
    },

    destroy(el) {
        let callbacks = this.destroyCallbacks.get(el)

        callbacks && callbacks.forEach(callback => callback())
    },

    listenForAndReactToDomManipulations(rootElement) {
        let observer = new MutationObserver(mutations => {
            for(let mutation of mutations) {
                if (mutation.type !== 'childList') continue

                for(let node of mutation.addedNodes) {
                    if (node.nodeType !== 1) continue

                    this.initTree(node)
                }

                for(let node of mutation.removedNodes) {
                    if (node.nodeType !== 1) continue

                    // Don't block execution for destroy callbacks.
                    scheduler.nextTick(() => {
                        this.destroyTree(node)
                    })
                }
            }
        })

        observer.observe(rootElement, { subtree: true, childList: true, deep: false })
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
