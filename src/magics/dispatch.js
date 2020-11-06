import Alpine from '../alpine'

Alpine.magic('dispatch', el => {
    return (event, detail = {}) => {
        return el.__x__dispatch(event, detail)
    }
})
