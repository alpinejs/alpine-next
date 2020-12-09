import Alpine from '../alpine'
import morph from '../morph'

Alpine.directive('morph', (el, value, modifiers, expression, effect) => {
    let evaluate = el._x_evaluator(expression)

    effect(() => {
        evaluate()(value => {
            if (! el.firstElementChild) {
                if (el.firstChild) {
                    el.firstChild.remove()
                }

                el.appendChild(document.createElement('div'))
            }

            morph(el.firstElementChild, value)
        })
    })
})
