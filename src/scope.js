
export function scope(node) {
    return mergeProxies(closestDataStack(node))
}

export function addScopeToNode(node, data, referenceNode) {
    node._x_dataStack = [data, ...closestDataStack(referenceNode || node)]
}

export function refreshScopeOnNode(node, data, referenceNode) {
    let currentStack = closestDataStack(referenceNode || node)

    let currentScope = currentStack[0]

    data.forEach()

    node._x_dataStack.push(data)
}

export function closestDataStack(node) {
    if (node._x_dataStack) return node._x_dataStack

    if (node instanceof ShadowRoot) {
        return closestDataStack(node.host)
    }

    if (! node.parentNode) {
        return []
    }

    return closestDataStack(node.parentNode)
}

export function closestDataProxy(el) {
    return mergeProxies(closestDataStack(el))
}

export function mergeProxies(objects) {
    return new Proxy({}, {
        ownKeys: () => {
            return Array.from(new Set(objects.flatMap(i => Object.keys(i))))
        },

        has: (target, name) => {
            return (objects.find(object => Object.keys(object).includes(name)) || {})[name] !== undefined
        },

        get: (target, name) => {
            return (objects.find(object => Object.keys(object).includes(name)) || {})[name]
        },

        set: (target, name, value) => {
            let closestObjectWithKey = objects.find(object => Object.keys(object).includes(name))

            if (closestObjectWithKey) {
                closestObjectWithKey[name] = value
            } else {
                objects[objects.length - 1][name] = value
            }

            return true
        },
    })
}
