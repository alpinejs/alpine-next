export default (el, value, modifiers, expression, reactive) => {
    let evaluate = el.__x__getEvaluator(expression)

    reactive(() => {
        el.innerText = evaluate()
    })
}
