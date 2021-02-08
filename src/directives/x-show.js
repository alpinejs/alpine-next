import Alpine from '../alpine'
import { evaluator } from '../utils/evaluate'
import { once } from '../utils/once'

Alpine.directive('show', (el, value, modifiers, expression, effect) => {
    let evaluate = evaluator(el, expression, {}, true, true)

    let hide = () => {
        el.style.display = 'none'

        el._x_is_shown = false

        el._x_undoHide = () => {
            if (el.style.length === 1 && el.style.display === 'none') {
                el.removeAttribute('style')
            } else {
                el.style.removeProperty('display')
            }
        }
    }

    let show = () => {
        el._x_undoHide?.() || delete el._x_undoHide

        el._x_is_shown = true
    }

    if (modifiers.includes('transition') && typeof el._x_registerTransitionsFromHelper === 'function') {
        el._x_registerTransitionsFromHelper(el, modifiers)
    }

    let toggle = once(
        value => value ? show() : hide(),
        value => {
            if (typeof el._x_toggleAndCascadeWithTransitions === 'function') {
                el._x_toggleAndCascadeWithTransitions(el, value, show, hide)
            } else {
                value ? show() : hide()
            }
        }
    )

    effect(() => evaluate()(value => {
        if (modifiers.includes('immediate')) value ? show() : hide()

        toggle(value)
    }))
})
