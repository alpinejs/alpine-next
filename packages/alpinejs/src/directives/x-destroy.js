import { directive } from '.'
import { evaluateLater } from '../evaluator'

directive('destroy', (el, { expression }, { cleanup }) => {
    cleanup(evaluateLater(el, expression))
})
