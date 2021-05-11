import { closestDataStack, mergeProxies } from './scope'
import { injectMagics } from './magics'

export function evaluate(el, expression, extras = {}) {
    let result

    evaluateLater(el, expression)(value => result = value, extras)

    return result
}

export function evaluateLater(...args) {
    return theEvaluatorFunction(...args)
}

let theEvaluatorFunction = normalEvaluator

export function setEvaluator(newEvaluator) {
    theEvaluatorFunction = newEvaluator
}

export function normalEvaluator(el, expression) {
    let overriddenMagics = {}

    injectMagics(overriddenMagics, el)

    let dataStack = [overriddenMagics, ...closestDataStack(el)]

    if (typeof expression === 'function') {
        return generateEvaluatorFromFunction(dataStack, expression)
    }

    let evaluator = generateEvaluatorFromString(dataStack, expression)

    return evaluator

    // @todo...
    return tryCatch.bind(null, el, expression, evaluator)
}

function generateEvaluatorFromFunction(dataStack, func) {
    return (receiver = () => {}, { scope = {}, params = [] } = {}) => {
        let result = func.apply(mergeProxies([scope, ...dataStack]), params)

        if (result instanceof Promise) {
            result.then(i => runIfTypeOfFunction(receiver, i))
        }

        runIfTypeOfFunction(receiver, result)
    }
}

export function cspCompliantEvaluator(el, expression, extras = {}) {
    let overriddenMagics = {}

    injectMagics(overriddenMagics, el)

    let dataStack = [overriddenMagics, ...closestDataStack(el)]

    if (typeof expression === 'function') {
        return generateEvaluatorFromFunction(dataStack, expression)
    }

    let evaluator = (receiver = () => {}, { scope = {}, params = [] } = {}) => {
        let completeScope = mergeProxies([scope, ...dataStack])

        if (completeScope[expression] !== undefined) {
            runIfTypeOfFunction(receiver, completeScope[expression], completeScope, params)
        }
   }

    return tryCatch.bind(null, el, expression, evaluator)
}

function generateEvaluatorFromString(dataStack, expression) {
    let AsyncFunction = Object.getPrototypeOf(async function(){}).constructor

    let func = new AsyncFunction(['__self', 'scope'], `with (scope) { __self.result = ${expression} }; __self.finished = true; return __self.result;`)

    return (receiver = () => {}, { scope = {}, params = [] } = {}) => {
        func.result = undefined
        func.finished = false

        // Run the function.

        let completeScope = mergeProxies([ scope, ...dataStack ])

        let promise = func(func, completeScope)

        // Check if the function ran synchronously,
        if (func.finished) {
            // Return the immediate result.
            runIfTypeOfFunction(receiver, func.result, completeScope, params)
        } else {
            // If not, return the result when the promise resolves.
            promise.then(result => {
                runIfTypeOfFunction(receiver, result, completeScope, params)
            })
        }
    }
}

function runIfTypeOfFunction(receiver, value, scope, params) {
    if (typeof value === 'function') {
        receiver(
            value.apply(scope, params)
        )
    } else {
        receiver(value)
    }
}

function tryCatch(el, expression, callback, ...args) {
    try {
        return callback(...args)
    } catch (e) {
        console.warn(`Alpine Expression Error: ${e.message}\n\nExpression: "${expression}"\n\n`, el)

        throw e
    }
}
