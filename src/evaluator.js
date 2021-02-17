import { injectMagics } from './magics'
import { scope, closestDataStack, mergeProxies, closestDataProxy } from './scope'

export function evaluate(el, expression, extras = {}) {
    return evaluator(el, expression)(() => {}, extras)
}

export function evaluateSync(el, expression, extras = {}) {
    let result

    evaluator(el, expression)(value => result = value, extras)

    return result
}

export function evaluatorSync(el, expression, extras = {}) {
    let evaluate = evaluator(el, expression)

    return (extras) => {
        let result

        evaluate(value => result = value, extras)

        return result
    }
}

export function evaluator(el, expression, extras = {}) {
    let overriddenMagics = {}

    injectMagics(overriddenMagics, el)

    let dataStack = [overriddenMagics, ...closestDataStack(el)]

    if (typeof expression === 'function') {
        return generateEvaluatorFromFunction(dataStack, expression)
    }

    let evaluator = generateEvaluatorFromString(dataStack, expression)

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

// CSP Compatibility
// function generateEvaluatorFromString(dataStack, expression, returns) {
//    return (receiver = () => {}, runtimeScope = {}) => {
//         let scope = mergeProxies([runtimeScope, ...dataStack])

//         if (scope[expression] !== undefined) {
//             runIfTypeOfFunction(receiver, scope[expression])
//         }
//    }
// }

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
        console.log(callback.toString())
        console.warn(`Alpine Expression Error: ${e.message}\n\nExpression: "${expression}"\n\n`, el)

        throw e
    }
}
