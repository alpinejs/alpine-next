import hyperactiv from 'hyperactiv'

export default (el, value, modifiers, expression, reactive) => {
    let evaluate = el.__x__getEvaluator(expression)

    let hide = () => {
        el.style.display = 'none'

        el.__x__isShown = false
    }

    let show = () => {
        if (el.style.length === 1 && el.style.display === 'none') {
            el.removeAttribute('style')
        } else {
            el.style.removeProperty('display')
        }

        el.__x_isShown = true
    }

    const handle = (resolve, reject) => {
        if (value) {

            resolve(() => {})
        } else {
            if (el.style.display !== 'none') {

            } else {
                resolve(() => {})
            }
        }
    }

    let isFirstRun = true

    reactive(() => {
        let value = evaluate()

        if (isFirstRun) {
            value ? show() : hide()
            isFirstRun = false
            return
        }

        // The working of x-show is a bit complex because we need to
        // wait for any child transitions to finish before hiding
        // some element. Also, this has to be done recursively.

        // If x-show.immediate, foregoe the waiting.
        if (modifiers.includes('immediate')) {
            handle(finish => finish(), () => {})
            return
        }

        // x-show is encountered during a DOM tree walk. If an element
        // we encounter is NOT a child of another x-show element we
        // can execute the previous x-show stack (if one exists).
        if (component.showDirectiveLastElement && ! component.showDirectiveLastElement.contains(el)) {
            component.executeAndClearRemainingShowDirectiveStack()
        }

        component.showDirectiveStack.push(handle)

        component.showDirectiveLastElement = el

    })
}
