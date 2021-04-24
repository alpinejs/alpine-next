import { alpineGlobal } from '@alpinejs/shared'
import { morph } from './morph'

export default function (el, { expression }) {
    let evaluate = alpineGlobal().evaluateLater(el, expression)

    alpineGlobal().effect(() => {
        evaluate(value => {
            if (! el.firstElementChild) {
                if (el.firstChild) el.firstChild.remove()

                el.appendChild(document.createElement('div'))
            }

            morph(el.firstElementChild, value)
        })
    })
}
