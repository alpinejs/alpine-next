import Alpine from '../alpine'
import { evaluator } from '../evaluator'
import { once } from '../utils/once'
import { setStyles } from '../utils/styles'

Alpine.directive('show', (el, value, modifiers, expression, effect) => {
    let evaluate = evaluator(el, expression, {}, true, true)

    let hide = () => {
        el._x_undoHide = setStyles(el, { display: 'none' })

        el._x_is_shown = false
    }

    let show = () => {
        el._x_undoHide?.() || delete el._x_undoHide

        el._x_is_shown = true
    }

    // @depricated
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
