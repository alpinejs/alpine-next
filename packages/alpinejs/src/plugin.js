import Alpine from './alpine'

let plugins = new WeakSet

export function plugin(callback, config = {}) {
    if (plugins.has(callback)) return
    
    callback(Alpine, config)

    plugins.add(callback)
}
