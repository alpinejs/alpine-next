
let reactive, effect, release, raw

let queue = []

let flushing = false
let flushPending = false

function queueJob(job) {
    if (! queue.includes(job)) queue.push(job)

    queueFlush()
}

function queueFlush() {
    if (! flushing && ! flushPending) {
        flushPending = true
        currentFlushPromise = Promise.resolve().then(flushJobs)
    }
}

export function flushJobs() {
    flushPending = false
    flushing = true

    for (let i = 0; i < queue.length; i++) {
        queue[i]()
    }

    queue.length = 0

    flushing = false
}

export function setReactivityEngine(engine) {
    window.reactive = engine.reactive
    window.effect = engine.effect
    reactive = engine.reactive
    release = engine.release
    effect = (callback) => {
        return engine.effect(callback, { scheduler: queueJob })
    }
    raw = engine.raw
}

export function overrideEffect(override) { effect = override }

export function elementalEffect(el) {
    let cleanup = () => {}

    let wrappedEffect = (callback) => {
        let effectReference = effect(callback)

        if (! el._x_effects) {
            el._x_effects = new Set

            el._x_runEffects = () => { el._x_effects.forEach(i => i()) }
        }

        el._x_effects.add(effectReference)

        cleanup = () => {
            el._x_effects.delete(effectReference)

            release(effectReference)
        }
    }

    return [wrappedEffect, () => { cleanup() }]
}

export {
    release,
    reactive,
    effect,
    raw,
}
