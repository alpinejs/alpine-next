import Alpine from '../alpine'

Alpine.magic('store', () => {
    return name => Alpine.getStore(name)
})
