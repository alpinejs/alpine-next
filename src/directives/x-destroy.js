import { onDestroy } from '../lifecycle'
import { evaluate } from '../evaluator'

export default (el, { value, modifiers, expression }) => {
    onDestroy(el, () => evaluate(el, expression, {}, false))
}
