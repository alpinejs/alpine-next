import { closestDataStack } from './utils/closest'

export function addScopeToNode(node, data) {
    node._x_dataStack = new Set(closestDataStack(node))

    node._x_dataStack.add(data)
}
