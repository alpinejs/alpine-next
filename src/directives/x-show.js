import hyperactiv from 'hyperactiv'

export default (el, value, modifiers, expression, react) => {
    let evaluate = el.__x__getEvaluator(expression)

    let hide = () => {
        el.style.display = 'none'
    }

    let show = () => {
        if (el.style.length === 1 && el.style.display === 'none') {
            el.removeAttribute('style')
        } else {
            el.style.removeProperty('display')
        }
    }

    let isFirstRun = true

    react(() => {
        let value = evaluate()

        if (isFirstRun) {
            value ? show() : hide()
            isFirstRun = false
            return
        }

        if (value) {
            if (el.__x__transition) {
                el.__x__transition.in(show, () => {})
            } else {
                show()
            }
        } else {
            if (el.__x__transition) {
                el.__x__transition.out(() => {}, hide)
            } else {
                hide()
            }
        }
    })
}
