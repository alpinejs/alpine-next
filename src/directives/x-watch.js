import Alpine from '../alpine'
import { evaluator } from '../utils/evaluate'

Alpine.directive('watch', (el, value, modifiers, expression, effect) => {
    let evaluate = evaluator(el, `$watch('${value}', $value => ${expression})`)

    setTimeout(() => {
        evaluate()
    })
})
