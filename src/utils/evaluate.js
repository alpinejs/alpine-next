import Alpine from '../alpine.js'

window.Element.prototype._x_evaluator = function(expression, extras = {}, returns = true) {
    // Ok, gear up for this method. It's a bit of a bumpy ride.

    // First, we establish all data we want made available to the function/expression.
    let farExtras = {}
    let dataStack = this._x_closestDataStack()
    let closeExtras = extras

    Alpine.injectMagics(closeExtras, this)

    // Now we smush em all together into one stack and reverse it so we can give proper scoping priority later.
    let reversedDataStack = [farExtras].concat(Array.from(dataStack).concat([closeExtras])).reverse()

    // If we weren't given a string expression (in the case of x-spread), evaluate the function directly.
    if (typeof expression === 'function') {
        let mergedObject = mergeProxies(...reversedDataStack)
        return expression.bind(mergedObject)
    }

    let names = reversedDataStack.map((data, index) => `$data${index}`)

    let namesWithPlaceholder = ['$dataPlaceholder'].concat(names)

    let assignmentPrefix = returns ? '__self.result = ' : ''

    let withExpression = namesWithPlaceholder.reduce((carry, current) => { return `with (${current}) { ${carry} }` }, `${assignmentPrefix}${expression}`)

    let namesWithPlaceholderAndDefault = names.concat(['$dataPlaceholder = {}'])

    let evaluator = () => {}

    // We're going to use Async functions for evaluation to allow for the use of "await" in expressions.
    let AsyncFunction = Object.getPrototypeOf(async function(){}).constructor

    // We wrap this in a try catch right now so we can catch errors when constructing the evaluator and handle them nicely.
    evaluator = tryCatch(this, expression, () => (...args) => {
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

    return tryCatch.bind(null, this, expression, boundEvaluator)
}

window.Element.prototype._x_evaluate = function(expression, extras = {}, returns = true) {
    return this._x_evaluator(expression, extras, returns)()
}

window.Element.prototype._x_evaluateSync = function(expression, extras = {}, returns = true) {
    let result

    this._x_evaluator(expression, extras, returns)()(value => result = value)

    return result
}

window.Element.prototype._x_closestDataStack = function() {
    if (this._x_dataStack) return this._x_dataStack

    if (! this.parentElement) return new Set

    return this.parentElement._x_closestDataStack()
}

window.Element.prototype._x_closestDataProxy = function() {
    return mergeProxies(...this._x_closestDataStack())
}

function tryCatch(el, expression, callback, ...args) {
    try {
        return callback(...args)
    } catch (e) {
        console.warn(`Alpine Expression Error: ${e.message}\n\nExpression: "${expression}"\n\n`, el)

        throw e
    }
}

function mergeProxies(...objects) {
    return new Proxy({}, {
        get: (target, name) => {
            return (objects.find(object => Object.keys(object).includes(name)) || {})[name];
        },

        set: (target, name, value) => {
            let closestObjectWithKey = objects.find(object => Object.keys(object).includes(name))
            let closestCanonicalObject = objects.find(object => object['_x_canonical'])

            if (closestObjectWithKey) {
                closestObjectWithKey[name] = value
            } else if (closestCanonicalObject) {
                closestCanonicalObject[name] = value
            } else {
                objects[objects.length - 1][name] = value
            }

            return true
        },
    })
}
