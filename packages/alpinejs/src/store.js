
let stores = {}

export function store(name, object) {
    stores[name] = this.reactive(object)
}

export function getStore(name) {
    return stores[name]
}
