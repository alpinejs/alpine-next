import { mapAttributes, directive } from './directives'
import { reactive, effect } from './reactivity'
import { directives } from './directives'
import { component } from './components'
import { nextTick } from './nextTick'
import { start } from './lifecycle'
import { magic } from './magics'
import { store } from './stores'

let Alpine = {
    mapAttributes,
    component,
    directive,
    nextTick,
    reactive,
    effect,
    magic,
    store,
    start,
}

export default Alpine
