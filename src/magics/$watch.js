import Alpine from '../alpine'
import { stop } from '@vue/reactivity'

Alpine.magic('watch', el => {
    return (key, callback) => {
        let evaluate = el._x_evaluator(key)

        let firstTime = true

        let effect = Alpine.effect(() => evaluate()(value => {
            // This is a hack to force deep reactivity for things like "items.push()"
            let div = document.createElement('div')
            div.dataset.hey = value

            if (! firstTime) {
                stop(effect)

                // Stop reactivity while running the watcher.
                callback(value)

                effect()
            }

            firstTime = false
        }))
    }
})
