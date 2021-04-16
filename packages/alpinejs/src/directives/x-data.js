import { getComponent } from '../components'
import { evaluate } from '../evaluator'
import { addScopeToNode, hasScope } from '../scope'
import { directive, prefix } from '.'
import { reactive } from '../reactivity'
import { injectMagics } from '../magics'
import { onDestroy, addRootSelector } from '../lifecycle'
import { skipDuringClone } from '../clone'

addRootSelector(() => `[${prefix('data')}]`)

directive('data', skipDuringClone((el, { expression }) => {
    expression = expression === '' ? '{}' : expression

    let component = getComponent(expression)

    let data = component ? component() : evaluate(el, expression)

    injectMagics(data, el)

    let reactiveData = reactive(data)

    addScopeToNode(el, reactiveData)

    if (reactiveData['init']) reactiveData['init']()

    if (reactiveData['destroy']) {
        onDestroy(el, () => {
            reactiveData['destroy']()
        })
    }
}))
