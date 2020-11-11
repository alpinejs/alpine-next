import Alpine from '../alpine'

Alpine.magic('dispatch', el => {
    return (event, detail = {}) => {
        return el._x_dispatch(event, detail)
    }
})
