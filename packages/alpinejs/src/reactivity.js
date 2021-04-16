
let reactive
let effect

export function setReactivity(reactiveFunction, effectFunction) {
    // @todo - fix this.

    window.effect = effectFunction
    window.reactive = reactiveFunction
    reactive = reactiveFunction
    effect = effectFunction
}

export {
    reactive,
    effect,
}
