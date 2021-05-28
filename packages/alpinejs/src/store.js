import { reactive } from "./reactivity"

let stores = {}
let isReactive = false

export function store(name, value) {
    if (! isReactive) { stores = reactive(stores); isReactive = true; }

    if (value === undefined) {
        return stores[name]
    }

    stores[name] = reactive(value)
}

export function getStores() { return stores }
