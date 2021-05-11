let reactive, effect, release, raw

export function setReactivityEngine(engine) {
    reactive = engine.reactive
    release = engine.release
    effect = engine.effect
    raw = engine.raw
}

export function overrideEffect(override) { effect = override }

export {
    release,
    reactive,
    effect,
    raw,
}
