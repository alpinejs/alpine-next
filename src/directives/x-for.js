import Alpine from '../alpine'
import { reactive } from '../reactivity'
import { addScopeToNode } from '../scope'
import { closestDataStack } from '../utils/closest'
import { directivesByType } from '../utils/directives'
import { evaluator, evaluatorSync } from '../utils/evaluate'

Alpine.directive('for', (el, value, modifiers, expression, effect) => {
    let iteratorNames = parseForExpression(expression)

    let evaluateItems = evaluator(el, iteratorNames.items)
    let evaluateKey = evaluatorSync(el,
        // Look for a :key="..." expression
        directivesByType(el, 'bind').filter(attribute => attribute.value === 'key')[0]?.expression
        // Otherwise, use "index"
        || 'index'
    )

    effect(() => {
        loop(el, iteratorNames, evaluateItems, evaluateKey)
    })
})

function loop(el, iteratorNames, evaluateItems, evaluateKey) {
    let templateEl = el

    evaluateItems()(items => {
        // This adds support for the `i in n` syntax.
        if (isNumeric(items) && items > 0) {
            items = Array.from(Array(items).keys(), i => i + 1)
        }

        let oldThings = templateEl._x_old_things || []

        let things = items.map((item, index) => {
            let scope = getIterationScopeVariables(iteratorNames, item, index, items)

            let key = evaluateKey({ index, ...scope })

            let element = oldThings.find(i => i.key === key)?.element

            if (element) {
                // Refresh the scope in case it was overwritten rather than mutated.
                let existingScope = Array.from(element._x_dataStack).slice(-1)[0]

                Object.entries(scope).forEach(([key, value]) => {
                    existingScope[key] = value
                })
            } else {
                let clone = document.importNode(templateEl.content, true).firstElementChild

                addScopeToNode(clone, reactive(scope), templateEl)

                element = clone
            }

            return { key, scope, element, remove() { element.remove() } }
        })

        let unusedThings = oldThings.filter(i => ! things.map(i => i.key).includes(i.key))

        unusedThings.forEach(thing => thing.remove())

        templateEl._x_old_things = things

        // We have to defer the adding of these nodes, otherwise, they will get
        // picked up by the DOM-walker on initial loading of Alpine and get
        // inited twice.
        queueMicrotask(() => {
            templateEl.after(...things.map(i => i.element))
        })
    })
}

function _loop(el, iteratorNames, evaluateItems, evaluateKey) {
    let templateEl = el

    evaluateItems()(items => {
        let closestParentContext = closestDataStack(el)

        // As we walk the array, we'll also walk the DOM (updating/creating as we go).
        let currentEl = templateEl
        items.forEach((item, index) => {
            let iterationScopeVariables = getIterationScopeVariables(iteratorNames, item, index, items)

            let currentKey = evaluateKey({ index, ...iterationScopeVariables })

            let nextEl = lookAheadForMatchingKeyedElementAndMoveItIfFound(currentEl.nextElementSibling, currentKey)

            // If we haven't found a matching key, insert the element at the current position.
            if (! nextEl) {
                nextEl = addElementInLoopAfterCurrentEl(templateEl, currentEl)

                addScopeToNode(nextEl, reactive(iterationScopeVariables))

                nextEl._x_for = iterationScopeVariables
            }

            // Refresh scope
            console.log('refreshed')
            Object.entries(iterationScopeVariables).forEach(([key, value]) => {
                Array.from(nextEl._x_dataStack).slice(-1)[0][key] = value
            })

            currentEl = nextEl
            currentEl._x_for_key = currentKey
        })

        removeAnyLeftOverElementsFromPreviousUpdate(currentEl)
    })
}

// This was taken from VueJS 2.* core. Thanks Vue!
function parseForExpression(expression) {
    let forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/
    let stripParensRE = /^\(|\)$/g
    let forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/
    let inMatch = expression.match(forAliasRE)
    if (! inMatch) return
    let res = {}
    res.items = inMatch[2].trim()
    let item = inMatch[1].trim().replace(stripParensRE, '')
    let iteratorMatch = item.match(forIteratorRE)

    if (iteratorMatch) {
        res.item = item.replace(forIteratorRE, '').trim()
        res.index = iteratorMatch[1].trim()

        if (iteratorMatch[2]) {
            res.collection = iteratorMatch[2].trim()
        }
    } else {
        res.item = item
    }
    return res
}

function getIterationScopeVariables(iteratorNames, item, index, items) {
    // We must create a new object, so each iteration has a new scope
    let scopeVariables = {}

    scopeVariables[iteratorNames.item] = item

    if (iteratorNames.index) scopeVariables[iteratorNames.index] = index

    if (iteratorNames.collection) scopeVariables[iteratorNames.collection] = items

    return scopeVariables
}

function isNumeric(subject){
    return ! Array.isArray(subject) && ! isNaN(subject)
}
