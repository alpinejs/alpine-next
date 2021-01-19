import Alpine from '../alpine'
import scheduler from '../scheduler'
import { setClasses } from '../utils/classes'

let handler = (el, value, modifiers, expression, effect) => {
    if (! el._x_transition) {
        el._x_transition = {
            enter: { during: '', start: '', end: '' },

            leave: { during: '', start: '', end: '' },

            in(before = () => {}, after = () => {}) {
                return transitionClasses(el, {
                    during: this.enter.during,
                    start: this.enter.start,
                    end: this.enter.end,
                }, before, after)
            },

            out(before = () => {}, after = () => {}) {
                return transitionClasses(el, {
                    during: this.leave.during,
                    start: this.leave.start,
                    end: this.leave.end,
                }, before, after)
            }
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

export function registerTranstions(el, modifiers) {
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

    return


    let settingBothSidesOfTransition = modifiers.includes('in') && modifiers.includes('out')

    // // If x-show.transition.in...out... only use "in" related modifiers for this transition.
    let inModifiers = settingBothSidesOfTransition
        ? modifiers.filter((i, index) => index < modifiers.indexOf('out')) : modifiers

    let outModifiers = settingBothSidesOfTransition
        ? modifiers.filter((i, index) => index > modifiers.indexOf('out')) : modifiers


    // clear the previous transition if exists to avoid caching the wrong styles
    if (el.__x_transition) {
        el.__x_transition.cancel && el.__x_transition.cancel()
    }

    // If the user set these style values, we'll put them back when we're done with them.
    let opacityCache = el.style.opacity
    let transformCache = el.style.transform
    let transformOriginCache = el.style.transformOrigin

    // If no modifiers are present: x-show.transition, we'll default to both opacity and scale.
    let noModifiers = ! modifiers.includes('opacity') && ! modifiers.includes('scale')
    let transitionOpacity = noModifiers || modifiers.includes('opacity')
    let transitionScale = noModifiers || modifiers.includes('scale')

    // These are the explicit stages of a transition (same stages for in and for out).
    // This way you can get a birds eye view of the hooks, and the differences
    // between them.
    let stages = {
        start() {
            if (transitionOpacity) el.style.opacity = styleValues.first.opacity
            if (transitionScale) el.style.transform = `scale(${styleValues.first.scale / 100})`
        },
        during() {
            if (transitionScale) el.style.transformOrigin = styleValues.origin
            el.style.transitionProperty = [(transitionOpacity ? `opacity` : ``), (transitionScale ? `transform` : ``)].join(' ').trim()
            el.style.transitionDuration = `${styleValues.duration / 1000}s`
            el.style.transitionTimingFunction = `cubic-bezier(0.4, 0.0, 0.2, 1)`
        },
        show() {
            hook1()
        },
        end() {
            if (transitionOpacity) el.style.opacity = styleValues.second.opacity
            if (transitionScale) el.style.transform = `scale(${styleValues.second.scale / 100})`
        },
        hide() {
            hook2()
        },
        cleanup() {
            if (transitionOpacity) el.style.opacity = opacityCache
            if (transitionScale) el.style.transform = transformCache
            if (transitionScale) el.style.transformOrigin = transformOriginCache
            el.style.transitionProperty = null
            el.style.transitionDuration = null
            el.style.transitionTimingFunction = null
        },
    }
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

function setStyles(el, styleObject) {
    let previousStyles = {}

    Object.entries(styleObject).forEach(([key, value]) => {
        previousStyles[key] = el.style[key]

        el.style[key] = value
    })

    return () => {
        setStyles(el, previousStyles)
    }
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

export function once(callback) {
    let called = false

    return function () {
        if (! called) {
            called = true

            callback.apply(this, arguments)
        }
    }
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
