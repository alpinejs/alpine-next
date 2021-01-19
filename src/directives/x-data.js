import Alpine from '../alpine'
import { reactive } from '../reactivity'
import { addScopeToNode } from '../scope'
import { evaluate, evaluateSync } from '../utils/evaluate'

Alpine.directive('data', (el, value, modifiers, expression, effect) => {
    expression = expression === '' ? '{}' : expression

    let components = Alpine.components

    let data = Object.keys(components).includes(expression)
        ? components[expression]()
        : evaluateSync(el, expression)

    Alpine.injectMagics(data, el)

    addScopeToNode(el, reactive(data))

    if (data['init']) {
        evaluateSync(el, data['init'].bind(data))
    }

    if (data['destroy']) {
        Alpine.addDestroyCallback(el, () => {
            evaluate(el, data['destroy'].bind(data))
        })
    }
})
