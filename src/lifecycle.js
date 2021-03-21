import { applyDirective, directives } from "./directives"
import { dispatch } from './utils/dispatch'
import { nextTick } from './nextTick'
import { walk } from "./utils/walk"
import { root } from './utils/root'
import { warn } from './utils/warn'

export function start() {
    if (! document.body) warn('Unable to initialize. Trying to load Alpine before `<body>` is available. Did you forget to add `defer` in Alpine\'s `<script>` tag?')

    dispatch(document, 'alpine:initializing')

    listenForAndReactToDomManipulations(document.body)

    let outNestedComponents = el => ! root(el.parentNode || root(el))

    Array.from(document.querySelectorAll(selectors.join(', ')))
        .filter(outNestedComponents)
        .forEach(el => initTree(el))

    dispatch(document, 'alpine:initialized')
}

let selectors = ['[x-data]', '[x-data\\.append]']

function initTree(el) {
    walk(el, (el, skip) => {
        directives(el).forEach(directive => {
            if (el.__x_ignore || el.__x_ignore_self) return

            applyDirective(el, directive)
        })

        if (el.__x_ignore) skip()
    })
}

let onDestroys = new WeakMap

export function onDestroy(el, callback) {
    if (! onDestroys.get(el)) onDestroys.set(el, [])

    onDestroys.get(el).push(callback)
}

function destroyTree(root) {
    walk(root, el => {
        let callbacks = onDestroys.get(el)

        callbacks && callbacks.forEach(callback => callback())
    })
}

function listenForAndReactToDomManipulations(el) {
    let observer = new MutationObserver(mutations => {
        let addeds = mutations.flatMap(i => Array.from(i.addedNodes))
        let removeds = mutations.flatMap(i => Array.from(i.removedNodes))

        let runIfNotIn = (item, items, callback) => items.includes(item) || callback()

        for (let node of addeds) {
            if (node.nodeType !== 1) continue

            // If an element gets moved on a page, it's registered
            // as both an "add" and "remove", so we wan't to skip those.
            if (removeds.includes(node)) continue

            if (node._x_ignoreMutationObserver) continue

            initTree(node)
        }

        for (let node of removeds) {
            if (node.nodeType !== 1) continue

            // If an element gets moved on a page, it's registered
            // as both an "add" and "remove", so we wan't to skip those.
            if (addeds.includes(node)) continue

            if (node._x_ignoreMutationObserver) continue

            // Don't block execution for destroy callbacks.
            nextTick(() => destroyTree(node))
        }
    })

    observer.observe(el, { subtree: true, childList: true, deep: false })
}

// copyTree(originalEl, newEl) {
//     newEl._x_data = originalEl._x_data
//     newEl._x_$data = this.reactive(originalEl._x_data)
//     newEl._x_dataStack = originalEl._x_dataStack
//     newEl._x_dataStack = new Set(closestDataStack(originalEl))
//     newEl._x_dataStack.add(newEl._x_$data)

//     let root = true

//     this.walk(newEl, (el, skipSubTree) => {
//         if (! root && !! directiveByTypes(el, 'data')[0]) return skipSubTree()

//         root = false

//         this.init(el, false)
//     })

//     // @todo: why is this here, why does this break Livewire reactivity?
//     // this.skipEffects = true
//     this.scheduler.flushImmediately()
//     // delete this.skipEffects
// }
