import Alpine from '../alpine'
import { stop, pauseTracking, enableTracking } from '@vue/reactivity'

Alpine.magic('watch', el => {
    return (key, callback) => {
        let evaluate = el._x_evaluator(key)

        let firstTime = true

        let effect = Alpine.effect(() => evaluate()(value => {
            // This is a hack to force deep reactivity for things like "items.push()"
            let div = document.createElement('div')
            div.dataset.hey = value

            if (! firstTime) {
                // Stop reactivity while running the watcher.
                pauseTracking()

                callback(value)

                enableTracking()
            }

            firstTime = false
        }))
    }
})
