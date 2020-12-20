import mergeProxies from './mergeProxies'

export function closestDataStack(el) {
    if (el._x_dataStack) return el._x_dataStack

    if (! el.parentElement) return new Set

    return closestDataStack(el.parentElement)
}

export function closestDataProxy(el) {
    return mergeProxies(...closestDataStack(el))
}
