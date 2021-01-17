import mergeProxies from './mergeProxies'

export function closestDataStack(node) {
    if (node._x_dataStack) return node._x_dataStack

    if (node instanceof ShadowRoot) {
        return closestDataStack(node.host)
    }

    if (! node.parentNode) {
        return new Set
    }

    return closestDataStack(node.parentNode)
}

export function closestDataProxy(el) {
    return mergeProxies(...closestDataStack(el))
}
