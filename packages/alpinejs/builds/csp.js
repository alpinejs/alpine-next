import Alpine from './../src/index'
import { cspCompliantEvaluator } from './../src/evaluator'

window.Alpine = Alpine

Alpine.setEvaluator(cspCompliantEvaluator)

Alpine.start()

export default Alpine
