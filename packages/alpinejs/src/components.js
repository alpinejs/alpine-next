
let components = {}

export function component(name, callback) {
    components[name] = callback
}

export function getComponent(name) {
    return components[name]
}
