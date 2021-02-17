import { evaluator } from '../evaluator'
import morph from '../morph'

export default (el, { value, modifiers, expression }) => {
    let evaluate = evaluator(el, expression)

    effect(() => {
        evaluate(value => {
            if (! el.firstElementChild) {
                if (el.firstChild) el.firstChild.remove()

                el.appendChild(document.createElement('div'))
            }

            morph(el.firstElementChild, value)
        })
    })
}
