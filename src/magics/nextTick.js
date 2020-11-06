import Alpine from '../alpine'

Alpine.magic('nextTick', el => {
    return (callback) => {
        setTimeout(callback)
    }
})
