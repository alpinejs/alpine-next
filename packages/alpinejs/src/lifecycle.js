import { deferHandlingDirectives, directives } from "./directives"
import { dispatch } from './utils/dispatch'
import { nextTick } from './nextTick'
import { walk } from "./utils/walk"
import { warn } from './utils/warn'

export function start() {
    if (! document.body) warn('Unable to initialize. Trying to load Alpine before `<body>` is available. Did you forget to add `defer` in Alpine\'s `<script>` tag?')

    dispatch(document, 'alpine:initializing')

    listenForAndReactToDomManipulations(document.body)

    let outNestedComponents = el => ! closestRoot(el.parentNode || closestRoot(el))

    Array.from(document.querySelectorAll(rootSelectors().join(', ')))
        .filter(outNestedComponents)
        .forEach(el => initTree(el))

    dispatch(document, 'alpine:initialized')
}

let rootSelectorCallbacks = []

export function rootSelectors() {
    return rootSelectorCallbacks.map(fn => fn())
}

export function addRootSelector(selectorCallback) { rootSelectorCallbacks.push(selectorCallback) }

export function closestRoot(el) {
    if (rootSelectors().some(selector => el.matches(selector))) return el

    if (! el.parentElement) return

    return closestRoot(el.parentElement)
}

export function initTree(el) {
    deferHandlingDirectives(handleDirective => {
        walk(el, (el, skip) => {
            directives(el).forEach(directive => {
                if (el._x_ignore || el._x_ignore_self) return

                handleDirective(el, directive)
            })

            if (el._x_ignore) skip()
        })
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
