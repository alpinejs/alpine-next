import { onDestroy } from './lifecycle'

let reactive, effect, stop, raw

export function setReactivityEngine(engine) {
    reactive = engine.reactive
    effect = engine.effect
    stop = engine.stop
    raw = engine.raw
}

export function overrideEffect(override) {
    effect = override
}

export {
    reactive,
    effect,
    stop,
    raw,
}

function optionallyStoreEffectsForLaterReRunOrCleanup(effect) {
    return (callback, el) => {
        let storedEffect = effect(callback)

        if (el) {
            if (! el._x_effects) el._x_effects = []

            el._x_effects.push(storedEffect)

            // Release this effect's dependancy map from the reactivity core
            // when the el is removed so JavaScript can garbage collect it.
            onDestroy(el, () => stop(storedEffect))
        }

        return storedEffect
    }
}
