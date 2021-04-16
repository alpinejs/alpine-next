import { directive } from '.'
import { onDestroy } from '../lifecycle'
import { evaluateLater } from '../evaluator'

directive('destroy', (el, { expression }) => {
    onDestroy(el, evaluateLater(el, expression))
})
