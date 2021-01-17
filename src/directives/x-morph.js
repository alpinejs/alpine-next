import Alpine from '../alpine'
import morph from '../morph'
import { evaluator } from '../utils/evaluate'

Alpine.directive('morph', (el, value, modifiers, expression, effect) => {
    let evaluate = evaluator(el, expression)

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
