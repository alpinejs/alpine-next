import { reactive } from "./reactivity"

let stores = {}

export function store(name, object) {
    stores[name] = reactive(object)
}

export function getStore(name) {
    return stores[name]
}
