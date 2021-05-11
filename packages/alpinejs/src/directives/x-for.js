import { evaluateLater } from '../evaluator'
import { directive } from '.'
import { addScopeToNode } from '../scope'
import { reactive } from '../reactivity'

directive('for', (el, { expression }, { effect, cleanup }) => {
    let iteratorNames = parseForExpression(expression)

    let evaluateItems = evaluateLater(el, iteratorNames.items)
    let evaluateKey = evaluateLater(el,
        // the x-bind:key expression is stored for our use instead of evaluated.
        el._x_key_expression || 'index'
    )

    effect(() => loop(el, iteratorNames, evaluateItems, evaluateKey))

    cleanup(() => el._x_old_iterations && el._x_old_iterations.forEach(i => i.remove()))
})

function loop(el, iteratorNames, evaluateItems, evaluateKey) {
    let templateEl = el

    evaluateItems(items => {
        // This adds support for the `i in n` syntax.
        if (isNumeric(items) && items >= 0) {
            items = Array.from(Array(items).keys(), i => i + 1)
        }

        let oldIterations = templateEl._x_old_iterations || []

        let getIteration = (item, index) => {
            let scope = getIterationScopeVariables(iteratorNames, item, index, items)

            let key

            evaluateKey(value => key = value, { scope: { index, ...scope }})

            let element = oldIterations.find(i => i.key === key)?.element

            if (element) {
                // Refresh the scope in case it was overwritten rather than mutated.
                let existingScope = element._x_dataStack[0]

                Object.entries(scope).forEach(([key, value]) => {
                    existingScope[key] = value
                })
            } else {
                let clone = document.importNode(templateEl.content, true).firstElementChild

                addScopeToNode(clone, reactive(scope), templateEl)

                element = clone
            }

            return { key, scope, element, remove() { element.remove() } }
        }

        let isObject = i => typeof i === 'object' && ! Array.isArray(i)

        let iterations = isObject(items)
            ? Object.entries(items).map(([key, value]) => getIteration(value, key))
            : Array.from(items).map(getIteration)

        let unusedIterations = oldIterations.filter(i => ! iterations.map(i => i.key).includes(i.key))

        unusedIterations.forEach(iteration => iteration.remove())

        templateEl._x_old_iterations = iterations

        // We have to defer the adding of these nodes, otherwise, they will get
        // picked up by the DOM-walker on initial loading of Alpine and get
        // inited twice.
        queueMicrotask(() => {
            templateEl.after(...iterations.map(i => i.element))
        })
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

    // Support array destructuring ([foo, bar]).
    if (/^\[.*\]$/.test(iteratorNames.item) && Array.isArray(item)) {
        let names = iteratorNames.item.replace('[', '').replace(']', '').split(',').map(i => i.trim())

        names.forEach((name, i) => {
            scopeVariables[name] = item[i]
        })
    } else {
        scopeVariables[iteratorNames.item] = item
    }

    if (iteratorNames.index) scopeVariables[iteratorNames.index] = index

    if (iteratorNames.collection) scopeVariables[iteratorNames.collection] = items

    return scopeVariables
}

function isNumeric(subject){
    return ! Array.isArray(subject) && ! isNaN(subject)
}
