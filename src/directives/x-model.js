import hyperactiv from 'hyperactiv'

export default (el, value, modifiers, expression, react) => {
    let evaluate = el.__x__getEvaluator(expression)
    let assignmentExpression = `${expression} = rightSideOfExpression($event, ${expression})`
    let evaluateAssignment = el.__x__getEvaluator(assignmentExpression)

    // If the element we are binding to is a select, a radio, or checkbox
    // we'll listen for the change event instead of the "input" event.
    var event = (el.tagName.toLowerCase() === 'select')
        || ['checkbox', 'radio'].includes(el.type)
        || modifiers.includes('lazy')
            ? 'change' : 'input'

    let assigmentFunction = generateAssignmentFunction(el, modifiers, expression)

    el.__x__on(el, event, modifiers, (e) => {
        evaluateAssignment({
            '$event': e,
            rightSideOfExpression: assigmentFunction
        })
    })

    react(() => {
        let value = evaluate()

        // If nested model key is undefined, set the default value to empty string.
        if (value === undefined && expression.match(/\./)) value = ''

        el.__x__bind('value', value)
    })
}

function generateAssignmentFunction(el, modifiers, expression) {
    if (el.type === 'radio') {
        // Radio buttons only work properly when they share a name attribute.
        // People might assume we take care of that for them, because
        // they already set a shared "x-model" attribute.
        if (! el.hasAttribute('name')) el.setAttribute('name', expression)
    }

    return (event, currentValue) => {
        // Check for event.detail due to an issue where IE11 handles other events as a CustomEvent.
        if (event instanceof CustomEvent && event.detail) {
            return event.detail
        } else if (el.type === 'checkbox') {
            // If the data we are binding to is an array, toggle its value inside the array.
            if (Array.isArray(currentValue)) {
                let newValue = modifiers.includes('number') ? safeParseNumber(event.target.value) : event.target.value
                return event.target.checked ? currentValue.concat([newValue]) : currentValue.filter(el => !checkedAttrLooseCompare(el, newValue))
            } else {
                return event.target.checked
            }
        } else if (el.tagName.toLowerCase() === 'select' && el.multiple) {
            return modifiers.includes('number')
                ? Array.from(event.target.selectedOptions).map(option => {
                    let rawValue = option.value || option.text
                    return safeParseNumber(rawValue)
                })
                : Array.from(event.target.selectedOptions).map(option => {
                    return option.value || option.text
                })
        } else {
            let rawValue = event.target.value
            return modifiers.includes('number')
                ? safeParseNumber(rawValue)
                : (modifiers.includes('trim') ? rawValue.trim() : rawValue)
        }
    }
}


function safeParseNumber(rawValue) {
    let number = rawValue ? parseFloat(rawValue) : null
    return isNumeric(number) ? number : rawValue
}

function checkedAttrLooseCompare(valueA, valueB) {
    return valueA == valueB
}
