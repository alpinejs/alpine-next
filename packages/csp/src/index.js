import Alpine from 'alpinejs/src/alpine'

import { cspCompliantEvaluator } from 'alpinejs/src/evaluator'
Alpine.setEvaluator(cspCompliantEvaluator)


import { reactive, effect } from '@vue/reactivity/dist/reactivity.esm-browser.prod.js'
Alpine.setReactivity(reactive, effect)

import 'alpinejs/src/magics/index'
import 'alpinejs/src/directives/index'

export default Alpine
