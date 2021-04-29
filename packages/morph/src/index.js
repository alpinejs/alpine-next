import { morph } from './morph'

export default function (el, { expression }, { effect }) {
    let evaluate = Alpine.evaluateLater(el, expression)

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

export { morph }
