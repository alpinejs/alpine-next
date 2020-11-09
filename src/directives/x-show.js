import { resolve } from 'cypress/types/bluebird'
import Alpine from '../alpine'

Alpine.directive('show', (el, value, modifiers, expression, react) => {
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

        isFirstRun ? toggleImmediately(el, value, show, hide) : toggleWithTransitions(el, value, show, hide)

        isFirstRun = false
    })
})

function toggleImmediately(el, value, show, hide) {
    value ? show() : hide()
}

function toggleWithTransitions(el, value, show, hide) {
    if (value) {
        el.__x__transition
            ? el.__x__transition.in(show)
            : show()
    } else {
        el.__x__do_hide = el.__x__transition
            ? (resolve, reject) => {
                el.__x__transition.out(() => {}, () => resolve(hide))

                el.__x__transitioning.beforeCancel(() => reject({ isFromCancelledTransition: true }))
            }
            : (resolve) => resolve(hide)

        queueMicrotask(() => {
            let closest = closestHide(el)

            if (closest) {
                closest.__x__hide_child = el
            } else {
                queueMicrotask(() => {
                    let hidePromises = []
                    let current = el
                    while (current) {
                        hidePromises.push(new Promise(current.__x__do_hide))

                        current = current.__x__hide_child
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

    return parent.__x__do_hide ? parent : closestHide(parent)
}
