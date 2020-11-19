import Alpine from '../alpine'

Alpine.directive('for', (el, value, modifiers, expression, effect) => {
    let iteratorNames = parseForExpression(expression)

    let evaluateItems = el._x_evaluator(iteratorNames.items)
    let evaluateKey = el._x_evaluator(
        // Look for a :key="..." expression
        el._x_attributesByType('bind').filter(attribute => attribute.value === 'key')[0]?.expression
        // Otherwise, use "index"
        || 'index'
    )

    effect(() => {
        loop(el, iteratorNames, evaluateItems, evaluateKey)
    })
})

function loop(el, iteratorNames, evaluateItems, evaluateKey) {
    let templateEl = el

    let items = evaluateItems()

    // This adds support for the `i in n` syntax.
    if (isNumeric(items) && items > 0) {
        items = Array.from(Array(items).keys(), i => i + 1)
    }

    let closestParentContext = el._x_closestDataStack()

    // As we walk the array, we'll also walk the DOM (updating/creating as we go).
    let currentEl = templateEl
    items.forEach((item, index) => {
        let iterationScopeVariables = getIterationScopeVariables(iteratorNames, item, index, items)
        let currentKey = evaluateKey({ index, ...iterationScopeVariables })
        let nextEl = lookAheadForMatchingKeyedElementAndMoveItIfFound(currentEl.nextElementSibling, currentKey)

        // If we haven't found a matching key, insert the element at the current position.
        if (! nextEl) {
            nextEl = addElementInLoopAfterCurrentEl(templateEl, currentEl)

            let newSet = new Set(closestParentContext)
            newSet.add(Alpine.observe(iterationScopeVariables))
            nextEl._x_dataStack = newSet
            nextEl._x_for = iterationScopeVariables
            Alpine.initTree(nextEl)
        } {
            // Refresh data
            Object.entries(iterationScopeVariables).forEach(([key, value]) => {
                Array.from(nextEl._x_dataStack).slice(-1)[0][key] = value
            })
        }

        currentEl = nextEl
        currentEl._x_for_key = currentKey
    })

    removeAnyLeftOverElementsFromPreviousUpdate(currentEl)
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

function addElementInLoopAfterCurrentEl(templateEl, currentEl) {
    let clone = document.importNode(templateEl.content, true)


    currentEl.parentElement.insertBefore(clone, currentEl.nextElementSibling)

    let inserted = currentEl.nextElementSibling

    inserted._x_skip_mutation_observer = true

    return inserted
}

function lookAheadForMatchingKeyedElementAndMoveItIfFound(nextEl, currentKey) {
    if (! nextEl) return

    // If the the key's DO match, no need to look ahead.
    if (nextEl._x_for_key === currentKey) return nextEl

    // If they don't, we'll look ahead for a match.
    // If we find it, we'll move it to the current position in the loop.
    let tmpNextEl = nextEl

    while(tmpNextEl) {
        if (tmpNextEl._x_for_key === currentKey) {
            return tmpNextEl.parentElement.insertBefore(tmpNextEl, nextEl)
        }

        tmpNextEl = (tmpNextEl.nextElementSibling && tmpNextEl.nextElementSibling._x_for_key !== undefined) ? tmpNextEl.nextElementSibling : false
    }
}

function removeAnyLeftOverElementsFromPreviousUpdate(currentEl) {
    var nextElementFromOldLoop = (currentEl.nextElementSibling && currentEl.nextElementSibling._x_for_key !== undefined) ? currentEl.nextElementSibling : false

    while (nextElementFromOldLoop) {
        let nextElementFromOldLoopImmutable = nextElementFromOldLoop
        let nextSibling = nextElementFromOldLoop.nextElementSibling

        nextElementFromOldLoopImmutable.remove()

        nextElementFromOldLoop = (nextSibling && nextSibling._x_for_key !== undefined) ? nextSibling : false
    }
}

function isNumeric(subject){
    return ! Array.isArray(subject) && ! isNaN(subject)
}
