window.Element.prototype._x_evaluator = function(expression, extras = {}, returns = true) {
    let farExtras = Alpine.getElementMagics(this)
    let dataStack = this._x_closestDataStack()
    let closeExtras = extras
    let reversedDataStack = [farExtras].concat(Array.from(dataStack).concat([closeExtras])).reverse()

    if (typeof expression === 'function') {
        let mergedObject = mergeProxies(...reversedDataStack)
        return expression.bind(mergedObject)
    }

    let names = reversedDataStack.map((data, index) => `$data${index}`)

    let namesWithPlaceholder = ['$dataPlaceholder'].concat(names)

    let assignmentPrefix = returns ? '_x_result = ' : ''

    let withExpression = namesWithPlaceholder.reduce((carry, current) => { return `with (${current}) { ${carry} }` }, `${assignmentPrefix}${expression}`)

    let namesWithPlaceholderAndDefault = names.concat(['$dataPlaceholder = {}'])

    let evaluator = () => {}

    evaluator = tryCatch(this, () => {
        return new Function(namesWithPlaceholderAndDefault, `var _x_result; ${withExpression}; return _x_result;`)
    })

    let boundEvaluator = evaluator.bind(null, ...reversedDataStack)

    return tryCatch.bind(null, this, boundEvaluator)
}

window.Element.prototype._x_evaluate = function(expression, extras = {}, returns = true) {
    return this._x_evaluator(expression, extras, returns)()
}

window.Element.prototype._x_closestDataStack = function() {
    if (this._x_dataStack) return this._x_dataStack

    if (! this.parentElement) return new Set

    return this.parentElement._x_closestDataStack()
}

window.Element.prototype._x_closestDataProxy = function() {
    return mergeProxies(...this._x_closestDataStack())
}


function tryCatch(el, callback, ...args) {
    try {
        return callback(...args)
    } catch (e) {
        console.warn('Alpine Expression Error: '+e.message, el)

        throw e
    }
}

function mergeProxies(...objects) {
    return new Proxy({}, {
        get: (target, name) => {
            return (objects.find(object => Object.keys(object).includes(name)) || {})[name];
        },

        set: (target, name, value) => {
            (objects.find(object => Object.keys(object).includes(name)) || {})[name] = value;

            return true
        },
    })
}
