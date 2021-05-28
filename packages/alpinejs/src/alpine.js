import { setReactivityEngine, reactive, effect, release, raw } from './reactivity'
import { mapAttributes, directive, setPrefix as prefix } from './directives'
import { setEvaluator, evaluate, evaluateLater } from './evaluator'
import { start, addRootSelector, closestRoot } from './lifecycle'
import { interceptor } from './interceptor'
import { data } from './components'
import { nextTick } from './nextTick'
import { magic } from './magics'
import { plugin } from './plugin'
import { store } from './store'
import { clone } from './clone'

let Alpine = {
    get reactive() { return reactive },
    get release() { return release },
    get effect() { return effect },
    get raw() { return raw },
    version: ALPINE_VERSION,
    setReactivityEngine,
    addRootSelector,
    mapAttributes,
    evaluateLater,
    setEvaluator,
    closestRoot,
    interceptor,
    data,
    directive,
    evaluate,
    nextTick,
    prefix,
    plugin,
    magic,
    store,
    start,
    clone,
}

export default Alpine
