import Alpine from '../alpine'
import scheduler from '../scheduler'
import { setClasses } from '../utils/classes'
import { once } from '../utils/once'
import { setStyles } from '../utils/styles'

let handler = (el, value, modifiers, expression, effect) => {
    if (! el._x_transition) {
        el._x_transition = {
            enter: { during: '', start: '', end: '' },

            leave: { during: '', start: '', end: '' },

            in(before = () => {}, after = () => {}) {
                return transitionClasses(this.resolveElement(), {
                    during: this.enter.during,
                    start: this.enter.start,
                    end: this.enter.end,
                }, before, after)
            },

            out(before = () => {}, after = () => {}) {
                return transitionClasses(this.resolveElement(), {
                    during: this.leave.during,
                    start: this.leave.start,
                    end: this.leave.end,
                }, before, after)
            },

            resolveElement: () => { return el },

            setElementResolver(callback) { this.resolveElement = callback },
        }
    }

    let directiveStorageMap = {
        'enter': (classes) => { el._x_transition.enter.during = classes },
        'enter-start': (classes) => { el._x_transition.enter.start = classes },
        'enter-end': (classes) => { el._x_transition.enter.end = classes },
        'leave': (classes) => { el._x_transition.leave.during = classes },
        'leave-start': (classes) => { el._x_transition.leave.start = classes },
        'leave-end': (classes) => { el._x_transition.leave.end = classes },
    }

    directiveStorageMap[value](expression)
}

Alpine.directive('transition', handler)

export function transitionClasses(el, { during = '', start = '', end = '' } = {}, before = () => {}, after = () => {}) {
    if (el._x_transitioning) el._x_transitioning.cancel()

    let undoStart, undoDuring, undoEnd

    performTransition(el, {
        start() {
            undoStart = setClasses(el, start)
        },
        during() {
            undoDuring = setClasses(el, during)
        },
        before,
        end() {
            undoStart()

            undoEnd = setClasses(el, end)
        },
        after,
        cleanup() {
            undoDuring()
            undoEnd()
        },
    })
}

window.Element.prototype._x_registerTransitionsFromHelper = function (el, modifiers) {
    el._x_transition = {
        enter: { during: {}, start: {}, end: {} },

        leave: { during: {}, start: {}, end: {} },

        in(before = () => {}, after = () => {}) {
            return transitionStyles(el, {
                during: this.enter.during,
                start: this.enter.start,
                end: this.enter.end,
            }, before, after)
        },

        out(before = () => {}, after = () => {}) {
            return transitionStyles(el, {
                during: this.leave.during,
                start: this.leave.start,
                end: this.leave.end,
            }, before, after)
        }
    }

    let doesntSpecify = ! modifiers.includes('in') && ! modifiers.includes('out')
    let transitioningIn = doesntSpecify || modifiers.includes('in')
    let transitioningOut = doesntSpecify || modifiers.includes('out')

    if (modifiers.includes('in') && ! doesntSpecify) {
        modifiers = modifiers.filter((i, index) => index < modifiers.indexOf('out'))
    }

    if (modifiers.includes('out') && ! doesntSpecify) {
        modifiers = modifiers.filter((i, index) => index > modifiers.indexOf('out'))
    }

    if (transitioningIn) {
        el._x_transition.enter.during = {
            transitionOrigin: modifierValue(modifiers, 'origin', 'center'),
            transitionProperty: 'opacity, transform',
            transitionDuration: `${modifierValue(modifiers, 'duration', 150) / 1000}s`,
            transitionTimingFunction: `cubic-bezier(0.4, 0.0, 0.2, 1)`,
        }

        el._x_transition.enter.start = {
            opacity: 0,
            transform: `scale(${modifierValue(modifiers, 'scale', 95) / 100})`,
        }

        el._x_transition.enter.end = {
            opacity: 1,
            transform: `scale(1)`,
        }
    }


    if (transitioningOut) {
        let duration = modifierValue(modifiers, 'duration', 150) / 2

        el._x_transition.leave.during = {
            transitionOrigin: modifierValue(modifiers, 'origin', 'center'),
            transitionProperty: 'opacity, transform',
            transitionDuration: `${duration / 1000}s`,
            transitionTimingFunction: `cubic-bezier(0.4, 0.0, 0.2, 1)`,
        }

        el._x_transition.leave.start = {
            opacity: 1,
            transform: `scale(1)`,
        }

        el._x_transition.leave.end = {
            opacity: 0,
            transform: `scale(${modifierValue(modifiers, 'scale', 95) / 100})`,
        }
    }
}

window.Element.prototype._x_toggleAndCascadeWithTransitions = function (el, value, show, hide) {
    if (value) {
        el._x_transition
            ? el._x_transition.in(show)
            : show()

        return
    }

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

function closestHide(el) {
    let parent = el.parentNode

    if (! parent) return

    return parent._x_do_hide ? parent : closestHide(parent)
}

function transitionStyles(el, { during = {}, start = {}, end = {} }, before = () => {}, after = () => {}) {
    if (el._x_transitioning) el._x_transitioning.cancel()

    let undoStart, undoDuring, undoEnd

    performTransition(el, {
        start() {
            undoStart = setStyles(el, start)
        },
        during() {
            undoDuring = setStyles(el, during)
        },
        before,
        end() {
            undoStart()

            undoEnd = setStyles(el, end)
        },
        after,
        cleanup() {
            undoDuring()
            undoEnd()
        },
    })
}

export function performTransition(el, stages) {
    let finish = once(() => {
        stages.after()

        // Adding an "isConnected" check, in case the callback removed the element from the DOM.
        if (el.isConnected) stages.cleanup()

        delete el._x_transitioning
    })

    el._x_transitioning = {
        beforeCancels: [],
        beforeCancel(callback) { this.beforeCancels.push(callback) },
        cancel: once(function () { while (this.beforeCancels.length) { this.beforeCancels.shift()() }; finish(); }),
        finish
    }

    stages.start()
    stages.during()

    scheduler.holdNextTicks()

    requestAnimationFrame(() => {
        // Note: Safari's transitionDuration property will list out comma separated transition durations
        // for every single transition property. Let's grab the first one and call it a day.
        let duration = Number(getComputedStyle(el).transitionDuration.replace(/,.*/, '').replace('s', '')) * 1000

        if (duration === 0) {
            duration = Number(getComputedStyle(el).animationDuration.replace('s', '')) * 1000
        }

        stages.before()

        requestAnimationFrame(() => {
            stages.end()

            scheduler.releaseNextTicks()

            setTimeout(el._x_transitioning.finish, duration)
        })
    })
}



function modifierValue(modifiers, key, fallback) {
    // If the modifier isn't present, use the default.
    if (modifiers.indexOf(key) === -1) return fallback

    // If it IS present, grab the value after it: x-show.transition.duration.500ms
    const rawValue = modifiers[modifiers.indexOf(key) + 1]

    if (! rawValue) return fallback

    if (key === 'scale') {
        // Check if the very next value is NOT a number and return the fallback.
        // If x-show.transition.scale, we'll use the default scale value.
        // That is how a user opts out of the opacity transition.
        if (! isNumeric(rawValue)) return fallback
    }

    if (key === 'duration') {
        // Support x-show.transition.duration.500ms && duration.500
        let match = rawValue.match(/([0-9]+)ms/)
        if (match) return match[1]
    }

    if (key === 'origin') {
        // Support chaining origin directions: x-show.transition.top.right
        if (['top', 'right', 'left', 'center', 'bottom'].includes(modifiers[modifiers.indexOf(key) + 2])) {
            return [rawValue, modifiers[modifiers.indexOf(key) + 2]].join(' ')
        }
    }

    return rawValue
}
