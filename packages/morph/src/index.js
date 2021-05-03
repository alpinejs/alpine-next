import { morph } from './morph'

export default function (el, { expression }, { effect }) {
    let evaluate = Alpine.evaluateLater(el, expression)

    effect(() => {
        evaluate(value => {
            let child = el.firstElementChild || el.firstChild || el.appendChild(document.createTextNode(''))

            morph(child, value)
        })
    })
}

window.morphit = morph

export { morph }
