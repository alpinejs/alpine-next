import { deferHandlingDirectives, directives } from "./directives"
import { dispatch } from './utils/dispatch'
import { walk, asyncWalk } from "./utils/walk"
import { warn } from './utils/warn'
import { startObservingMutations, onAttributesAdded, onElAdded, onElRemoved } from "./mutation"
import { nextTick } from "./nextTick"

export function start() {
    if (! document.body) warn('Unable to initialize. Trying to load Alpine before `<body>` is available. Did you forget to add `defer` in Alpine\'s `<script>` tag?')

    dispatch(document, 'alpine:initializing')

    startObservingMutations()

    onElAdded(el => initTree(el, walk))
    onElRemoved(el => nextTick(() => destroyTree(el)))

    onAttributesAdded((el, attrs) => {
        directives(el, attrs).forEach(handle => handle())
    })

    let outNestedComponents = el => ! closestRoot(el.parentNode || closestRoot(el))

    Array.from(document.querySelectorAll(rootSelectors().join(', ')))
        .filter(outNestedComponents)
        .forEach(el => {
            initTree(el)
        })

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

export function isRoot(el) {
    return rootSelectors().some(selector => el.matches(selector))
}

export function initTree(el, walker = walk) {
    deferHandlingDirectives(() => {
        walker(el, (el, next) => {
            directives(el, el.attributes).forEach(handle => handle())

            el._x_ignore || next()
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
