import { evaluator } from '../evaluator'
import { onDestroy } from '../lifecycle'
import on from '../utils/on'

export default (el, { value, modifiers, expression }) => {
    let evaluate = expression ? evaluator(el, expression, false) : () => {}

    let removeListener = on(el, value, modifiers, e => {
        evaluate(() => {}, { '$event': e })
    })

    onDestroy(el, removeListener)
}
