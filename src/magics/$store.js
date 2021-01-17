import Alpine from '../alpine'
import { root } from '../utils/root'

Alpine.magic('store', () => {
    return name => Alpine.getStore(name)
})
