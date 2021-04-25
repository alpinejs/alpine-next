import Alpine from './../src/alpine'

import { cspCompliantEvaluator } from './../src/evaluator'

Alpine.setEvaluator(cspCompliantEvaluator)

import { reactive, effect } from '@vue/reactivity/dist/reactivity.esm-browser.prod.js'

Alpine.setReactivity(reactive, effect)

import './../src/magics/index'

import './../src/directives/index'

export default Alpine
