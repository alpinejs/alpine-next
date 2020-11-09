import { reject } from 'cypress/types/bluebird'
import Alpine from '../alpine'

Alpine.directive('transition', (el, value, modifiers, expression, react) => {
    if (! el.__x__transition) {
        el.__x__transition = {
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
        'enter': (classes) => { el.__x__transition.enter.during = classes },
        'enter-start': (classes) => { el.__x__transition.enter.start = classes },
        'enter-end': (classes) => { el.__x__transition.enter.end = classes },
        'leave': (classes) => { el.__x__transition.leave.during = classes },
        'leave-start': (classes) => { el.__x__transition.leave.start = classes },
        'leave-end': (classes) => { el.__x__transition.leave.end = classes },
    }

    directiveStorageMap[value](expression)
})

export function transitionClasses(el, { during = '', start = '', end = '' } = {}, before = () => {}, after = () => {}) {
    if (el.__x__transitioning) el.__x__transitioning.cancel()

    let undoStart, undoDuring, undoEnd

    performTransition(el, {
        start() {
            undoStart = el.__x__addClasses(start)
        },
        during() {
            undoDuring = el.__x__addClasses(during)
        },
        before,
        end() {
            undoStart()

            undoEnd = el.__x__addClasses(end)
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

        delete el.__x__transitioning
    })

    el.__x__transitioning = {
        beforeCancels: [],
        beforeCancel(callback) { this.beforeCancels.push(callback) },
        cancel: once(function () { while (this.beforeCancels.length) { this.beforeCancels.shift()() }; finish(); }),
        finish
    }

    stages.start()
    stages.during()

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

            setTimeout(el.__x__transitioning.finish, duration)
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
