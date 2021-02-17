import { evaluator } from '../evaluator'

export default (el, { expression }) => {
    let evaluate = evaluator(el, expression)

    effect(() => evaluate(value => el.textContent = value))
}
