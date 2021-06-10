import Alpine from './alpine'

let plugins = new Set

export function plugin(callback) {
    if (plugins.has(callback)) return
    
    callback(Alpine)
}
