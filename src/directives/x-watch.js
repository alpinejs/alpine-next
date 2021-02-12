import Alpine from '../alpine'
import { evaluator } from '../evaluator'

Alpine.directive('watch', (el, value, modifiers, expression, effect) => {
    let evaluate = evaluator(el, `$watch('${value}', $value => ${expression})`)

    setTimeout(() => {
        evaluate()
    })
})
