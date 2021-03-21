import { setStyles } from '../utils/styles'
import { evaluator } from '../evaluator'
import { effect } from '../reactivity'
import { once } from '../utils/once'

export default (el, { value, modifiers, expression }) => {
    let evaluate = evaluator(el, expression)

    let hide = () => {
        el._x_undoHide = setStyles(el, { display: 'none' })

        el._x_is_shown = false
    }

    let show = () => {
        // Don't actually "show" an element until JavaScript has completely
        // finished its execution. This way things like @click.away work
        // properly instead of causing race-conditions when toggling.
        setTimeout(() => {
            el._x_undoHide?.() || delete el._x_undoHide

            el._x_is_shown = true
        });
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

    effect(() => evaluate(value => {
        if (modifiers.includes('immediate')) value ? show() : hide()

        toggle(value)
    }))
}
