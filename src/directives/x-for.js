import hyperactiv from 'hyperactiv'

export default (el, value, modifiers, expression, reactive) => {
    let iteratorNames = parseForExpression(expression)

    let evaluateItems = el.__x__getEvaluator(iteratorNames.items)

    reactive(() => {
        loop(el, iteratorNames, evaluateItems)
    })
}

function loop(el, iteratorNames, evaluateItems) {
    let templateEl = el

    let items = evaluateItems()

    let closestParentContext = el.__x__closestDataStack()

    // As we walk the array, we'll also walk the DOM (updating/creating as we go).
    let currentEl = templateEl
    items.forEach((item, index) => {
        let iterationScopeVariables = getIterationScopeVariables(iteratorNames, item, index, items)

        let currentKey = index
        let nextEl = lookAheadForMatchingKeyedElementAndMoveItIfFound(currentEl.nextElementSibling, currentKey)

        // If we haven't found a matching key, insert the element at the current position.
        if (! nextEl) {
            nextEl = addElementInLoopAfterCurrentEl(templateEl, currentEl)

            let newSet = new Set(closestParentContext)
            newSet.add(hyperactiv.observe(iterationScopeVariables))
            nextEl.__x__dataStack = newSet
            nextEl.__x_for = iterationScopeVariables
            nextEl.__x__initChunk()
        } {
            // Refresh data
            Object.entries(iterationScopeVariables).forEach(([key, value]) => {
                Array.from(nextEl.__x__dataStack).slice(-1)[0][key] = value
            })
        }

        currentEl = nextEl
        currentEl.__x_for_key = currentKey
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
    let clone = document.importNode(templateEl.content, true  )

    currentEl.parentElement.insertBefore(clone, currentEl.nextElementSibling)

    return currentEl.nextElementSibling
}

function lookAheadForMatchingKeyedElementAndMoveItIfFound(nextEl, currentKey) {
    if (! nextEl) return

    // If the the key's DO match, no need to look ahead.
    if (nextEl.__x_for_key === currentKey) return nextEl

    // If they don't, we'll look ahead for a match.
    // If we find it, we'll move it to the current position in the loop.
    let tmpNextEl = nextEl

    while(tmpNextEl) {
        if (tmpNextEl.__x_for_key === currentKey) {
            return tmpNextEl.parentElement.insertBefore(tmpNextEl, nextEl)
        }

        tmpNextEl = (tmpNextEl.nextElementSibling && tmpNextEl.nextElementSibling.__x_for_key !== undefined) ? tmpNextEl.nextElementSibling : false
    }
}

function removeAnyLeftOverElementsFromPreviousUpdate(currentEl) {
    var nextElementFromOldLoop = (currentEl.nextElementSibling && currentEl.nextElementSibling.__x_for_key !== undefined) ? currentEl.nextElementSibling : false

    while (nextElementFromOldLoop) {
        let nextElementFromOldLoopImmutable = nextElementFromOldLoop
        let nextSibling = nextElementFromOldLoop.nextElementSibling

        nextElementFromOldLoopImmutable.remove()

        nextElementFromOldLoop = (nextSibling && nextSibling.__x_for_key !== undefined) ? nextSibling : false
    }
}

function isNumeric(subject){
    return ! Array.isArray(subject) && ! isNaN(subject)
}
