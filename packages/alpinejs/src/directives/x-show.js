import { setStyles } from '../utils/styles'
import { directive } from '../directives'
import { evaluateLater } from '../evaluator'
import { effect } from '../reactivity'
import { once } from '../utils/once'

directive('show', (el, { value, modifiers, expression }) => {
    let evaluate =evaluateLater(el, expression)

    if (el.style.display) el.style.display = ''

    let hide = () => {
        el._x_undoHide = setStyles(el, { display: 'none' })

        el._x_is_shown = false
    }

    let show = () => {
        // Don't actually "show" an element until JavaScript has completely
        // finished its execution. This way things like @click.away work
        // properly instead of causing race-conditions when toggling.
        el._x_undoHide?.() || delete el._x_undoHide

        el._x_is_shown = true
    }

    // We are wrapping this function in a setTimeout here to prevent
    // a race condition from happening where elements that have a
    // @click.away always view themselves as shown on the page.
    let clickAwayCompatibleShow = () => setTimeout(show)

    let toggle = once(
        value => value ? show() : hide(),
        value => {
            if (typeof el._x_toggleAndCascadeWithTransitions === 'function') {
                el._x_toggleAndCascadeWithTransitions(el, value, show, hide)
            } else {
                value ? clickAwayCompatibleShow() : hide()
            }
        }
    )

    effect(() => evaluate(value => {
        if (modifiers.includes('immediate')) value ? clickAwayCompatibleShow() : hide()

        toggle(value)
    }))
})
