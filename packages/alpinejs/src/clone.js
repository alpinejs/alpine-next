import { initTree } from "./lifecycle"

let isCloning = false

export function skipDuringClone(callback) {
    return (...args) => isCloning || callback(...args)
}

export function clone(oldEl, newEl) {
    newEl._x_dataStack = oldEl._x_dataStack

    isCloning = true

    initTree(newEl)

    isCloning = false
}
