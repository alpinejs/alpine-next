import { evaluateLater } from '../evaluator'
import { directive } from '.'
import { addScopeToNode, refreshScope } from '../scope'
import { flushJobs, reactive } from '../reactivity'
import { initTree } from '../lifecycle'
import { dontObserveMutations } from '../mutation'

directive('for', (el, { expression }, { effect, cleanup }) => {
    let iteratorNames = parseForExpression(expression)

    let evaluateItems = evaluateLater(el, iteratorNames.items)
    let evaluateKey = evaluateLater(el,
        // the x-bind:key expression is stored for our use instead of evaluated.
        el._x_key_expression || 'index'
    )

    el._x_prev_keys = []
    el._x_lookup = {}

    effect(() => loop(el, iteratorNames, evaluateItems, evaluateKey))

    cleanup(() => {
        Object.values(el._x_lookup).forEach(el => el.remove())

        delete el._x_prev_keys
        delete el._x_lookup
    })
})

function loop(el, iteratorNames, evaluateItems, evaluateKey) {
    let templateEl = el

    evaluateItems(items => {
        // This adds support for the `i in n` syntax.
        if (isNumeric(items) && items >= 0) {
            items = Array.from(Array(items).keys(), i => i + 1)
        }

        let lookup = el._x_lookup
        let scopes = []
        let prevKeys = el._x_prev_keys
        let keys = []

        for (let i = 0; i < items.length; i++) {
            let scope = getIterationScopeVariables(iteratorNames, items[i], i, items)
            scopes.push(scope)

            evaluateKey(value => keys.push(value), { scope: { index: i, ...scope} })
        }

        let adds = []
        let moves = []
        let removes = []
        let sames = []

        for (let i = 0; i < prevKeys.length; i++) {
            let key = prevKeys[i]

            if (keys.indexOf(key) === -1) removes.push(key)
        }

        prevKeys = prevKeys.filter(key => ! removes.includes(key))

        let lastKey = 'template'
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i]

            let prevIndex = prevKeys.indexOf(key)

            // New one.
            if (prevIndex === -1) {
                prevKeys.splice(i, 0, key)

                adds.push([lastKey, i])
            } else if (prevIndex !== i) {
                // Moved one.
                let valInSpot = prevKeys.splice(i, 1)[0]
                let valForSpot = prevKeys.splice(prevIndex - 1, 1)[0]

                prevKeys.splice(i, 0, valForSpot)
                prevKeys.splice(prevIndex, 0, valInSpot)

                moves.push([valInSpot, valForSpot])
            } else {
                sames.push(key)
            }

            lastKey = key
        }

        for (let i = 0; i < removes.length; i++) {
            let key = removes[i]

            lookup[key].remove()

            delete lookup[key]
        }


        for (let i = 0; i < moves.length; i++) {
            let [valInSpot, valForSpot] = moves[i]

            let elInSpot = lookup[valInSpot]
            let elForSpot = lookup[valForSpot]

            let marker = document.createElement('div')

            dontObserveMutations(() => {
                elForSpot.after(marker)
                elInSpot.after(elForSpot)
                marker.before(elInSpot)
                marker.remove()
            })

            refreshScope(elForSpot, scopes[keys.indexOf(valForSpot)])
        }

        for (let i = 0; i < adds.length; i++) {
            let [lastKey, index] = adds[i]

            let lastEl = (lastKey === 'template') ? templateEl : lookup[lastKey]

            let scope = scopes[index]
            let key = keys[index]

            let clone = document.importNode(templateEl.content, true).firstElementChild

            addScopeToNode(clone, reactive(scope), templateEl)

            lastEl.after(clone)

            lookup[key] = clone
        }


        for (let i = 0; i < sames.length; i++) {
            refreshScope(lookup[sames[i]], scopes[keys.indexOf(sames[i])])
        }

        el._x_prev_keys = keys
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
