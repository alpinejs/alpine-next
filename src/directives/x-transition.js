import Alpine from '../alpine'
import scheduler from '../scheduler'

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

// handler.initOnly = true

Alpine.directive('transition', handler)

export function transitionClasses(el, { during = '', start = '', end = '' } = {}, before = () => {}, after = () => {}) {
    if (el._x_transitioning) el._x_transitioning.cancel()

    let undoStart, undoDuring, undoEnd

    performTransition(el, {
        start() {
            undoStart = el._x_classes(start)
        },
        during() {
            undoDuring = el._x_classes(during)
        },
        before,
        end() {
            undoStart()

            undoEnd = el._x_classes(end)
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

export function once(callback) {
    let called = false

    return function () {
        if (! called) {
            called = true

            callback.apply(this, arguments)
        }
    }
}
