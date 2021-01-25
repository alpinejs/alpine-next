import Alpine from '../alpine'
import { effect } from '../reactivity'
import scheduler from '../scheduler'
import { evaluator, evaluatorSync } from '../utils/evaluate'

Alpine.directive('if', (el, value, modifiers, expression, effect) => {
    let evaluate = evaluator(el, expression)

    let show = () => {
        let clonedFragment = el.content.cloneNode(true)

        let first = clonedFragment.firstChild
        let last = clonedFragment.lastChild

        el.after(clonedFragment)

        let range = document.createRange()
        first && range.setStartBefore(first)
        last && range.setEndAfter(last)

        el._x_undoIf = () => range.deleteContents()
    }

    let hide = () => el._x_undoIf?.() || delete el._x_undoIf

    effect(() => evaluate()(result => result ? show() : hide()))
})
