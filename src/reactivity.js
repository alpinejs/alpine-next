
let reactive
let effect

export function setReactivity(reactiveFunction, effectFunction) {
    reactive = reactiveFunction
    effect = effectFunction
}

export {
    reactive,
    effect,
}
