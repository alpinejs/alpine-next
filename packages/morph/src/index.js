import { morph } from './morph'

let Alpine

export default function (el, { expression }, global) {
    let Alpine = global

    let evaluate = Alpine.evaluateLater(el, expression)

    Alpine.effect(() => {
        evaluate(value => {
            if (! el.firstElementChild) {
                if (el.firstChild) el.firstChild.remove()

                el.appendChild(document.createElement('div'))
            }

            morph(el.firstElementChild, value)
        })
    })
}

export { morph }
