import { mapAttributes, directive } from './directives'
import { reactive, effect } from './reactivity'
import { directives } from './directives'
import { component } from './components'
import { nextTick } from './nextTick'
import { start } from './lifecycle'
import { magic } from './magics'
import { morph } from './morph'
import { store } from './stores'
import { setEvaluator } from './evaluator'
import { setReactivity } from './reactivity'

let Alpine = {
    setReactivity,
    mapAttributes,
    setEvaluator,
    component,
    directive,
    nextTick,
    reactive,
    effect,
    magic,
    morph,
    store,
    start,
}

export default Alpine
