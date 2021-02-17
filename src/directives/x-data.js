import { getComponent } from '../components'
import { evaluateSync } from '../evaluator'
import { addScopeToNode } from '../scope'
import { reactive } from '../reactivity'
import { injectMagics } from '../magics'
import { onDestroy } from '../lifecycle'

export default (el, { value, modifiers, expression }) => {
    expression = expression === '' ? '{}' : expression

    let component = getComponent(expression)

    let data = component ? component() : evaluateSync(el, expression)

    injectMagics(data, el)

    addScopeToNode(el, reactive(data))

    if (data['init']) data['init']()

    if (data['destroy']) {
        onDestroy(el, () => {
            data['destory']()
        })
    }
}
