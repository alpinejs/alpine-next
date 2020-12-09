import Alpine from '../alpine'

Alpine.magic('watch', el => {
    return (key, callback) => {
        let evaluate = el._x_evaluator(key)

        let firstTime = true

        Alpine.effect(() => evaluate()(value => {
            // This is a hack to force deep reactivity for things like "items.push()"
            let div = document.createElement('div')
            div.dataset.hey = value

            if (! firstTime) callback(value)

            firstTime = false
        }))
    }
})
