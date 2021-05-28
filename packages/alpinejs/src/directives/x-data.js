import { getComponent } from '../components'
import { evaluate } from '../evaluator'
import { addScopeToNode } from '../scope'
import { directive, prefix } from '.'
import { reactive } from '../reactivity'
import { injectMagics } from '../magics'
import { addRootSelector } from '../lifecycle'
import { skipDuringClone } from '../clone'
import { dispatch } from '../utils/dispatch'
import { initInterceptors } from '../interceptor'

addRootSelector(() => `[${prefix('data')}]`)

directive('data', skipDuringClone((el, { expression }, { cleanup }) => {
    expression = expression === '' ? '{}' : expression

    let component = getComponent(expression)

    let data = {}

    if (component) {
        let magics = injectMagics({}, el)

        data = component.bind(magics)()
    } else {
        data = evaluate(el, expression)
    }

    initInterceptors(data)

    injectMagics(data, el)

    let reactiveData = reactive(data)

    let undo = addScopeToNode(el, reactiveData)

    if (reactiveData['init']) reactiveData['init']()

    cleanup(() => {
        undo()

        reactiveData['destroy'] && reactiveData['destroy']()
    })
}))
