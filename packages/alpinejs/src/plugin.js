import Alpine from './alpine'

let plugins = new Set

export function plugin(callback, config = {}) {
    if (plugins.has(callback)) return
    
    callback(Alpine, config)
}
