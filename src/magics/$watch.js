import { pauseTracking, enableTracking, effect } from './../reactivity'
import { evaluator } from '../evaluator'

export default el => (key, callback) => {
    let evaluate = evaluator(el, key)

    let firstTime = true

    effect(() => evaluate(value => {
        // This is a hack to force deep reactivity for things like "items.push()".
        let div = document.createElement('div')

        div.dataset.throwAway = value

        if (! firstTime) {
            // Stop reactivity while running the watcher to avoid race conditions.
            pauseTracking()

            callback(value)

            enableTracking()
        }

        firstTime = false
    }))
}
