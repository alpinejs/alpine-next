import { morph } from './morph'

export default function (el, { expression }, { effect, Alpine }) {
    let evaluate = Alpine.evaluateLater(el, expression)

    effect(() => {
        evaluate(value => {
            console.log('morph');

            let child = el.firstElementChild || el.firstChild || el.appendChild(document.createTextNode(''))

            morph(child, value)
        })
    })
}

export { morph }
