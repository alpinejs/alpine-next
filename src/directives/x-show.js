import Alpine from '../alpine'

Alpine.directive('show', (el, value, modifiers, expression, effect) => {
    let evaluate = el._x_evaluator(expression, {}, true, true)

    let hide = () => {
        el.style.display = 'none'

        el._x_is_shown = false
    }

    let show = () => {
        if (el.style.length === 1 && el.style.display === 'none') {
            el.removeAttribute('style')
        } else {
            el.style.removeProperty('display')
        }

        el._x_is_shown = true
    }

    let isFirstRun = true

    effect(() => evaluate()(value => {
        isFirstRun ? toggleImmediately(el, value, show, hide) : toggleWithTransitions(el, value, show, hide)

        isFirstRun = false
    }))
})

function toggleImmediately(el, value, show, hide) {
    value ? show() : hide()
}

function toggleWithTransitions(el, value, show, hide) {
    if (value) {
        el._x_transition
            ? el._x_transition.in(show)
            : show()
    } else {
        el._x_do_hide = el._x_transition
            ? (resolve, reject) => {
                el._x_transition.out(() => {}, () => resolve(hide))

                el._x_transitioning.beforeCancel(() => reject({ isFromCancelledTransition: true }))
            }
            : (resolve) => resolve(hide)

        queueMicrotask(() => {
            let closest = closestHide(el)

            if (closest) {
                closest._x_hide_child = el
            } else {
                queueMicrotask(() => {
                    let hidePromises = []
                    let current = el
                    while (current) {
                        hidePromises.push(new Promise(current._x_do_hide))

                        current = current._x_hide_child
                    }

                    hidePromises.reverse().reduce((promiseChain, promise) => {
                        return promiseChain.then(() => {
                            return promise.then(doHide => doHide())
                        })
                    }, Promise.resolve(() => {})).catch((e) => {
                        if (! e.isFromCancelledTransition) throw e
                    })
                })
            }
        })
    }
}

function closestHide(el) {
    let parent = el.parentElement

    if (! parent) return

    return parent._x_do_hide ? parent : closestHide(parent)
}
