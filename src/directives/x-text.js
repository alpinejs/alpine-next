import { evaluator } from '../evaluator'
import { effect } from '../reactivity'

export default (el, { expression }) => {
    let evaluate = evaluator(el, expression)

    effect(() => evaluate(value => el.textContent = value))
}
