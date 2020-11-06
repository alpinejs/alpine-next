import Alpine from '../alpine'

Alpine.magic('watch', el => {
    return (key, callback) => {
        let evaluate = el.__x__getEvaluator(key)

        let firstTime = true

        Alpine.react(() => {
            let value = evaluate()

            // This is a hack to force deep reactivity for things like "items.push()"
            let div = document.createElement('div')
            div.dataset.hey = value

            if (! firstTime) callback(value)

            firstTime = false
        })
    }
})
