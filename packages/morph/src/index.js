import Alpine from 'alpinejs'
import { morph } from './morph'

export default function (el, { expression }) {
    let evaluate = Alpine.evaluateLater(el, expression)

    window.effect(() => {
        evaluate(value => {
            if (! el.firstElementChild) {
                if (el.firstChild) el.firstChild.remove()

                el.appendChild(document.createElement('div'))
            }

            morph(el.firstElementChild, value)
        })
    })
}
