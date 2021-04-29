import Alpine from 'alpinejs/src/alpine'

import { cspCompliantEvaluator } from 'alpinejs/src/evaluator'
Alpine.setEvaluator(cspCompliantEvaluator)

import { reactive, effect, stop, toRaw } from '@vue/reactivity/dist/reactivity.esm-browser.prod.js'
Alpine.setReactivityEngine({ reactive, effect, stop, raw: toRaw })

import 'alpinejs/src/magics/index'
import 'alpinejs/src/directives/index'

export default Alpine
