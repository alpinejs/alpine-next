import Alpine from './alpine'
import { injectMagics } from './magics'
import { scope, closestDataStack, mergeProxies, closestDataProxy } from './scope'

export function evaluatorSync(el, expression, extras = {}, returns = true) {
    let evaluate = evaluator(el, expression, returns)

    return (extras) => {
        let result

        evaluate(value => result = value, extras)

        return result
    }
}

export function evaluate(el, expression, extras = {}, returns = true) {
    return evaluator(el, expression, returns)(() => {}, extras)
}

export function evaluateSync(el, expression, extras = {}, returns = true) {
    let result

    evaluator(el, expression, returns)(value => result = value, extras)

    return result
}

export function evaluator(el, expression, extras = {}, returns = true) {
    let overriddenMagics = {}

    injectMagics(overriddenMagics, el)

    let dataStack = [overriddenMagics, ...closestDataStack(el)]

    if (typeof expression === 'function') {
        return generateEvaluatorFromFunction(dataStack, expression)
    }

    let evaluator = generateEvaluatorFromString(dataStack, expression, returns)

    return tryCatch.bind(null, el, expression, evaluator)
}

function generateEvaluatorFromFunction(dataStack, expression) {
    return (receiver = () => {}, runtimeScope = {}) => {
        let expressionWithContext = expression.bind(mergeProxies([runtimeScope, ...dataStack]))

        let result = expressionWithContext()

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

function generateEvaluatorFromString(dataStack, expression, returns) {
    let AsyncFunction = Object.getPrototypeOf(async function(){}).constructor

    let assignmentPrefix = returns ? '__self.result = ' : ''

    let func = new AsyncFunction(['__self', 'scope'], `with (scope) { ${assignmentPrefix}${expression} }; __self.finished = true; return __self.result;`)

    return (receiver = () => {}, runtimeScope = {}) => {
        func.result = undefined
        func.finished = false

        // Run the function.
        let promise = func(...[func, mergeProxies([runtimeScope, ...dataStack])])

        // Check if the function ran synchronously,
        if (func.finished) {
            // Return the immediate result.
            runIfTypeOfFunction(receiver, func.result)
        } else {
            // If not, return the result when the promise resolves.
            promise.then(result => {
                runIfTypeOfFunction(receiver, result)
            })
        }
    }
}

function runIfTypeOfFunction(receiver, value) {
    if (typeof value === 'function') {
        receiver(value())
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
