import scheduler from './scheduler.js'
import { reactive, effect, markRaw, toRaw } from './reactivity'
import { directives } from './utils/directives'
import { warn } from './utils/warn'
import { root } from './utils/root.js'

let Alpine = {
    reactive,
    syncEffect: effect,

    markRaw,
    toRaw,

    scheduler,

    get effect() {
        if (this.skipEffects) return () => {}

        return callback => {
            return effect(() => {
                callback()
            // }, {
            //     scheduler(run) {
            //         scheduler.task(run)
            //     }
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


    directive(name, callback) {
        this.directives[name] = callback
    },

    magic(name, callback) {
        this.magics[name] = callback
    },

    component(name, callback) {
        this.components[name] = callback
    },

    stores: {},

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

        if (! document.body) {
            warn('Unable to initialize. Trying to load Alpine before `<body>` is available. Did you forget to add `defer` in Alpine\'s `<script>` tag?')
        }

        this.listenForAndReactToDomManipulations(document.body)

        let outNestedComponents = el => ! root(el.parentNode || root(el))

        Array.from(document.querySelectorAll('[x-data], [x-data\\.append]'))
            .filter(outNestedComponents)
            .forEach(el => this.initTree(el))

        document.dispatchEvent(new CustomEvent('alpine:initialized'), { bubbles: true })
    },

    // copyTree(originalEl, newEl) {
    //     newEl._x_data = originalEl._x_data
    //     newEl._x_$data = this.reactive(originalEl._x_data)
    //     newEl._x_dataStack = originalEl._x_dataStack
    //     newEl._x_dataStack = new Set(closestDataStack(originalEl))
    //     newEl._x_dataStack.add(newEl._x_$data)

    //     let root = true

    //     this.walk(newEl, (el, skipSubTree) => {
    //         if (! root && !! directiveByType(el, 'data')) return skipSubTree()

    //         root = false

    //         this.init(el, false)
    //     })

    //     // @todo: why is this here, why does this break Livewire reactivity?
    //     // this.skipEffects = true
    //     this.scheduler.flushImmediately()
    //     // delete this.skipEffects
    // },

    initTree(root) {
        if (root instanceof ShadowRoot) {
            Array.from(root.children).forEach(child => this.walk(child, el => this.init(el)))
        } else {
            this.walk(root, el => this.init(el))
        }

        this.scheduler.flush()
    },

    init(el, attributes) {
        (attributes || directives(el)).forEach(attr => {
            let noop = () => {}
            let handler = Alpine.directives[attr.type] || noop

            // Run "x-ref/data/spread" on the initial sweep.
            // let task = handler.immediate
            //     ? callback => callback()
            //     : this.scheduler.task.bind(this.scheduler)
            let task = callback => callback()

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
            let addeds = mutations.flatMap(i => Array.from(i.addedNodes))
            let removeds = mutations.flatMap(i => Array.from(i.removedNodes))

            for (let node of addeds) {
                if (node.nodeType !== 1) continue

                // If an element gets moved on a page, it's registered
                // as both an "add" and "remove", so we wan't to skip those.
                if (removeds.includes(node)) continue

                if (node._x_ignoreMutationObserver) continue

                this.initTree(node)
            }

            for (let node of removeds) {
                if (node.nodeType !== 1) continue

                // If an element gets moved on a page, it's registered
                // as both an "add" and "remove", so we wan't to skip those.
                if (addeds.includes(node)) continue

                if (node._x_ignoreMutationObserver) continue

                // Don't block execution for destroy callbacks.
                scheduler.nextTick(() => {
                    this.destroyTree(node)
                })
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
