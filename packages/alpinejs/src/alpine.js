import { setReactivity, reactive, effect } from './reactivity'
import { mapAttributes, directive, setPrefix as prefix } from './directives'
import { start, addRootSelector } from './lifecycle'
import { setEvaluator, evaluate, evaluateLater } from './evaluator'
import { component } from './components'
import { nextTick } from './nextTick'
import { magic } from './magics'
import { store } from './store'
import { clone } from './clone'

let Alpine = {
    addRootSelector,
    setReactivity,
    mapAttributes,
    setEvaluator,
    evaluate,
    evaluateLater,
    component,
    directive,
    nextTick,
    reactive,
    effect,
    prefix,
    magic,
    store,
    start,
    clone,
}

export default Alpine
