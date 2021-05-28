
let components = {}

export function data(name, callback) {
    components[name] = callback
}

export function getComponent(name) {
    return components[name]
}
