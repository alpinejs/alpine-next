import Alpine from './alpine.js'
import mergeProxies from './utils/mergeProxies'
import { closestDataStack } from './utils/closest'

export function evaluator(el, expression, extras = {}, returns = true) {
    // Ok, gear up for this method. It's a bit of a bumpy ride.

    // First, we establish all data we want made available to the function/expression.
    let farExtras = {}
    let dataStack = closestDataStack(el)
    let closeExtras = extras

    Alpine.injectMagics(closeExtras, el)

    // Now we smush em all together into one stack and reverse it so we can give proper scoping priority later.
    let reversedDataStack = [farExtras].concat(Array.from(dataStack).concat([closeExtras])).reverse()

    // We're going to use Async functions for evaluation to allow for the use of "await" in expressions.
    let AsyncFunction = Object.getPrototypeOf(async function(){}).constructor

    // If we weren't given a string expression (in the case of x-spread), evaluate the function directly.
    if (typeof expression === 'function') {
        let mergedObject = mergeProxies(...reversedDataStack)

        let expressionWithContext = expression.bind(mergedObject)

        return (...args) => {
            let result = expressionWithContext(...args)

            if (result instanceof Promise) {
                return (receiver) => {
                    result.then(i => receiver(i))
                }
            }

            return (receiver) => receiver(result)
        }
    }

    let names = reversedDataStack.map((data, index) => `$data${index}`)

    let namesWithPlaceholder = ['$dataPlaceholder'].concat(names)

    let assignmentPrefix = returns ? '__self.result = ' : ''

    let withExpression = namesWithPlaceholder.reduce((carry, current) => { return `with (${current}) { ${carry} }` }, `${assignmentPrefix}${expression}`)

    let namesWithPlaceholderAndDefault = names.concat(['$dataPlaceholder = {}'])

    let evaluator = () => {}

    // We wrap this in a try catch right now so we can catch errors when constructing the evaluator and handle them nicely.
    evaluator = tryCatch(el, expression, () => (...args) => {
        // We build the async function from the expression and arguments we constructed already.
        let func = new AsyncFunction(['__self', ...namesWithPlaceholderAndDefault], `${withExpression}; __self.finished = true; return __self.result;`)

        // The following rigamerol is to handle the AsyncFunction both synchronously AND asynchronously at the SAME TIME. What a rush.

        // Because the async/promise body is evaluated immediately (synchronously), we can store any results and check
        // if they are set synchronously.
        func.result = undefined
        func.finished = false

        // Run the function.
        let promise = func(...[func, ...args])

        return (receiver) => {
            // Check if the function ran synchronously,
            if (func.finished) {
                // Return the immediate result.
                receiver(func.result)
            } else {
                // If not, return the result when the promise resolves.
                promise.then(result => {
                    receiver(result)
                })
            }
        }
    })


    let boundEvaluator = evaluator.bind(null, ...reversedDataStack)

    return tryCatch.bind(null, el, expression, boundEvaluator)
}

export function evaluatorSync(el, expression, extras = {}, returns = true) {
    let evaluate = evaluator(el, expression, extras, returns)

    return (extras) => {
        let result

        evaluate(extras)(value => result = value)

        return result
    }
}

export function evaluate(el, expression, extras = {}, returns = true) {
    return evaluator(el, expression, extras, returns)()
}

export function evaluateSync(el, expression, extras = {}, returns = true) {
    let result

    evaluator(el, expression, extras, returns)()(value => result = value)

    return result
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
