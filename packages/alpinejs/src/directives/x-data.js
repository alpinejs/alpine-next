import { getComponent } from '../components'
import { evaluate } from '../evaluator'
import { addScopeToNode } from '../scope'
import { directive, prefix } from '.'
import { reactive } from '../reactivity'
import { injectMagics } from '../magics'
import { addRootSelector } from '../lifecycle'
import { skipDuringClone } from '../clone'
import { dispatch } from '../utils/dispatch'

addRootSelector(() => `[${prefix('data')}]`)

directive('data', skipDuringClone((el, { expression }, { cleanup }) => {
    expression = expression === '' ? '{}' : expression

    let component = getComponent(expression)

    let data = component ? component() : evaluate(el, expression)

    injectMagics(data, el)

    let reactiveData = reactive(data)

    let undo = addScopeToNode(el, reactiveData)

    dispatch(el, 'alpine:rename-me', { rawData: data, reactiveData })

    if (reactiveData['init']) reactiveData['init']()

    cleanup(() => {
        undo()

        reactiveData['destroy'] && reactiveData['destory']()
    })
}))
