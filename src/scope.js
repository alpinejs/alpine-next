import { closestDataStack } from './utils/closest'

export function addScopeToNode(node, data, referenceNode) {
    node._x_dataStack = new Set(closestDataStack(referenceNode || node))

    node._x_dataStack.add(data)
}

export function refreshScopeOnNode(node, data, referenceNode) {
    let currentStack = new Set(closestDataStack(referenceNode || node))

    let currentScope = Array.from(currentStack).slice(-1)[0]

    data.forEach()

    node._x_dataStack.add(data)
}
