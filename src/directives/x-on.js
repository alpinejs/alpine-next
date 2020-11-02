
export default (el, value, modifiers, expression) => {
    let evaluate = el.__x__getEvaluator(expression)

    el.__x__on(el, value, modifiers, e => {
        evaluate({
            '$event': e
        })
    })
}

export function on(el, event, modifiers, callback) {
    let target = modifiers.includes('window') ? window : el

    target.addEventListener(event, callback)
}
