import { skipDuringClone } from '../clone'
import { directive, into, mapAttributes, prefix, startingWith } from '../directives'
import { evaluateLater } from '../evaluator'
import { onDestroy } from '../lifecycle'
import on from '../utils/on'

mapAttributes(startingWith('@', into(prefix('on:'))))

directive('on', skipDuringClone((el, { value, modifiers, expression }) => {
    let evaluate = expression ?evaluateLater(el, expression) : () => {}

    let removeListener = on(el, value, modifiers, e => {
        evaluate(() => {}, { scope: { '$event': e }, params: [e] })
    })

    onDestroy(el, removeListener)
}))
