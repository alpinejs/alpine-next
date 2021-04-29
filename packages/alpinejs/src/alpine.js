import { setReactivityEngine, reactive, effect, stop, raw } from './reactivity'
import { mapAttributes, directive, setPrefix as prefix } from './directives'
import { start, addRootSelector, closestRoot } from './lifecycle'
import { setEvaluator, evaluate, evaluateLater } from './evaluator'
import { component } from './components'
import { nextTick } from './nextTick'
import { magic } from './magics'
import { store } from './store'
import { clone } from './clone'

let Alpine = {
    get reactive() { return reactive },
    get effect() { return effect },
    get stop() { return stop },
    get raw() { return raw },
    version: ALPINE_VERSION,
    addRootSelector,
    setReactivityEngine,
    mapAttributes,
    setEvaluator,
    evaluateLater,
    closestRoot,
    evaluate,
    component,
    directive,
    nextTick,
    prefix,
    magic,
    store,
    start,
    clone,
}

export default Alpine
